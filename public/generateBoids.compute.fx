#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;

var<private> rngState : u32;

fn rand_pcg(min: f32, max: f32) -> f32 {
  var state = rngState;
  rngState = rngState * 747796405u + 2891336453u;
  var word: u32 = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  var float = f32((word >> 22u) ^ word) / 4294967296.0;
  return float * (max - min) + min;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;
  rngState = params.rngSeed + index;

  boids[index].pos = vec2<f32>(rand_pcg(-params.xBound,params.xBound), rand_pcg(-params.yBound,params.yBound));
  boids[index].vel = vec2<f32>(rand_pcg(-1,1), rand_pcg(-1,1));
}