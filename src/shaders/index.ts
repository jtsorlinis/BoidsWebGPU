import { ComputeShader } from "../gpu";
import scanInclude from "./scan.wgsl?raw";
import sumBlocks from "./compute/sumBlocks.wgsl?raw";
import scanSums from "./compute/scanSums.wgsl?raw";
import prefixSum from "./compute/prefixSum.wgsl?raw";

// Per-boid kernels
export const boidBlockSize = 256;
// Prefix sum kernels, each group covers 4 rows of blockSize cells
export const blockSize = 256;
export const blockCells = blockSize * 4;
// Neighbour search kernels, each group stages its neighbour rows into a shared tile
export const searchBlockSize2d = 128;
export const searchBlockSize3d = 64;
const tileSize2d = 256;
const tileSize3d = 160;

// Kernels spill into a second dispatch dimension past maxGroups groups, so
// they index threads with groupsX * groupSize as the row stride
export const getDispatchSize = (
  threads: number,
  groupSize: number,
  maxGroups: number,
) => {
  const groups = Math.ceil(threads / groupSize);
  const groupsY = Math.max(1, Math.ceil(groups / maxGroups));
  return [Math.ceil(groups / groupsY), groupsY] as const;
};

// Shared by every 2D kernel
export const boidInclude2d = (params: string) => `
const boidBlockSize: u32 = ${boidBlockSize};
const blockSize: u32 = ${blockSize};
const blockCells: u32 = ${blockCells};
const searchBlockSize: u32 = ${searchBlockSize2d};
const tileSize: u32 = ${tileSize2d};

${params}

struct Boid {
  pos : vec2<f32>,
  vel : vec2<f32>,
};

// Shared so every kernel that bins a boid gets the exact same cell
fn getGridID(pos: vec2<f32>) -> u32 {
  let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);
  let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);
  return params.gridDimX * u32(y) + u32(x);
}

fn getBoidIndex(id: vec3<u32>) -> u32 {
  return id.y * params.boidStride + id.x;
}
`;

// Shared by every 3D kernel
export const boidInclude3d = (params: string) => `
const boidBlockSize: u32 = ${boidBlockSize};
const blockSize: u32 = ${blockSize};
const blockCells: u32 = ${blockCells};
const searchBlockSize: u32 = ${searchBlockSize3d};
const tileSize: u32 = ${tileSize3d};

${params}

struct Boid3d {
  pos : vec3<f32>,
  vel : vec3<f32>,
};

// vec3s are 16 byte aligned in storage, so boids are stored as 3 vec2s
// (24 bytes instead of 32) and unpacked into Boid3d
struct PackedBoid3d {
  posXY : vec2<f32>,
  posZVelX : vec2<f32>,
  velYZ : vec2<f32>,
};

fn unpackBoid(boid: PackedBoid3d) -> Boid3d {
  return Boid3d(
    vec3<f32>(boid.posXY, boid.posZVelX.x),
    vec3<f32>(boid.posZVelX.y, boid.velYZ),
  );
}

fn packBoid(boid: Boid3d) -> PackedBoid3d {
  return PackedBoid3d(boid.pos.xy, vec2<f32>(boid.pos.z, boid.vel.x), boid.vel.yz);
}

// Shared so every kernel that bins a boid gets the exact same cell
fn getGridID(pos: vec3<f32>) -> u32 {
  let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);
  let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);
  let z = i32(floor(pos.z * params.gridInverseCellSize)) + i32(params.gridDimZ / 2u);
  return params.gridDimX * params.gridDimY * u32(z) + params.gridDimX * u32(y) + u32(x);
}

fn getBoidIndex(id: vec3<u32>) -> u32 {
  return id.y * params.boidStride + id.x;
}
`;

type PrefixSumBuffers = {
  params: GPUBuffer;
  gridOffsetsIn: GPUBuffer;
  gridOffsets: GPUBuffer;
  gridSums: GPUBuffer;
};

// Generates the grid offsets (prefix sum) from the cell counts, for 2D and 3D alike:
// sums each block of cells, scans the sums, then scans each block starting from its sum
export class PrefixSum {
  private readonly shaders: readonly [ComputeShader, ComputeShader, ComputeShader];
  private bindGroups: GPUBindGroup[] = [];

  private constructor(
    shaders: readonly [ComputeShader, ComputeShader, ComputeShader],
  ) {
    this.shaders = shaders;
  }

  static async create(device: GPUDevice, include: string) {
    const shared = `${scanInclude}\n${include}`;
    const shaders = await Promise.all([
      ComputeShader.create(device, "sumBlocks", `${sumBlocks}\n${shared}`, [
        "params",
        "gridOffsetsIn",
        "gridSums",
      ]),
      ComputeShader.create(device, "scanSums", `${scanSums}\n${shared}`, [
        "params",
        "gridSums",
      ]),
      ComputeShader.create(device, "prefixSum", `${prefixSum}\n${shared}`, [
        "params",
        "gridOffsetsIn",
        "gridOffsetsOut",
        "gridSums",
      ]),
    ]);
    return new PrefixSum(shaders);
  }

  setBuffers({ params, gridOffsetsIn, gridOffsets, gridSums }: PrefixSumBuffers) {
    const buffers = { params, gridOffsetsIn, gridOffsetsOut: gridOffsets, gridSums };
    this.bindGroups = this.shaders.map((shader) =>
      shader.createBindGroup(buffers),
    );
  }

  dispatch(pass: GPUComputePassEncoder, blocks: number) {
    const [sumBlocksShader, scanSumsShader, prefixSumShader] = this.shaders;
    sumBlocksShader.dispatch(pass, this.bindGroups[0], blocks);
    scanSumsShader.dispatch(pass, this.bindGroups[1], 1);
    prefixSumShader.dispatch(pass, this.bindGroups[2], blocks);
  }
}
