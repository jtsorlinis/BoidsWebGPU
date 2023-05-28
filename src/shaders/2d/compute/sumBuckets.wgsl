#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> gridSumOfSums : array<u32>;


@compute @workgroup_size(1)
fn main() {
  for(var i = 1u; i < params.sumOfSumsBlocks; i++) {
    gridSumOfSums[i] += gridSumOfSums[i - 1];
  }
}