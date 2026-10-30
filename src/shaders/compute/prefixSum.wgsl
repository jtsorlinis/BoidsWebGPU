@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;
@binding(3) @group(0) var<storage, read> gridSums : array<u32>;

// Scans each block of cells, starting from the block's offset from scanSums
@compute @workgroup_size(blockSize)
fn main(@builtin(local_invocation_index) localID : u32, @builtin(workgroup_id) GroupID : vec3<u32>) {
  let groupID = GroupID.x;

  var counts = vec4<u32>();
  for (var row = 0u; row < 4u; row += 1u) {
    let cell = getCell(groupID, localID, row);
    if (cell < params.gridTotalCells) {
      counts[row] = gridOffsetsIn[cell];
    }
  }

  var total = 0u;
  let offsets = groupScan(counts, localID, &total) + gridSums[groupID];
  for (var row = 0u; row < 4u; row += 1u) {
    let cell = getCell(groupID, localID, row);
    if (cell < params.gridTotalCells) {
      gridOffsetsOut[cell] = offsets[row];
      // Reset the counts so the boids kernel can fill them in for next frame
      gridOffsetsIn[cell] = 0u;
    }
  }
}
