#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid3d>;
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid3d>;
@binding(3) @group(0) var<storage, read_write> gridOffsets : array<u32>;

fn getGridLocation(boid: Boid3d) -> vec3<u32> {
  var x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  var y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  var z = u32(floor(boid.pos.z / params.gridCellSize + f32(params.gridDimZ / 2)));
  return vec3<u32>(x, y, z);
}

fn getGridID(pos: vec3<u32>) -> u32 {
  return params.gridDimX * params.gridDimY * pos.z + params.gridDimX * pos.y + pos.x;
}

fn mergedBehaviours(boid: ptr<function, Boid3d>) {
  var center : vec3<f32> = vec3<f32>();
  var close : vec3<f32> = vec3<f32>();
  var avgVel : vec3<f32> = vec3<f32>();
  var neighbours: u32 = 0u;

  var gridXYZ = getGridLocation(*boid);
  var cell = getGridID(gridXYZ);
  var visualRangeSq = params.visualRangeSq;
  var minDistanceSq = params.minDistanceSq;
  var gridDimX = params.gridDimX;
  var zStep = params.gridDimX * params.gridDimY;

  // Loop around cell
  for (var z = cell - zStep; z <= cell + zStep; z += zStep) {
    for (var y = z - gridDimX; y <= z + gridDimX; y += gridDimX) {
      var start = gridOffsets[y - 2];
      var end = gridOffsets[y + 1];

      for (var i = start; i < end; i += 1) {
        var other = boidsIn[i];
        var diff = (*boid).pos - other.pos;
        var distSq = dot(diff, diff);
        if (distSq > 0 && distSq < visualRangeSq) {
          if(distSq < minDistanceSq) {
            close += diff / distSq;
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
  var speed = length((*boid).vel);
  var clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);
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
  var index : u32 = GlobalInvocationID.x;

  var boid = boidsIn[index];
  
  mergedBehaviours(&boid);
  limitSpeed(&boid);
  keepInBounds(&boid);
  
  boid.pos += boid.vel * params.dt;

  boids[index] = boid;
}