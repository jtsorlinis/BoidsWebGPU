@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<u32>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boids : array<PackedBoid3d>;
@binding(4) @group(0) var<storage, read_write> sortedIndices : array<u32>;

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  // Only the index moves, the boids kernel reads the boid through it
  let boid = unpackBoid(boids[index]);
  let sortedIndex = gridOffsets[getGridID(boid.pos)] + grid[index];
  sortedIndices[sortedIndex] = index;
}
