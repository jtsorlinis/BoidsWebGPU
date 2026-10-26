#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<u32>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boidsIn : array<PackedBoid3d>;
@binding(4) @group(0) var<storage, read_write> boidsOut : array<PackedBoid3d>;
@binding(5) @group(0) var<storage, read> templatePositions : array<vec4<f32>>;
@binding(6) @group(0) var<storage, read> templateNormals : array<vec4<f32>>;
@binding(7) @group(0) var<storage, read_write> renderPositions : array<vec4<f32>>;
@binding(8) @group(0) var<storage, read_write> renderNormals : array<vec4<f32>>;

const HALF_PI: f32 = 1.57079632679;

// Sin and cos of the pitch and yaw that turn a boid to face along its velocity
struct Rotation {
  pitch: vec2<f32>,
  yaw: vec2<f32>,
};

fn getRotation(vel: vec3<f32>) -> Rotation {
  let pitch = atan2(vel.y, length(vel.xz)) - HALF_PI;
  let yaw = atan2(vel.x, vel.z) - HALF_PI;
  return Rotation(vec2<f32>(sin(pitch), cos(pitch)), vec2<f32>(sin(yaw), cos(yaw)));
}

fn rotate3d(v: vec3<f32>, rotation: Rotation) -> vec3<f32> {
  let pitched = vec3<f32>(
    -v.y * rotation.pitch.x + v.x * rotation.pitch.y,
    v.y * rotation.pitch.y + v.x * rotation.pitch.x,
    v.z
  );
  return vec3<f32>(
    pitched.x * rotation.yaw.y + pitched.z * rotation.yaw.x,
    pitched.y,
    pitched.z * rotation.yaw.y - pitched.x * rotation.yaw.x
  );
}

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  let packed = boidsIn[index];
  let boid = unpackBoid(packed);
  let newIndex = gridOffsets[getGridID(boid.pos)] + grid[index];
  boidsOut[newIndex] = packed;

  // Building the boid's vertices here saves a separate pass over every boid,
  // and only works out its rotation once
  let rotation = getRotation(boid.vel);
  let firstVertex = index * params.verticesPerBoid;
  for (var vertex = 0u; vertex < params.verticesPerBoid; vertex += 1u) {
    // Boids are single sided, and the shadow pass pushes casters along -normal,
    // so face each triangle towards the light (flipping its winding to match)
    var templateVertex = vertex;
    var normal = rotate3d(templateNormals[vertex].xyz, rotation);
    if (dot(normal, params.lightDir) > 0.0) {
      normal = -normal;
      templateVertex += 2u - 2u * (vertex % 3u);
    }

    renderPositions[firstVertex + vertex] = vec4<f32>(
      rotate3d(templatePositions[templateVertex].xyz, rotation) + boid.pos,
      1.0
    );
    renderNormals[firstVertex + vertex] = vec4<f32>(normal, 0.0);
  }
}
