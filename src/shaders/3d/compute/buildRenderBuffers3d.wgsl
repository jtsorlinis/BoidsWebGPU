#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> boids : array<PackedBoid3d>;
@binding(2) @group(0) var<storage, read> templatePositions : array<vec4<f32>>;
@binding(3) @group(0) var<storage, read> templateNormals : array<vec4<f32>>;
@binding(4) @group(0) var<storage, read_write> renderPositions : array<vec4<f32>>;
@binding(5) @group(0) var<storage, read_write> renderNormals : array<vec4<f32>>;

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
  let totalVertices : u32 = params.numBoids * params.verticesPerBoid;
  if (index >= totalVertices) {
    return;
  }

  let boidIndex : u32 = index / params.verticesPerBoid;
  var vertexIndex : u32 = index - boidIndex * params.verticesPerBoid;
  let boid = unpackBoid(boids[boidIndex]);

  // Boids are single sided, and the shadow pass pushes casters along -normal,
  // so face each triangle towards the light (flipping its winding to match)
  var normal = rotate3d(templateNormals[vertexIndex].xyz, boid.vel);
  if (dot(normal, params.lightDir) > 0.0) {
    normal = -normal;
    vertexIndex += 2u - 2u * (vertexIndex % 3u);
  }

  renderPositions[index] = vec4<f32>(
    rotate3d(templatePositions[vertexIndex].xyz, boid.vel) + boid.pos,
    1.0
  );
  renderNormals[index] = vec4<f32>(normal, 0.0);
}
