#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;
@binding(3) @group(0) var<storage, read_write> gridSums : array<u32>;

var<workgroup> temp : array<u32, 2 * 256>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, 
        @builtin(local_invocation_id) LocalInvocationID: vec3<u32>,
        @builtin(workgroup_id) GroupID: vec3<u32>) {
  var globalID = GlobalInvocationID.x;
  var localID = LocalInvocationID.x;
  var groupID = GroupID.x;
  var pout: u32 = 0;
  var pin: u32 = 1;

  temp[localID] = gridOffsetsIn[globalID];
  workgroupBarrier();

  for (var offset: u32 = 1; offset < 256; offset *= 2) {
    pout = 1 - pout; // swap double buffer indices
    pin = 1 - pout;
    if (localID >= offset) {
        temp[pout * 256 + localID] = temp[pin * 256 + localID] + temp[pin * 256 + localID - offset];
    } else {
        temp[pout * 256 + localID] = temp[pin * 256 + localID];
    }
    workgroupBarrier();
  }

  // Don't write out of bounds
  if (globalID >= params.gridTotalCells) {
      return;
  }

  gridOffsetsOut[globalID] = temp[pout * 256 + localID];
  if (localID == 0) {
      gridSums[groupID] = temp[pout * 256 + 256 - 1];
  } 
}