#include<boid3dInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read_write> gridOffsets : array<atomic<u32>>;
@binding(3) @group(0) var<storage, read> boids : array<Boid3d>;

fn getGridID(boid: Boid3d) -> u32 {
  let x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  let y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  let z = u32(floor(boid.pos.z / params.gridCellSize + f32(params.gridDimZ / 2)));
  return params.gridDimX * params.gridDimY * z + params.gridDimX * y + x;
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  let gridID = getGridID(boids[index]);
  grid[index].x = gridID;
  grid[index].y = atomicAdd(&gridOffsets[gridID], 1);
}