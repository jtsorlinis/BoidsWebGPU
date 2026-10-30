import { LinearSRGBColorSpace, NodeMaterial, QuadMesh } from "three/webgpu";
import { createCamera2D } from "./cameras";
import {
  type GPUContext,
  Params,
  createStorageBuffer,
  shareWithRenderer,
} from "./gpu";
import {
  PrefixSum,
  blockCells,
  boidBlockSize,
  boidInclude2d,
  getDispatchSize,
  searchBlockSize2d,
} from "./shaders";
import { createComputeShaders2d, createRasterMaterial } from "./shaders/2d";

const edgeMargin = 0.5;
const maxSpeed = 2;
const visualRange = 0.5;
const minDistance = 0.15;
const cohesionFactor = 2;
const alignmentFactor = 5;
const separationFactor = 1;
const backgroundColour = [0.19215687, 0.3019608, 0.4745098] as const;

export const createSim = async (
  { device, renderer }: GPUContext,
  canvas: HTMLCanvasElement,
  initialBoids: number,
) => {
  // The raster's colours go to the screen as they are
  renderer.outputColorSpace = LinearSRGBColorSpace;

  const maxBlocks = device.limits.maxComputeWorkgroupsPerDimension;
  // Same limit as Unity, unless the boid buffers would be too big to bind
  const maxBufferSize = Math.min(
    device.limits.maxStorageBufferBindingSize,
    device.limits.maxBufferSize,
  );
  const boidLimit = Math.min(1024 * maxBlocks, Math.floor(maxBufferSize / 16));

  const params = new Params(device, {
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
    avoidMouse: "u32",
    zoom: "f32",
    mousePos: "vec2<f32>",
    renderWidth: "u32",
    renderHeight: "u32",
    viewportHalfSize: "vec2<f32>",
    cameraPos: "vec2<f32>",
  });

  const include = boidInclude2d(params.wgsl);
  const [{ generateBoidsShader, rearrangeBoidsShader, boidsShader }, prefixSum] =
    await Promise.all([
      createComputeShaders2d(device, include),
      PrefixSum.create(device, include),
    ]);

  const abort = new AbortController();
  const view = createCamera2D(canvas, abort.signal);

  // Where the pointer is on the canvas, in CSS pixels
  const pointer = { x: 0, y: 0 };
  canvas.addEventListener(
    "pointermove",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    },
    { signal: abort.signal },
  );

  let numBoids = initialBoids;
  let pendingNumBoids = 0;
  let blocks = 0;
  let boidGroupsX = 0;
  let boidGroupsY = 0;
  let updateGroupsX = 0;
  let updateGroupsY = 0;

  // The boids kernel reads one boid buffer and writes the next frame's boids to
  // the other, so there's a set of bind groups for each way round
  let boidBuffers: GPUBuffer[] = [];
  let simBuffers: GPUBuffer[] = [];
  let rearrangeBindGroups: GPUBindGroup[] = [];
  let boidsBindGroups: GPUBindGroup[] = [];
  let current = 0;
  let gridBuffer: GPUBuffer;
  let sortedIndexBuffer: GPUBuffer;
  let gridOffsetBuffer: GPUBuffer;

  // Screen sized raster the boids are drawn into, shown by a fullscreen quad
  let quad: QuadMesh | null = null;
  let rasterBuffer: GPUBuffer | null = null;
  let rasterMaterial: NodeMaterial | null = null;
  let rasterWidth = 0;
  let rasterHeight = 0;

  const bindRearrange = () => {
    rearrangeBindGroups = boidBuffers.map((boids) =>
      rearrangeBoidsShader.createBindGroup({
        params: params.buffer,
        grid: gridBuffer,
        gridOffsets: gridOffsetBuffer,
        boids,
        sortedIndices: sortedIndexBuffer,
        raster: rasterBuffer!,
      }),
    );
  };

  const ensureRaster = () => {
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    if (rasterBuffer && width === rasterWidth && height === rasterHeight) {
      return;
    }

    rasterBuffer?.destroy();
    rasterMaterial?.dispose();
    rasterBuffer = createStorageBuffer(device, width * height * 4);
    rasterWidth = width;
    rasterHeight = height;
    rasterMaterial = createRasterMaterial(
      shareWithRenderer(renderer, rasterBuffer, 1),
      width,
      height,
      backgroundColour,
    );
    if (quad) {
      quad.material = rasterMaterial;
    } else {
      quad = new QuadMesh(rasterMaterial);
    }
    if (boidBuffers.length > 0) {
      bindRearrange();
    }
  };

  const setup = () => {
    // Zoom camera based on number of boids
    view.resetView(Math.max(2, Math.sqrt(numBoids) / 10 + edgeMargin));
    const aspect = rasterWidth / rasterHeight;
    const xBound = view.orthoSize * aspect - edgeMargin;
    const yBound = view.orthoSize - edgeMargin;

    // Spatial grid setup
    const gridDimX = Math.floor((xBound * 2) / visualRange) + 30;
    const gridDimY = Math.floor((yBound * 2) / visualRange) + 30;
    const gridTotalCells = gridDimX * gridDimY;
    blocks = Math.ceil(gridTotalCells / blockCells);

    [boidGroupsX, boidGroupsY] = getDispatchSize(numBoids, boidBlockSize, maxBlocks);
    [updateGroupsX, updateGroupsY] = getDispatchSize(
      numBoids,
      searchBlockSize2d,
      maxBlocks,
    );

    params.set("numBoids", numBoids);
    params.set("xBound", xBound);
    params.set("yBound", yBound);
    params.set("maxSpeed", maxSpeed);
    params.set("minSpeed", maxSpeed * 0.75);
    params.set("turnSpeed", maxSpeed * 3);
    params.set("visualRangeSq", visualRange * visualRange);
    params.set("minDistanceSq", minDistance * minDistance);
    params.set("cohesionFactor", cohesionFactor);
    params.set("alignmentFactor", alignmentFactor);
    params.set("separationFactor", separationFactor);
    params.set("gridDimX", gridDimX);
    params.set("gridDimY", gridDimY);
    params.set("gridInverseCellSize", 1 / visualRange);
    params.set("gridTotalCells", gridTotalCells);
    params.set("boidStride", boidGroupsX * boidBlockSize);
    params.set("updateGroupsX", updateGroupsX);
    params.set("rngSeed", Math.floor(Math.random() * 10000000));
    params.set("blocks", blocks);
    params.update();

    boidBuffers = [
      createStorageBuffer(device, numBoids * 16),
      createStorageBuffer(device, numBoids * 16),
    ];
    gridBuffer = createStorageBuffer(device, numBoids * 4);
    sortedIndexBuffer = createStorageBuffer(device, numBoids * 4);
    // Cell counts, which the prefix sum turns into offsets
    const gridOffsetBufferIn = createStorageBuffer(device, gridTotalCells * 4);
    gridOffsetBuffer = createStorageBuffer(device, gridTotalCells * 4);
    const gridSumsBuffer = createStorageBuffer(device, blocks * 4);
    simBuffers = [
      ...boidBuffers,
      gridBuffer,
      sortedIndexBuffer,
      gridOffsetBufferIn,
      gridOffsetBuffer,
      gridSumsBuffer,
    ];

    prefixSum.setBuffers({
      params: params.buffer,
      gridOffsetsIn: gridOffsetBufferIn,
      gridOffsets: gridOffsetBuffer,
      gridSums: gridSumsBuffer,
    });
    bindRearrange();
    boidsBindGroups = boidBuffers.map((boidsIn, i) =>
      boidsShader.createBindGroup({
        params: params.buffer,
        boidsIn,
        boidsOut: boidBuffers[1 - i],
        sortedIndices: sortedIndexBuffer,
        gridOffsets: gridOffsetBuffer,
        gridOffsetsIn: gridOffsetBufferIn,
        grid: gridBuffer,
      }),
    );
    current = 0;

    // Generate boids on GPU, also bins them into the (zero initialised) grid
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    generateBoidsShader.dispatch(
      pass,
      generateBoidsShader.createBindGroup({
        params: params.buffer,
        boids: boidBuffers[0],
        gridOffsets: gridOffsetBufferIn,
        grid: gridBuffer,
      }),
      boidGroupsX,
      boidGroupsY,
    );
    pass.end();
    device.queue.submit([encoder.finish()]);
  };

  const disposeSimBuffers = () => {
    for (const buffer of simBuffers) buffer.destroy();
    simBuffers = [];
    boidBuffers = [];
  };

  ensureRaster();
  setup();

  const frame = (deltaTime: number) => {
    // Restart here rather than from the slider, so it happens at most once a frame
    if (pendingNumBoids > 0) {
      numBoids = pendingNumBoids;
      pendingNumBoids = 0;
      disposeSimBuffers();
      setup();
    }

    ensureRaster();
    view.update(deltaTime);

    const aspect = rasterWidth / rasterHeight;
    const rect = canvas.getBoundingClientRect();
    const mouseX =
      (pointer.x / rect.width - 0.5) * view.orthoSize * 2 * aspect + view.x;
    const mouseY = -(pointer.y / rect.height - 0.5) * view.orthoSize * 2 + view.y;
    params.set("dt", deltaTime);
    params.set("zoom", view.orthoSize / 3);
    params.set("mousePos", [mouseX, mouseY]);
    params.set("renderWidth", rasterWidth);
    params.set("renderHeight", rasterHeight);
    params.set("viewportHalfSize", [view.orthoSize * aspect, view.orthoSize]);
    params.set("cameraPos", [view.x, view.y]);
    params.update();

    const encoder = device.createCommandEncoder();
    // Cleared first, the rearrange pass draws the boids
    encoder.clearBuffer(rasterBuffer!);
    const pass = encoder.beginComputePass();
    prefixSum.dispatch(pass, blocks);
    // Sort boid indices by cell (and draw the boids)
    rearrangeBoidsShader.dispatch(
      pass,
      rearrangeBindGroups[current],
      boidGroupsX,
      boidGroupsY,
    );
    // Compute boid behaviours
    boidsShader.dispatch(pass, boidsBindGroups[current], updateGroupsX, updateGroupsY);
    pass.end();
    device.queue.submit([encoder.finish()]);
    current = 1 - current;

    quad!.render(renderer);
  };

  return {
    boidLimit,
    frame,
    setNumBoids: (count: number) => {
      pendingNumBoids = Math.min(count, boidLimit);
    },
    setAvoidMouse: (avoid: boolean) => {
      params.set("avoidMouse", avoid ? 1 : 0);
    },
    dispose: () => {
      abort.abort();
      disposeSimBuffers();
      rasterBuffer?.destroy();
      rasterMaterial?.dispose();
      params.dispose();
    },
  };
};
