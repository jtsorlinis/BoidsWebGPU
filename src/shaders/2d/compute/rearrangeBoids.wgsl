#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<u32>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(4) @group(0) var<storage, read_write> boidsOut : array<Boid>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  let boid = boidsIn[index];
  let newIndex = gridOffsets[getGridID(boid.pos)] + grid[index];
  boidsOut[newIndex] = boid;
}
