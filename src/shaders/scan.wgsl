// Shared by the prefix sum kernels, which also get the boid include for Params and blockSize

fn getCell(groupID: u32, localID: u32, row: u32) -> u32 {
  return groupID * blockCells + row * blockSize + localID;
}

var<workgroup> scanTemp : array<array<vec4<u32>, blockSize>, 2>;

// Exclusive scan of a group's 4 rows of values in row order, total gets their sum
fn groupScan(values: vec4<u32>, localID: u32, total: ptr<function, u32>) -> vec4<u32> {
  // The previous scan may still be reading scanTemp
  workgroupBarrier();
  var inclusive = values;
  var buf = 0u;
  for (var offset = 1u; offset < blockSize; offset *= 2u) {
    scanTemp[buf][localID] = inclusive;
    workgroupBarrier();
    if (localID >= offset) {
      inclusive += scanTemp[buf][localID - offset];
    }
    buf ^= 1u;
  }
  buf ^= 1u;
  // The last step stored sums of each half of the rows
  let rowTotals = scanTemp[buf][blockSize - 1u] + scanTemp[buf][blockSize / 2u - 1u];
  *total = rowTotals.x + rowTotals.y + rowTotals.z + rowTotals.w;
  return inclusive - values + vec4<u32>(0u, rowTotals.x, rowTotals.x + rowTotals.y, *total - rowTotals.w);
}
