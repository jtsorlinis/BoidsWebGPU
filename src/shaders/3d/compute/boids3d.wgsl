#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<PackedBoid3d>;
@binding(2) @group(0) var<storage, read> boidsIn : array<PackedBoid3d>;
@binding(3) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(4) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(5) @group(0) var<storage, read_write> grid : array<u32>;

fn mergedBehaviours(boid: ptr<function, Boid3d>) {
  var center : vec3<f32> = vec3<f32>();
  var close : vec3<f32> = vec3<f32>();
  var avgVel : vec3<f32> = vec3<f32>();
  var neighbours: u32 = 0u;

  let cell = getGridID((*boid).pos);
  let visualRangeSq = params.visualRangeSq;
  let minDistanceSq = params.minDistanceSq;
  let zStep = params.gridDimX * params.gridDimY;

  // Loop around own cell (3x3x3 neighborhood).
  for (var z: i32 = -1; z <= 1; z += 1) {
    for (var y: i32 = -1; y <= 1; y += 1) {
      let gridIdx = u32(
        i32(cell) + z * i32(zStep) + y * i32(params.gridDimX),
      );
      let start = gridOffsets[gridIdx - 1u];
      let end = gridOffsets[gridIdx + 2u];

      for (var i = start; i < end; i += 1) {
        let other = unpackBoid(boidsIn[i]);
        let diff = (*boid).pos - other.pos;
        let distSq = dot(diff, diff);
        if (distSq < visualRangeSq && distSq > 0.0) {
          if(distSq < minDistanceSq) {
            let invDistSq = 1.0 / distSq;
            close += diff * invDistSq;
          }
          center += other.pos;
          avgVel += other.vel;
          neighbours += 1u;
        }
      }
    }
  }

  if (neighbours > 0u) {
    center /= f32(neighbours);
    avgVel /= f32(neighbours);
    (*boid).vel += (center - (*boid).pos) * (params.cohesionFactor * params.dt);
    (*boid).vel += (avgVel - (*boid).vel) * (params.alignmentFactor * params.dt);
  }

  (*boid).vel += close * (params.separationFactor * params.dt);
}

fn limitSpeed(boid: ptr<function, Boid3d>) {
  let speed = length((*boid).vel);
  let clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);
  (*boid).vel *= clampedSpeed / speed;
}

fn keepInBounds(boid: ptr<function, Boid3d>) {
  if (abs((*boid).pos.x) > params.xBound) {
    (*boid).vel.x -= sign((*boid).pos.x) * params.turnSpeed * params.dt;
  } 
  if (abs((*boid).pos.y) > params.yBound) {
    (*boid).vel.y -= sign((*boid).pos.y) * params.turnSpeed * params.dt;
  } 
  if (abs((*boid).pos.z) > params.zBound) {
    (*boid).vel.z -= sign((*boid).pos.z) * params.turnSpeed * params.dt;
  }
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  var boid = unpackBoid(boidsIn[index]);
  
  mergedBehaviours(&boid);
  limitSpeed(&boid);
  keepInBounds(&boid);
  
  boid.pos += boid.vel * params.dt;

  boids[index] = packBoid(boid);

  // Bin the boid into next frame's grid, saving a separate update grid pass
  grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);
}
