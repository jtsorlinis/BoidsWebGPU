@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> gridSums : array<u32>;

// Single group, turns the block totals into block offsets in place
@compute @workgroup_size(blockSize)
fn main(@builtin(local_invocation_index) localID : u32) {
  var carry = 0u;
  for (var first = 0u; first < params.blocks; first += blockCells) {
    var sums = vec4<u32>();
    for (var row = 0u; row < 4u; row += 1u) {
      let i = first + row * blockSize + localID;
      if (i < params.blocks) {
        sums[row] = gridSums[i];
      }
    }

    var total = 0u;
    let offsets = groupScan(sums, localID, &total) + carry;
    for (var row = 0u; row < 4u; row += 1u) {
      let i = first + row * blockSize + localID;
      if (i < params.blocks) {
        gridSums[i] = offsets[row];
      }
    }
    carry += total;
  }
}
