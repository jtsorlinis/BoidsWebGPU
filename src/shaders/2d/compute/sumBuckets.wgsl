#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridSumsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridSumsOut : array<u32>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.blocks) {
    return;
  }

  if(index < params.divider) {
    gridSumsOut[index] = gridSumsIn[index];
  } else {
    gridSumsOut[index] = gridSumsIn[index] + gridSumsIn[index - params.divider];
  }
}