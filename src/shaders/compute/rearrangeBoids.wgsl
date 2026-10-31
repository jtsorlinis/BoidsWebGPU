@binding(0) @group(0) var<uniform> params : Params;
// Each boid's (cell, rank in that cell), from when the boid was binned
@binding(1) @group(0) var<storage, read> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read_write> sortedIndices : array<u32>;

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  // Only the index moves, the boids kernel reads the boid through it
  let slot = grid[index];
  sortedIndices[gridOffsets[slot.x] + slot.y] = index;
}
