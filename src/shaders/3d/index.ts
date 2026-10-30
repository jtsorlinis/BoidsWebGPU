import {
  Color,
  DoubleSide,
  MeshStandardNodeMaterial,
  type StorageBufferAttribute,
} from "three/webgpu";
import {
  Fn,
  instanceIndex,
  mix,
  normalWorldGeometry,
  positionGeometry,
  pow,
  sRGBTransferEOTF,
  select,
  smoothstep,
  storage,
  uniform,
  vec3,
  vertexIndex,
  wgslFn,
} from "three/tsl";
import type { BoidKernels } from "..";
import include from "./boid3d.wgsl?raw";
import boids3d from "./compute/boids3d.wgsl?raw";
import generateBoids3d from "./compute/generateBoids3d.wgsl?raw";
import rearrangeBoids3d from "./compute/rearrangeBoids3d.wgsl?raw";

export const kernels3d: BoidKernels = {
  label: "3d",
  include,
  generateBoids: generateBoids3d,
  rearrangeBoids: rearrangeBoids3d,
  boids: boids3d,
  rearrangeBindings: ["params", "grid", "gridOffsets", "boids", "sortedIndices"],
  // A PackedBoid3d
  boidBytes: 24,
  searchBlockSize: 64,
  tileSize: 160,
  boidLimitPerGroup: 256,
};

const boidVertex = wgslFn(`
fn boidVertex(posXY: vec2<f32>, posZVelX: vec2<f32>, velYZ: vec2<f32>, local: vec3<f32>) -> vec3<f32> {
  const halfPi = 1.57079632679;
  const boidScale = 0.1;
  let pos = vec3<f32>(posXY, posZVelX.x);
  let vel = vec3<f32>(posZVelX.y, velYZ);

  var v = local * boidScale;

  let pitch = atan2(vel.y, length(vel.xz)) - halfPi;
  v = vec3<f32>(-v.y * sin(pitch) + v.x * cos(pitch), v.y * cos(pitch) + v.x * sin(pitch), v.z);
  let yaw = atan2(vel.x, vel.z) - halfPi;
  v = vec3<f32>(v.x * cos(yaw) + v.z * sin(yaw), v.y, v.z * cos(yaw) - v.x * sin(yaw));

  let world = v + pos;
  return vec3<f32>(world.xy, -world.z);
}
`);

// Boid triangles per instance. Instancing a single triangle leaves most of each vertex
// warp idle, which made the boid and shadow draws ~3x slower
export const boidsPerInstance = 256;

// Places each boid's triangle from a boid buffer
export const createBoidMaterial = (
  boids: StorageBufferAttribute,
  numBoids: number,
) => {
  // Each boid is 3 vec2s, see PackedBoid3d
  const packed = storage(boids, "vec2", numBoids * 3).toReadOnly();
  // The last instance's spare triangles repeat the last boid
  const index = instanceIndex.mul(boidsPerInstance).add(vertexIndex.div(3));
  const lastBoid = uniform(numBoids - 1, "uint");
  const boid = select(index.greaterThan(lastBoid), lastBoid, index).mul(3);

  // Single triangles, so their (flat) normals face whichever side is visible
  const material = new MeshStandardNodeMaterial({
    color: new Color(1, 0.02, 0),
    roughness: 0.5,
    metalness: 0,
    side: DoubleSide,
    flatShading: true,
  });
  material.positionNode = boidVertex({
    posXY: packed.element(boid),
    posZVelX: packed.element(boid.add(1)),
    velYZ: packed.element(boid.add(2)),
    local: positionGeometry,
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
