import { ComputeShader } from "../gpu";
import scanInclude from "./scan.wgsl?raw";
import sumBlocks from "./compute/sumBlocks.wgsl?raw";
import scanSums from "./compute/scanSums.wgsl?raw";
import prefixSum from "./compute/prefixSum.wgsl?raw";

// Sorts boid indices by cell, the same kernel for 2D and 3D
export { default as rearrangeBoids } from "./compute/rearrangeBoids.wgsl?raw";

// Per-boid kernels
export const boidBlockSize = 256;
// Prefix sum kernels, each group covers 4 rows of blockSize cells
const blockSize = 256;
export const blockCells = blockSize * 4;

// A view's (2D or 3D) boid kernels, and what running them needs to know
export type BoidKernels = {
  label: string;
  // The view's Boid struct and getGridID, shared by its kernels
  include: string;
  generateBoids: string;
  boids: string;
  // Bindings the boids kernel takes after the shared ones, 2D's also draws into a raster
  viewBindings: readonly string[];
  boidBytes: number;
  // Neighbour search kernels, each group stages its neighbour rows into a shared tile
  searchBlockSize: number;
  tileSize: number;
  // Boid limit, as a multiple of the groups a dispatch dimension can have
  boidLimitPerGroup: number;
};

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

// Shared by every boid kernel
export const boidInclude = (params: string, kernels: BoidKernels) => `
const boidBlockSize: u32 = ${boidBlockSize};
const blockSize: u32 = ${blockSize};
const blockCells: u32 = ${blockCells};
const searchBlockSize: u32 = ${kernels.searchBlockSize};
const tileSize: u32 = ${kernels.tileSize};
// Passes for a group to stage a full tile, one boid per thread each pass
const stagePasses: u32 = (tileSize + searchBlockSize - 1u) / searchBlockSize;

${params}

fn getBoidIndex(id: vec3<u32>) -> u32 {
  return id.y * params.boidStride + id.x;
}

// Stateless random generation
fn pcg_hash(input: u32) -> u32 {
  let state = input * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn rand_pcg(input: u32, min: f32, max: f32) -> f32 {
  let float = f32(pcg_hash(input)) / 4294967296.0;
  return float * (max - min) + min;
}

${kernels.include}
`;

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
        "gridOffsets",
        "gridSums",
      ]),
    ]);
    return new PrefixSum(shaders);
  }

  setBuffers(buffers: Record<string, GPUBuffer>) {
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
