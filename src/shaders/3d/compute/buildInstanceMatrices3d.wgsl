#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> boids : array<Boid3d>;
@binding(2) @group(0) var<storage, read_write> instanceMatrices : array<mat4x4<f32>>;

const HALF_PI: f32 = 1.57079632679;

fn rotate3d(v: vec3<f32>, vel: vec3<f32>) -> vec3<f32> {
  let pitch = atan2(vel.y, length(vel.xz)) - HALF_PI;
  let pitched = vec3<f32>(
    -v.y * sin(pitch) + v.x * cos(pitch),
    v.y * cos(pitch) + v.x * sin(pitch),
    v.z
  );
  let yaw = atan2(vel.x, vel.z) - HALF_PI;
  return vec3<f32>(
    pitched.x * cos(yaw) + pitched.z * sin(yaw),
    pitched.y,
    pitched.z * cos(yaw) - pitched.x * sin(yaw)
  );
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;
  if (index >= params.numBoids) {
    return;
  }

  let boid = boids[index];
  let xAxis = rotate3d(vec3<f32>(1.0, 0.0, 0.0), boid.vel);
  let yAxis = rotate3d(vec3<f32>(0.0, 1.0, 0.0), boid.vel);
  let zAxis = rotate3d(vec3<f32>(0.0, 0.0, 1.0), boid.vel);

  instanceMatrices[index] = mat4x4<f32>(
    vec4<f32>(xAxis, 0.0),
    vec4<f32>(yAxis, 0.0),
    vec4<f32>(zAxis, 0.0),
    vec4<f32>(boid.pos, 1.0)
  );
}
