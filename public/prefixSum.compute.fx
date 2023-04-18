#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  if (index >= params.gridTotalCells) {
    return;
  }

  if(index < params.divider) {
    gridOffsetsOut[index] = gridOffsetsIn[index];
  } else {
    gridOffsetsOut[index] = gridOffsetsIn[index] + gridOffsetsIn[index - params.divider];
  }
}