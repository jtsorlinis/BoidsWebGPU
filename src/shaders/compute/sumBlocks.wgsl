@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridSums : array<u32>;

var<workgroup> sumTemp : array<u32, blockSize>;

@compute @workgroup_size(blockSize)
fn main(@builtin(local_invocation_index) localID : u32, @builtin(workgroup_id) GroupID : vec3<u32>) {
  let groupID = GroupID.x;

  var sum = 0u;
  for (var row = 0u; row < 4u; row += 1u) {
    let cell = getCell(groupID, localID, row);
    if (cell < params.gridTotalCells) {
      sum += gridOffsetsIn[cell];
    }
  }
  sumTemp[localID] = sum;
  workgroupBarrier();

  for (var stride = blockSize / 2u; stride > 0u; stride /= 2u) {
    if (localID < stride) {
      sumTemp[localID] += sumTemp[localID + stride];
    }
    workgroupBarrier();
  }

  if (localID == 0u) {
    gridSums[groupID] = sumTemp[0];
  }
}
