import { Boid, Params } from "./types";

export const clearGridComputeSource = `
${Params}

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> gridOffsets : array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  if (index >= params.gridTotalCells) {
    return;
  }

  gridOffsets[index] = 0u;
}
`;

export const updateGridComputeSource = `
${Params}
${Boid}

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read_write> gridOffsets : array<atomic<u32>>;
@binding(3) @group(0) var<storage, read> boids : array<Boid>;

fn getGridID(boid: Boid) -> u32 {
  var x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  var y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  return (params.gridDimX * y) + x;
}

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  var gridID = getGridID(boids[index]);
  grid[index].x = gridID;
  grid[index].y = atomicAdd(&gridOffsets[gridID], 1);
}
`;

export const prefixSumComputeSource = `
${Params}

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;
@binding(3) @group(0) var<uniform> divider : u32;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  if (index >= params.gridTotalCells) {
    return;
  }

  if(index < divider) {
    gridOffsetsOut[index] = gridOffsetsIn[index];
  } else {
    gridOffsetsOut[index] = gridOffsetsIn[index] + gridOffsetsIn[index - divider];
  }
}
`;

export const rearrangeBoidsComputeSource = `
${Params}
${Boid}

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(4) @group(0) var<storage, read_write> boidsOut : array<Boid>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  var index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  var gridID = grid[index].x;
  var cellOffset = grid[index].y;
  var newIndex = gridOffsets[gridID] - 1 - cellOffset;
  boidsOut[newIndex] = boidsIn[index];
}
`;
