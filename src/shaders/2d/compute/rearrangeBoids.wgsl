#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(4) @group(0) var<storage, read_write> boidsOut : array<Boid>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  let gridID = grid[index].x;
  let cellOffset = grid[index].y;
  let newIndex = gridOffsets[gridID] - 1 - cellOffset;
  boidsOut[newIndex] = boidsIn[index];
}