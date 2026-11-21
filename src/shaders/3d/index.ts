import {
  Color,
  DoubleSide,
  MeshStandardNodeMaterial,
  type StorageBufferAttribute,
} from "three/webgpu";
import {
  Fn,
  mix,
  normalWorldGeometry,
  pow,
  sRGBTransferEOTF,
  smoothstep,
  storage,
  vec3,
  vertexIndex,
  wgslFn,
} from "three/tsl";
import type { BoidKernels } from "..";
import include from "./boid3d.wgsl?raw";
import boids3d from "./compute/boids3d.wgsl?raw";
import generateBoids3d from "./compute/generateBoids3d.wgsl?raw";

export const kernels3d: BoidKernels = {
  label: "3d",
  include,
  generateBoids: generateBoids3d,
  boids: boids3d,
  viewBindings: [],
  // A PackedBoid3d
  boidBytes: 24,
  searchBlockSize: 64,
  // As big as it goes: past 5,376 bytes of shared memory a group, an RTX 4070 slows down
  tileSize: 224,
  boidLimitPerGroup: 256,
};

// A boid is drawn as a triangle, or as a bird from above: a body and two wings
export const boidVertices = (birds: boolean) => (birds ? 9 : 3);

const triangleVertex = wgslFn(`
fn triangleVertex(pos: vec3<f32>, vel: vec3<f32>, corner: u32) -> vec3<f32> {
  const halfPi = 1.57079632679;
  const boidScale = 0.1;

  // The triangle's corners: (-0.4, -0.5), (0, 0.5), (0.4, -0.5)
  let local = vec3<f32>((f32(corner) - 1.0) * 0.4, select(-0.5, 0.5, corner == 1u), 0.0);
  var v = local * boidScale;

  let pitch = atan2(vel.y, length(vel.xz)) - halfPi;
  v = vec3<f32>(-v.y * sin(pitch) + v.x * cos(pitch), v.y * cos(pitch) + v.x * sin(pitch), v.z);
  let yaw = atan2(vel.x, vel.z) - halfPi;
  v = vec3<f32>(v.x * cos(yaw) + v.z * sin(yaw), v.y, v.z * cos(yaw) - v.x * sin(yaw));

  let world = v + pos;
  return vec3<f32>(world.xy, -world.z);
}
`);

const birdVertex = wgslFn(`
fn birdVertex(pos: vec3<f32>, vel: vec3<f32>, corner: u32) -> vec3<f32> {
  const boidScale = 0.1;
  // How far the wingtips swing above and below where they rest in level flight, as a
  // share of the wing
  const wingSwing = 0.7;
  // How far above level the wingtips rest, so they lift higher than they drop
  const wingRest = 0.15;
  // How far above level the wingtips are held in a glide
  const wingGlide = 0.3;
  // The slope it glides down, and the climb it flaps hardest on, as the sine of the angle
  const glideSlope = 0.4;
  // How much further the wingtips swing on that climb
  const climbSwing = 0.15;
  // How far a dive straight down tucks the wingtips back, in body lengths, and in
  // towards the spine, as a share of the way
  const tuckBack = 0.3;
  const tuckIn = 0.55;
  // Radians of wave per unit flown along it
  const waveNumber = 16.0;
  // Three directions at right angles to each other, and none along the bounds
  const waveAxes = mat3x3<f32>(2.0, 3.0, 6.0, 3.0, -6.0, 2.0, 6.0, 2.0, -3.0) * (1.0 / 7.0);

  // Each corner's (distance back from the beak, distance out to the side, 1 if a wingtip),
  // in body lengths. The body widens from the beak to a fanned tail, and each wing sweeps
  // back from the spine to its tip, so lifting the two tips folds the bird along its spine.
  const shape = array<vec3<f32>, 9>(
    vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 0.14, 0.0), vec3<f32>(1.0, -0.14, 0.0),
    vec3<f32>(0.2, 0.0, 0.0), vec3<f32>(0.55, 0.0, 0.0), vec3<f32>(0.62, 0.7, 1.0),
    vec3<f32>(0.2, 0.0, 0.0), vec3<f32>(0.55, 0.0, 0.0), vec3<f32>(0.62, -0.7, 1.0),
  );
  let tip = shape[corner].z;

  // Level across the wings, however steeply the boid climbs
  let forward = normalize(vel);
  let level = vec3<f32>(forward.z, 0.0, -forward.x);
  let side = level * inverseSqrt(max(dot(level, level), 1e-12));
  let up = cross(forward, side);

  // Diving steeper than it glides, the wingtips tuck back and in
  let tuck = smoothstep(glideSlope, 1.0, -forward.y) * tip;
  let back = shape[corner].x + tuck * tuckBack;
  let out = shape[corner].y * (1.0 - tuck * tuckIn);

  // The wings follow waves that stay where they are, so they beat as the boid flies
  // through them: faster boids beat faster, and neighbours are out of step. That needs
  // nothing stored per boid, which there's nowhere to keep as the boids are re-sorted
  // each frame. Each wave counts by how much of the boid's heading is along it.
  let heading = waveAxes * forward;
  let beat = dot(heading * heading, sin(waveAxes * pos * waveNumber));

  // How hard it flaps: not at all down the glide slope, 1 in level flight, and hardest up
  // a climb that steep
  let steep = clamp(forward.y / glideSlope, -1.0, 1.0);
  let effort = 1.0 + steep * select(climbSwing, 1.0, steep < 0.0);

  // A wingtip turns about the spine, so the wing keeps its length as it lifts
  let rest = mix(wingGlide, wingRest, min(effort, 1.0));
  let lift = (beat * wingSwing * effort + rest) * tip;
  let reach = sqrt(1.0 - lift * lift);

  let local = forward * (0.5 - back) + side * (out * reach) + up * (abs(out) * lift);
  let world = pos + local * boidScale;
  return vec3<f32>(world.xy, -world.z);
}
`);

// Places each boid's triangle or bird from a boid buffer
export const createBoidMaterial = (
  boids: StorageBufferAttribute,
  numBoids: number,
  birds: boolean,
) => {
  const vertices = boidVertices(birds);
  const boidVertex = birds ? birdVertex : triangleVertex;
  // Each boid is 6 floats, see PackedBoid3d
  const packed = storage(boids, "float", numBoids * 6).toReadOnly();
  const boid = vertexIndex.div(vertices).mul(6);

  // Flat triangles, so their normals face whichever side is visible, and follow the wings
  const material = new MeshStandardNodeMaterial({
    color: new Color(1, 0.02, 0),
    roughness: 0.5,
    metalness: 0,
    side: DoubleSide,
    flatShading: true,
  });
  material.positionNode = boidVertex({
    pos: vec3(
      packed.element(boid),
      packed.element(boid.add(1)),
      packed.element(boid.add(2)),
    ),
    vel: vec3(
      packed.element(boid.add(3)),
      packed.element(boid.add(4)),
      packed.element(boid.add(5)),
    ),
    corner: vertexIndex.mod(vertices),
  });
  return material;
};

const zenithSky = vec3(0.45, 0.55, 0.71);
const horizonSky = vec3(0.65, 0.76, 0.88);
const horizonGlow = vec3(0.84, 0.92, 0.94);
const groundSky = vec3(0.44, 0.42, 0.4);

export const skyNode = Fn(() => {
  const dirY = normalWorldGeometry.y;

  const skyBlend = smoothstep(0.0, 0.95, dirY.mul(0.5).add(0.5));
  const groundBlend = smoothstep(-0.08, 0.02, dirY);
  const skyMix = pow(skyBlend, 0.8);
  const glow = smoothstep(-0.01, 0.05, dirY).mul(
    smoothstep(0.08, 0.22, dirY).oneMinus(),
  );

  const sky = mix(horizonSky, zenithSky, skyMix);
  const base = mix(groundSky, sky, groundBlend);
  // The renderer works in linear, and converts back to sRGB for the screen
  return sRGBTransferEOTF(mix(base, horizonGlow, glow.mul(0.7)));
})();
