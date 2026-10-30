import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardNodeMaterial,
  type Node,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Vector3,
} from "three/webgpu";
import {
  cameraPosition,
  mix,
  positionWorld,
  saturate,
  uniform,
  vec4,
} from "three/tsl";
import { CSMShadowNode } from "three/addons/csm/CSMShadowNode.js";
import { createCamera3D } from "./cameras";
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
  boidInclude3d,
  getDispatchSize,
  searchBlockSize3d,
} from "./shaders";
import {
  createBoidMaterial,
  createComputeShaders3d,
  skyNode,
} from "./shaders/3d";

const edgeMargin = 0.5;
const maxSpeed = 2;
const visualRange = 0.5;
const minDistance = 0.15;
const cohesionFactor = 2;
const alignmentFactor = 5;
const separationFactor = 1;

const sunDirection = new Vector3(
  -0.3213937660622072,
  -0.7660444011712928,
  -0.5566704252156701,
);
const sunColour = new Color().setRGB(1, 0.95686275, 0.8392157, SRGBColorSpace);
const sunIntensity = Math.PI;
const ambientSky = new Color().setRGB(0.36, 0.45, 0.62, SRGBColorSpace);
const ambientGround = new Color().setRGB(0.3, 0.28, 0.26, SRGBColorSpace);
const ambientIntensity = Math.PI;
const shadowMapSize = 8192;

export const createSim = async (
  { device, renderer }: GPUContext,
  canvas: HTMLCanvasElement,
  initialBoids: number,
) => {
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const maxBlocks = device.limits.maxComputeWorkgroupsPerDimension;
  const maxBufferSize = Math.min(
    device.limits.maxStorageBufferBindingSize,
    device.limits.maxBufferSize,
  );
  const boidLimit = Math.min(256 * maxBlocks, Math.floor(maxBufferSize / 24));

  const params = new Params(device, {
    numBoids: "u32",
    xBound: "f32",
    yBound: "f32",
    zBound: "f32",
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
    gridDimZ: "u32",
    gridInverseCellSize: "f32",
    gridTotalCells: "u32",
    boidStride: "u32",
    updateGroupsX: "u32",
    rngSeed: "u32",
    blocks: "u32",
  });

  const include = boidInclude3d(params.wgsl);
  const [{ generateBoidsShader, rearrangeBoidsShader, boidsShader }, prefixSum] =
    await Promise.all([
      createComputeShaders3d(device, include),
      PrefixSum.create(device, include),
    ]);

  const scene = new Scene();
  scene.backgroundNode = skyNode;

  const camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.3, 1000);
  const abort = new AbortController();
  const controls = createCamera3D(camera, canvas, abort.signal);

  const sun = new DirectionalLight(sunColour, sunIntensity);
  sun.position.copy(sunDirection).negate();
  sun.castShadow = true;
  const mapSize = Math.min(shadowMapSize, device.limits.maxTextureDimension2D);
  sun.shadow.mapSize.set(mapSize, mapSize);
  sun.shadow.bias = -0.0001;
  sun.shadow.normalBias = 0.01;
  sun.shadow.radius = 2;
  const csm = new CSMShadowNode(sun, {
    cascades: 2,
    mode: "custom",
    customSplitsCallback: (_cascades, _near, _far, breaks) => {
      breaks.push(0.2, 1);
    },
  });
  const shadowFadeScale = uniform(0);
  const shadowFadeBias = uniform(0);
  const cameraToPixel = positionWorld.sub(cameraPosition);
  const shadowFade = saturate(
    cameraToPixel.dot(cameraToPixel).mul(shadowFadeScale).add(shadowFadeBias),
  );
  // CSMShadowNode is a vec4, its types just don't say so
  const csmShadow = csm as unknown as Node<"vec4">;
  sun.shadow.shadowNode = mix(csmShadow, vec4(1, 1, 1, 1), shadowFade);
  scene.add(sun, sun.target);
  scene.add(new HemisphereLight(ambientSky, ambientGround, ambientIntensity));

  const floorGeometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const floorMaterial = new MeshStandardNodeMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  scene.add(floor);

  // One triangle, instanced per boid
  const boidGeometry = new BufferGeometry();
  boidGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([-0.4, -0.5, 0, 0, 0.5, 0, 0.4, -0.5, 0]), 3),
  );
  const boidMesh = new Mesh(boidGeometry);
  boidMesh.frustumCulled = false;
  boidMesh.castShadow = true;
  boidMesh.receiveShadow = true;
  scene.add(boidMesh);

  let numBoids = initialBoids;
  let pendingNumBoids = 0;
  let blocks = 0;
  let boidGroupsX = 0;
  let boidGroupsY = 0;
  let updateGroupsX = 0;
  let updateGroupsY = 0;
  let viewWidth = 0;
  let viewHeight = 0;

  // The boids kernel reads one boid buffer and writes the next frame's boids to
  // the other, so there's a set of bind groups (and a material) for each way round
  let simBuffers: GPUBuffer[] = [];
  let rearrangeBindGroups: GPUBindGroup[] = [];
  let boidsBindGroups: GPUBindGroup[] = [];
  let boidMaterials: MeshStandardNodeMaterial[] = [];
  let current = 0;

  const updateShadows = (spaceBounds: number) => {
    const shadowDistance = spaceBounds * 6.5;
    csm.maxFar = shadowDistance;
    // Far enough back towards the sun to catch every boid between it and the view
    csm.lightMargin = spaceBounds * 4;
    const far = csm.lightMargin + shadowDistance * 2;
    for (const { shadow } of [sun, ...csm.lights]) {
      shadow!.camera.far = far;
      shadow!.camera.updateProjectionMatrix();
    }

    const fadeNearSq = (0.95 * shadowDistance) ** 2;
    shadowFadeScale.value = 1 / (shadowDistance ** 2 - fadeNearSq);
    shadowFadeBias.value = -fadeNearSq * shadowFadeScale.value;

    // The cascades are made on the first render, after that they need updating
    if (csm.camera) {
      csm.updateFrustums();
    }
  };

  const setup = () => {
    const spaceBounds = Math.max(1, Math.pow(numBoids, 1 / 3) / 7.5 + edgeMargin);
    controls.resetView(spaceBounds * 3.8);
    floor.scale.set(spaceBounds * 4, 1, spaceBounds * 4);
    floor.position.y = -spaceBounds - 1;
    updateShadows(spaceBounds);

    const xBound = 2 * spaceBounds - edgeMargin;
    const yBound = spaceBounds - edgeMargin;
    const zBound = 2 * spaceBounds - edgeMargin;

    // Spatial grid setup
    const gridDimX = Math.floor((xBound * 2) / visualRange) + 20;
    const gridDimY = Math.floor((yBound * 2) / visualRange) + 20;
    const gridDimZ = Math.floor((zBound * 2) / visualRange) + 20;
    const gridTotalCells = gridDimX * gridDimY * gridDimZ;
    blocks = Math.ceil(gridTotalCells / blockCells);

    [boidGroupsX, boidGroupsY] = getDispatchSize(numBoids, boidBlockSize, maxBlocks);
    [updateGroupsX, updateGroupsY] = getDispatchSize(
      numBoids,
      searchBlockSize3d,
      maxBlocks,
    );

    params.set("numBoids", numBoids);
    params.set("xBound", xBound);
    params.set("yBound", yBound);
    params.set("zBound", zBound);
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
    params.set("gridDimZ", gridDimZ);
    params.set("gridInverseCellSize", 1 / visualRange);
    params.set("gridTotalCells", gridTotalCells);
    params.set("boidStride", boidGroupsX * boidBlockSize);
    params.set("updateGroupsX", updateGroupsX);
    params.set("rngSeed", Math.floor(Math.random() * 10000000));
    params.set("blocks", blocks);
    params.update();

    const boidBuffers = [
      createStorageBuffer(device, numBoids * 24),
      createStorageBuffer(device, numBoids * 24),
    ];
    const gridBuffer = createStorageBuffer(device, numBoids * 4);
    const sortedIndexBuffer = createStorageBuffer(device, numBoids * 4);
    // Cell counts, which the prefix sum turns into offsets
    const gridOffsetBufferIn = createStorageBuffer(device, gridTotalCells * 4);
    const gridOffsetBuffer = createStorageBuffer(device, gridTotalCells * 4);
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
    rearrangeBindGroups = boidBuffers.map((boids) =>
      rearrangeBoidsShader.createBindGroup({
        params: params.buffer,
        grid: gridBuffer,
        gridOffsets: gridOffsetBuffer,
        boids,
        sortedIndices: sortedIndexBuffer,
      }),
    );
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

    boidMaterials = boidBuffers.map((boids) =>
      createBoidMaterial(shareWithRenderer(renderer, boids, 2), numBoids),
    );
    boidMesh.material = boidMaterials[current];
    boidMesh.count = numBoids;

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

  const disposeSimResources = () => {
    for (const material of boidMaterials) material.dispose();
    for (const buffer of simBuffers) buffer.destroy();
    boidMaterials = [];
    simBuffers = [];
  };

  setup();

  const frame = (deltaTime: number) => {
    // Restart here rather than from the slider, so it happens at most once a frame
    if (pendingNumBoids > 0) {
      numBoids = pendingNumBoids;
      pendingNumBoids = 0;
      disposeSimResources();
      setup();
    }

    if (canvas.width !== viewWidth || canvas.height !== viewHeight) {
      viewWidth = canvas.width;
      viewHeight = canvas.height;
      camera.aspect = viewWidth / viewHeight;
      camera.updateProjectionMatrix();
      if (csm.camera) {
        csm.updateFrustums();
      }
    }
    controls.update(deltaTime);

    params.set("dt", deltaTime);
    params.update();

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    prefixSum.dispatch(pass, blocks);
    // Sort boid indices by cell
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

    // Draw the boids just written
    current = 1 - current;
    boidMesh.material = boidMaterials[current];
    renderer.render(scene, camera);
  };

  return {
    boidLimit,
    frame,
    setNumBoids: (count: number) => {
      pendingNumBoids = Math.min(count, boidLimit);
    },
    setAvoidMouse: () => {},
    dispose: () => {
      abort.abort();
      disposeSimResources();
      csm.dispose();
      sun.shadow.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      boidGeometry.dispose();
      params.dispose();
    },
  };
};
