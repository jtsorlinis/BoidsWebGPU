import {
  ComputeShader,
  type ParamType,
  Params,
  createStorageBuffer,
} from "./gpu";
import {
  type BoidKernels,
  PrefixSum,
  blockCells,
  boidBlockSize,
  boidInclude,
  getDispatchSize,
  rearrangeBoids,
} from "./shaders";

export const edgeMargin = 0.5;
export const visualRange = 0.5;
const maxSpeed = 2;
const minDistance = 0.15;
const cohesionFactor = 2;
const alignmentFactor = 5;
const separationFactor = 1;

// Each view adds params of its own
const sharedParams = {
  numBoids: "u32",
  xBound: "f32",
  yBound: "f32",
  maxSpeed: "f32",
  minSpeed: "f32",
  turnSpeed: "f32",
  visualRangeSq: "f32",
  minDistanceSq: "f32",
  cohesionFactor: "f32",
  alignmentFactor: "f32",
  separationFactor: "f32",
  dt: "f32",
  gridDimX: "u32",
  gridDimY: "u32",
  gridInverseCellSize: "f32",
  gridTotalCells: "u32",
  boidStride: "u32",
  updateGroupsX: "u32",
  rngSeed: "u32",
  blocks: "u32",
} satisfies Record<string, ParamType>;

// The simulation both views run: each frame the boids are sorted by grid cell,
// then each one steers by the boids in its neighbouring cells
export const createBoidCompute = async <Name extends string>(
  device: GPUDevice,
  kernels: BoidKernels,
  viewParams: Record<Name, ParamType>,
) => {
  const maxBlocks = device.limits.maxComputeWorkgroupsPerDimension;
  const maxBufferSize = Math.min(
    device.limits.maxStorageBufferBindingSize,
    device.limits.maxBufferSize,
  );
  const boidLimit = Math.min(
    kernels.boidLimitPerGroup * maxBlocks,
    Math.floor(maxBufferSize / kernels.boidBytes),
  );

  const params = new Params(device, { ...sharedParams, ...viewParams });
  params.set("maxSpeed", maxSpeed);
  params.set("minSpeed", maxSpeed * 0.75);
  params.set("turnSpeed", maxSpeed * 3);
  params.set("visualRangeSq", visualRange * visualRange);
  params.set("minDistanceSq", minDistance * minDistance);
  params.set("cohesionFactor", cohesionFactor);
  params.set("alignmentFactor", alignmentFactor);
  params.set("separationFactor", separationFactor);
  params.set("gridInverseCellSize", 1 / visualRange);

  const include = boidInclude(params.wgsl, kernels);
  const { label } = kernels;
  const [generateBoidsShader, rearrangeBoidsShader, boidsShader, prefixSum] =
    await Promise.all([
      ComputeShader.create(
        device,
        `generateBoids${label}`,
        `${kernels.generateBoids}\n${include}`,
        ["params", "boids", "gridOffsetsIn", "grid"],
      ),
      ComputeShader.create(
        device,
        `rearrangeBoids${label}`,
        `${rearrangeBoids}\n${include}`,
        ["params", "grid", "gridOffsets", "sortedIndices"],
      ),
      ComputeShader.create(device, `boids${label}`, `${kernels.boids}\n${include}`, [
        "params",
        "boidsIn",
        "boidsOut",
        "sortedIndices",
        "gridOffsets",
        "gridOffsetsIn",
        "grid",
        ...kernels.viewBindings,
      ]),
      PrefixSum.create(device, include),
    ]);

  let blocks = 0;
  let boidGroups: readonly [number, number] = [0, 0];
  let updateGroups: readonly [number, number] = [0, 0];

  // The boids kernel reads one boid buffer and writes the next frame's boids to
  // the other, so there's a bind group for each way round
  let boidBuffers: GPUBuffer[] = [];
  let gridBuffers: Record<string, GPUBuffer> = {};
  let viewBuffers: Record<string, GPUBuffer> = {};
  let rearrangeBindGroup: GPUBindGroup | null = null;
  let boidsBindGroups: GPUBindGroup[] = [];
  let current = 0;

  // Every buffer but the boids, by binding name
  const sharedBuffers = () => ({
    params: params.buffer,
    ...gridBuffers,
    ...viewBuffers,
  });

  const bindBoids = () => {
    boidsBindGroups = boidBuffers.map((boidsIn, i) =>
      boidsShader.createBindGroup({
        ...sharedBuffers(),
        boidsIn,
        boidsOut: boidBuffers[1 - i],
      }),
    );
  };

  const destroyBuffers = () => {
    for (const buffer of boidBuffers) buffer.destroy();
    for (const buffer of Object.values(gridBuffers)) buffer.destroy();
  };

  return {
    params,
    boidLimit,
    get boidBuffers() {
      return boidBuffers;
    },
    // The boid buffer the last frame wrote
    get current() {
      return current;
    },

    // Buffers the view's boids kernel binds as well (2D's raster)
    setViewBuffers: (buffers: Record<string, GPUBuffer>) => {
      viewBuffers = buffers;
      bindBoids();
    },

    // Restarts with newly generated boids, in the bounds and grid the view gives
    setup: <Grid extends keyof typeof sharedParams | Name>(
      numBoids: number,
      gridTotalCells: number,
      gridParams: Record<Grid, number>,
    ) => {
      destroyBuffers();
      blocks = Math.ceil(gridTotalCells / blockCells);
      boidGroups = getDispatchSize(numBoids, boidBlockSize, maxBlocks);
      updateGroups = getDispatchSize(
        numBoids,
        kernels.searchBlockSize,
        maxBlocks,
      );

      for (const name in gridParams) {
        params.set(name, gridParams[name]);
      }
      params.set("numBoids", numBoids);
      params.set("gridTotalCells", gridTotalCells);
      params.set("boidStride", boidGroups[0] * boidBlockSize);
      params.set("updateGroupsX", updateGroups[0]);
      params.set("rngSeed", Math.floor(Math.random() * 10000000));
      params.set("blocks", blocks);
      params.update();

      boidBuffers = [
        createStorageBuffer(device, numBoids * kernels.boidBytes),
        createStorageBuffer(device, numBoids * kernels.boidBytes),
      ];
      gridBuffers = {
        // Each boid's cell and its rank in that cell
        grid: createStorageBuffer(device, numBoids * 8),
        sortedIndices: createStorageBuffer(device, numBoids * 4),
        // Cell counts, which the prefix sum turns into offsets
        gridOffsetsIn: createStorageBuffer(device, gridTotalCells * 4),
        gridOffsets: createStorageBuffer(device, gridTotalCells * 4),
        gridSums: createStorageBuffer(device, blocks * 4),
      };
      prefixSum.setBuffers(sharedBuffers());
      rearrangeBindGroup = rearrangeBoidsShader.createBindGroup(sharedBuffers());
      bindBoids();
      current = 0;

      // Generate boids on GPU, also bins them into the (zero initialised) grid
      const encoder = device.createCommandEncoder();
      const pass = encoder.beginComputePass();
      generateBoidsShader.dispatch(
        pass,
        generateBoidsShader.createBindGroup({
          ...sharedBuffers(),
          boids: boidBuffers[0],
        }),
        ...boidGroups,
      );
      pass.end();
      device.queue.submit([encoder.finish()]);
    },

    // Runs a frame of the simulation, after the view has set its params for it
    encode: (encoder: GPUCommandEncoder, deltaTime: number) => {
      params.set("dt", deltaTime);
      params.update();

      const pass = encoder.beginComputePass();
      prefixSum.dispatch(pass, blocks);
      // Sort boid indices by cell
      rearrangeBoidsShader.dispatch(pass, rearrangeBindGroup!, ...boidGroups);
      // Compute boid behaviours (2D also draws the boids here)
      boidsShader.dispatch(pass, boidsBindGroups[current], ...updateGroups);
      pass.end();
      current = 1 - current;
    },

    dispose: () => {
      destroyBuffers();
      params.dispose();
    },
  };
};
