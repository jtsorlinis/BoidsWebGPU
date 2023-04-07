export const boidComputeSource = `
struct Boid {
    pos : vec2<f32>,
    vel : vec2<f32>,
};

struct Params {
  numBoids: u32,
  xBound : f32,
  yBound : f32,
  maxSpeed : f32,
  minSpeed : f32,
  turnSpeed: f32,
  visualRange : f32,
  minDistance : f32,
  cohesionFactor : f32,
  alignmentFactor : f32,
  separationFactor : f32,
  dt : f32,
};

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  var boid = boids[index];
  
  // merged behaviours
  var center : vec2<f32> = vec2<f32>(0.0, 0.0);
  var close : vec2<f32> = vec2<f32>(0.0, 0.0);
  var avgVel : vec2<f32> = vec2<f32>(0.0, 0.0);
  var neighbours: u32 = 0u;

  for (var i = 0u; i < params.numBoids; i += 1) {
    var other = boids[i];
    var distance = distance(boid.pos, boids[i].pos);
    if (distance > 0.0 && distance < params.visualRange) {
      if(distance < params.minDistance) {
        close += boid.pos - other.pos;
      }
      center += other.pos;
      avgVel += other.vel;
      neighbours += 1u;
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
