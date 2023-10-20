#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridSumsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;


@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, @builtin(workgroup_id) GroupID: vec3<u32>) {
  let globalID : u32 = GlobalInvocationID.x;
  let groupID : u32 = GroupID.x;

 if (groupID == 0 || globalID > params.gridTotalCells) {
    return;
  }
  gridOffsetsOut[globalID] += gridSumsIn[groupID - 1];
}