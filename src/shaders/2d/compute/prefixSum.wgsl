#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;
@binding(3) @group(0) var<storage, read_write> gridSums : array<u32>;

var<workgroup> temp : array<u32, 2 * blockSize>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, 
        @builtin(local_invocation_id) LocalInvocationID: vec3<u32>,
        @builtin(workgroup_id) GroupID: vec3<u32>) {
  let globalID = GlobalInvocationID.x;
  let localID = LocalInvocationID.x;
  let groupID = GroupID.x;
  var pout: u32 = 0;
  var pin: u32 = 1;

  temp[localID] = gridOffsetsIn[globalID];
  workgroupBarrier();

  for (var offset: u32 = 1; offset < blockSize; offset *= 2) {
    pout = 1 - pout; // swap double buffer indices
    pin = 1 - pout;
    if (localID >= offset) {
        temp[pout * blockSize + localID] = temp[pin * blockSize + localID] + temp[pin * blockSize + localID - offset];
    } else {
        temp[pout * blockSize + localID] = temp[pin * blockSize + localID];
    }
    workgroupBarrier();
  }

  // Don't write out of bounds
  if (globalID >= params.gridTotalCells) {
      return;
  }

  gridOffsetsOut[globalID] = temp[pout * blockSize + localID];
  if (localID == 0) {
      gridSums[groupID] = temp[pout * blockSize + blockSize - 1];
  } 
}