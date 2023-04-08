import { Boid, Params } from "./types";

export const boidComputeSource = `
${Params}
${Boid}

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(3) @group(0) var<storage, read_write> gridOffsets : array<u32>;

fn getGridLocation(boid: Boid) -> vec2<u32> {
  var x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  var y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  return vec2<u32>(x, y);
}

fn getGridID(pos: vec2<u32>) -> u32 {
  return (params.gridDimX * pos.y) + pos.x;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  var boid = boidsIn[index];
  
  // merged behaviours
  var center : vec2<f32> = vec2<f32>(0.0, 0.0);
  var close : vec2<f32> = vec2<f32>(0.0, 0.0);
  var avgVel : vec2<f32> = vec2<f32>(0.0, 0.0);
  var neighbours: u32 = 0u;

  var gridXY = getGridLocation(boid);
  var cell = getGridID(gridXY);

  // Loop around cell
  for(var y = cell - params.gridDimX; y <= cell + params.gridDimX; y += params.gridDimX) {
    var start = gridOffsets[y - 2];
    var end = gridOffsets[y + 1];

    for (var i = start; i < end; i += 1) {
      var other = boidsIn[i];
      var distance = distance(boid.pos, other.pos);
      if (distance > 0.0 && distance < params.visualRange) {
        if(distance < params.minDistance) {
          close += boid.pos - other.pos;
        }
        center += other.pos;
        avgVel += other.vel;
        neighbours += 1u;
      }
    }
  }

  if (neighbours > 0u) {
    center /= f32(neighbours);
    avgVel /= f32(neighbours);
    boid.vel += (center - boid.pos) * (params.cohesionFactor * params.dt);
    boid.vel += (avgVel - boid.vel) * (params.alignmentFactor * params.dt);
  }

  boid.vel += close * (params.separationFactor * params.dt);

  // limit speed
  var speed = length(boid.vel);
  if (speed > params.maxSpeed) {
    boid.vel = normalize(boid.vel) * params.maxSpeed;
  }
  if (speed < params.minSpeed) {
    boid.vel = normalize(boid.vel) * params.minSpeed;
  }

  // keep in bounds
  if (boid.pos.x < -params.xBound) {
    boid.vel.x += params.turnSpeed * params.dt;
  } else if (boid.pos.x > params.xBound) {
    boid.vel.x -= params.turnSpeed * params.dt;
  }
  if (boid.pos.y > params.yBound) {
    boid.vel.y -= params.turnSpeed * params.dt;
  } else if (boid.pos.y < -params.yBound) {
    boid.vel.y += params.turnSpeed * params.dt;
  }

  boid.pos += boid.vel * params.dt;

  boids[index] = boid;
}
`;
