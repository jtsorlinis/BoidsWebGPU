#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(3) @group(0) var<storage, read_write> gridOffsets : array<u32>;

fn getGridLocation(boid: Boid) -> vec2<u32> {
  let x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  let y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  return vec2<u32>(x, y);
}

fn getGridID(pos: vec2<u32>) -> u32 {
  return (params.gridDimX * pos.y) + pos.x;
}

fn mergedBehaviours(boid: ptr<function,Boid>) {
  var center : vec2<f32> = vec2<f32>();
  var close : vec2<f32> = vec2<f32>();
  var avgVel : vec2<f32> = vec2<f32>();
  var neighbours: u32 = 0u;

  let gridXY = getGridLocation(*boid);
  let cell = getGridID(gridXY);
  let visualRangeSq = params.visualRangeSq;
  let minDistanceSq = params.minDistanceSq;

  // Loop around cell
  for(var y = cell - params.gridDimX; y <= cell + params.gridDimX; y += params.gridDimX) {
    let start = gridOffsets[y - 2];
    let end = gridOffsets[y + 1];

    for (var i = start; i < end; i += 1) {
      let other = boidsIn[i];
      let diff = (*boid).pos - other.pos;
      let distSq = dot(diff, diff);
      let notSelf = select(0., 1., distSq > 0);
      let inVisualRange = notSelf * select(0., 1., distSq < visualRangeSq);
      let tooClose = notSelf * select(0., 1., distSq < minDistanceSq);

      if(distSq > 0) {
        close += tooClose * (diff / distSq);
      }

      center += inVisualRange * other.pos;
      avgVel += inVisualRange * other.vel;
      neighbours += u32(inVisualRange);
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

fn limitSpeed(boid: ptr<function, Boid>) {
  let speed = length((*boid).vel);
  let clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);
  (*boid).vel *= clampedSpeed / speed;
}

fn keepInBounds(boid: ptr<function, Boid>) {
  if (abs((*boid).pos.x) > params.xBound) {
    (*boid).vel.x -= sign((*boid).pos.x) * params.turnSpeed * params.dt;
  } 
  if (abs((*boid).pos.y) > params.yBound) {
    (*boid).vel.y -= sign((*boid).pos.y) * params.turnSpeed * params.dt;
  } 
}

fn avoidPredators(boid: ptr<function, Boid>) {
  if(distance((*boid).pos, params.mousePos) < params.zoom
      && abs((*boid).pos.y) < params.yBound
      && abs((*boid).pos.x) < params.xBound) {
      let dist = max(sqrt(params.minDistanceSq), distance((*boid).pos, params.mousePos) / params.zoom);
      let force = normalize((*boid).pos - params.mousePos) / pow(dist,2);
      (*boid).vel += force * params.dt;
  }
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  var boid = boidsIn[index];
  
  mergedBehaviours(&boid);
  limitSpeed(&boid);
  keepInBounds(&boid);
  if (params.avoidMouse > 0) {
    avoidPredators(&boid);
  }
  
  boid.pos += boid.vel * params.dt;

  boids[index] = boid;
}