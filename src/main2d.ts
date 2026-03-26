import {
  BufferAttribute,
  Color,
  OrthographicCamera,
  Scene,
  Vector2,
  Vector3,
  WebGPURenderer,
} from "three/webgpu";
import {
  float,
  storage,
  struct,
  uint,
  uniform,
  workgroupArray,
} from "three/tsl";
import { createBoidGpuDeformMesh2d } from "./materials/boidGpuDeform2d";
import { triangleMesh } from "./meshes/triangleMesh";
import { createBoidCompute2d } from "./shaders/boidCompute2d";
import { createGridShader2d } from "./shaders/gridShader2d";
import {
  patchRendererForGpuOnlyStorage,
  requestWebGPUDeviceWithMaxLimits,
} from "./utils/webgpu";

const EDGE_MARGIN = 0.5;
const MAX_SPEED = 2;
const VISUAL_RANGE = 0.5;
const MIN_DISTANCE = 0.15;
const COHESION_FACTOR = 2;
const ALIGNMENT_FACTOR = 5;
const SEPARATION_FACTOR = 1;
const DEFAULT_WORKGROUP_SIZE = 64;

const Boid2d = struct(
  {
    pos: "vec2",
    vel: "vec2",
  },
  "Boid2d",
) as any;

const floatUniform = (value: number) =>
  uniform(value as any, "float" as any) as any;
const uintUniform = (value: number) =>
  uniform(value as any, "uint" as any) as any;
const storageNode = (value: any, type: any, count?: any) =>
  (storage as any)(value, type, count) as any;
const workgroupArrayNode = (type: any, count: any) =>
  (workgroupArray as any)(type, count) as any;

const createGpuOnlyStorageNode = (count: number, type: any) => {
  let itemSize = 1;
  let typeClass:
    | Float32ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor = Float32Array;

  if (type?.isStruct === true) {
    itemSize = type.layout.getLength();
  } else if (type === "uvec2") {
    itemSize = 2;
    typeClass = Uint32Array;
  } else if (type === "uint") {
    typeClass = Uint32Array;
  } else if (type === "int") {
    typeClass = Int32Array;
  }

  // Three infers "array of structs" vs "single struct" from the backing array
  // length, so keep a tiny placeholder array even though the real allocation is
  // GPU-only and sized via `gpuOnlyByteLength`.
  const attribute = new BufferAttribute(
    new typeClass(itemSize * 2),
    itemSize,
  ) as any;
  attribute.count = count;
  attribute.isStorageBufferAttribute = true;
  attribute.isGpuOnlyStorageBufferAttribute = true;
  attribute.gpuOnlyByteLength = count * itemSize * typeClass.BYTES_PER_ELEMENT;

  return storageNode(attribute, type, count);
};

const createParamNodes = () => ({
  avoidMouse: uintUniform(0),
  divider: uintUniform(1),
  dt: floatUniform(1 / 60),
  mousePos: uniform(new Vector2()) as any,
  zoom: floatUniform(1),
});

type ParamNodes = ReturnType<typeof createParamNodes>;

type Bounds = {
  aspectRatio: number;
  blocks: number;
  gridDimX: number;
  gridDimY: number;
  gridTotalCells: number;
  orthoSize: number;
  xBound: number;
  yBound: number;
};

const computeBounds = (
  numBoids: number,
  aspectRatio: number,
  workgroupSize: number,
): Bounds => {
  const orthoSize = Math.max(2, Math.sqrt(numBoids) / 10 + EDGE_MARGIN);
  const xBound = orthoSize * aspectRatio - EDGE_MARGIN;
  const yBound = orthoSize - EDGE_MARGIN;
  const gridDimX = Math.floor((xBound * 2) / VISUAL_RANGE) + 30;
  const gridDimY = Math.floor((yBound * 2) / VISUAL_RANGE) + 30;
  const gridTotalCells = gridDimX * gridDimY;
  const blocks = Math.ceil(gridTotalCells / workgroupSize);

  return {
    aspectRatio,
    blocks,
    gridDimX,
    gridDimY,
    gridTotalCells,
    orthoSize,
    xBound,
    yBound,
  };
};

const createSimulation = (
  params: ParamNodes,
  numBoids: number,
  workgroupSize: number,
  bounds: Bounds,
) => {
  const boids = createGpuOnlyStorageNode(numBoids, Boid2d);
  const boidsSorted = createGpuOnlyStorageNode(numBoids, Boid2d);
  const grid = createGpuOnlyStorageNode(numBoids, "uvec2");
  const gridOffsets = createGpuOnlyStorageNode(bounds.gridTotalCells, "uint");
  const gridOffsetsInclusive = createGpuOnlyStorageNode(
    bounds.gridTotalCells,
    "uint",
  );
  const gridSums = createGpuOnlyStorageNode(bounds.blocks, "uint");
  const gridSumsScratch = createGpuOnlyStorageNode(bounds.blocks, "uint");
  const gridOffsetsAtomic = storageNode(
    gridOffsets.value,
    "uint",
    gridOffsets.value.count,
  ).toAtomic();

  const alignmentFactor: any = float(ALIGNMENT_FACTOR);
  const cellSize: any = float(VISUAL_RANGE);
  const cohesionFactor: any = float(COHESION_FACTOR);
  const gridDimXFloat: any = float(bounds.gridDimX);
  const gridDimYFloat: any = float(bounds.gridDimY);
  const gridDimXUint: any = uint(bounds.gridDimX);
  const blocksUint: any = uint(bounds.blocks);
  const gridTotalCellsUint: any = uint(bounds.gridTotalCells);
  const half: any = float(0.5);
  const lastLocalIndex: any = uint(workgroupSize - 1);
  const minDistance: any = float(MIN_DISTANCE);
  const minDistanceSq: any = float(MIN_DISTANCE * MIN_DISTANCE);
  const maxSpeed: any = float(MAX_SPEED);
  const minSpeed: any = float(MAX_SPEED * 0.75);
  const numBoidsUint: any = uint(numBoids);
  const oneUint: any = uint(1);
  const prefixTemp = workgroupArrayNode("uint", workgroupSize * 2);
  const separationFactor: any = float(SEPARATION_FACTOR);
  const turnSpeed: any = float(MAX_SPEED * 3);
  const visualRangeSq: any = float(VISUAL_RANGE * VISUAL_RANGE);
  const workgroupSizeUint: any = uint(workgroupSize);
  const xBound: any = float(bounds.xBound);
  const yBound: any = float(bounds.yBound);
  const zeroUint: any = uint(0);
  const gridShader = createGridShader2d({
    blocksUint,
    boids,
    boidsSorted,
    bounds,
    cellSize,
    grid,
    gridDimXFloat,
    gridDimXUint,
    gridDimYFloat,
    gridOffsets,
    gridOffsetsAtomic,
    gridOffsetsInclusive,
    gridSums,
    gridSumsScratch,
    gridTotalCellsUint,
    half,
    lastLocalIndex,
    numBoids,
    numBoidsUint,
    oneUint,
    params,
    prefixTemp,
    workgroupSize,
    workgroupSizeUint,
    zeroUint,
  });

  const boidCompute = createBoidCompute2d({
    alignmentFactor,
    boids,
    boidsSorted,
    cohesionFactor,
    getGridId: gridShader.getGridId,
    getGridLocation: gridShader.getGridLocation,
    gridDimXUint,
    gridOffsetsInclusive,
    maxSpeed,
    minDistance,
    minDistanceSq,
    minSpeed,
    numBoids,
    numBoidsUint,
    oneUint,
    params,
    separationFactor,
    turnSpeed,
    visualRangeSq,
    workgroupSize,
    xBound,
    yBound,
    zeroUint,
  });

  return {
    addBlockSums: gridShader.addBlockSums,
    boids,
    boidsSorted,
    bounds,
    clearGrid: gridShader.clearGrid,
    finalizeGridSums: gridShader.finalizeGridSums,
    generateBoids: boidCompute.generateBoids,
    grid,
    gridOffsets,
    gridOffsetsInclusive,
    gridSums,
    rearrangeBoids: gridShader.rearrangeBoids,
    prefixSumGrid: gridShader.prefixSumGrid,
    scanBlockSumsBackward: gridShader.scanBlockSumsBackward,
    scanBlockSumsForward: gridShader.scanBlockSumsForward,
    updateBoids: boidCompute.updateBoids,
    updateGrid: gridShader.updateGrid,
    workgroupSize,
  };
};

export const boids2d = async () => {
  let numBoids = 32;
  let disposed = false;
  let rebuildVersion = 0;
  let rebuildDebounce = 0;
  let orthoSize = 2;
  let targetZoom = orthoSize;

  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const boidText = document.getElementById("boidText") as HTMLElement;
  const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;
  const avoidToggle = document.getElementById(
    "avoidToggle",
  ) as HTMLInputElement;
  const fpsText = document.getElementById("fpsText") as HTMLElement;

  avoidToggle.checked = false;

  let renderer: WebGPURenderer | null = null;
  let scene: Scene | null = null;
  let camera: OrthographicCamera | null = null;

  const currentMouseWorld = new Vector2();
  const pointerWorld = new Vector3();
  let isPanning = false;

  const getAspectRatio = () =>
    window.innerWidth / Math.max(window.innerHeight, 1);

  const updateCameraProjection = () => {
    if (camera === null) {
      return;
    }

    camera.left = -orthoSize * getAspectRatio();
    camera.right = orthoSize * getAspectRatio();
    camera.top = orthoSize;
    camera.bottom = -orthoSize;
    camera.updateProjectionMatrix();
  };

  const updateMouseWorld = (clientX: number, clientY: number) => {
    if (camera === null) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

    pointerWorld.set(x, y, 0).unproject(camera);
    currentMouseWorld.set(pointerWorld.x, pointerWorld.y);
    renderFrame.params.mousePos.value.copy(currentMouseWorld);
  };

  const renderFrame = () => {
    if (disposed || renderer === null || scene === null || camera === null) {
      return;
    }

    const now = performance.now();
    const previous = (renderFrame as typeof renderFrame & { lastTime?: number })
      .lastTime;
    const dt =
      previous === undefined ? 1 / 60 : Math.min((now - previous) / 1000, 0.05);
    (renderFrame as typeof renderFrame & { lastTime?: number }).lastTime = now;

    const simulation = (
      renderFrame as typeof renderFrame & {
        simulation?: ReturnType<typeof createSimulation>;
      }
    ).simulation;

    if (simulation === undefined) {
      return;
    }

    if (Math.abs(targetZoom - orthoSize) > 0.01) {
      orthoSize += (targetZoom - orthoSize) * 0.1;
      updateCameraProjection();
    }

    fpsText.innerHTML = `FPS: ${(1 / dt).toFixed(2)}`;
    renderFrame.params.dt.value = dt;
    renderFrame.params.zoom.value = orthoSize / 3;

    renderer.compute(simulation.clearGrid);
    renderer.compute(simulation.updateGrid);
    renderer.compute(simulation.prefixSumGrid);

    let swap = false;
    for (let divider = 1; divider < simulation.bounds.blocks; divider *= 2) {
      renderFrame.params.divider.value = divider;
      renderer.compute(
        swap
          ? simulation.scanBlockSumsBackward
          : simulation.scanBlockSumsForward,
      );
      swap = !swap;
    }

    if (swap) {
      renderer.compute(simulation.finalizeGridSums);
    }

    renderer.compute(simulation.addBlockSums);
    renderer.compute(simulation.rearrangeBoids);
    renderer.compute(simulation.updateBoids);
    renderer.render(scene, camera);
  };

  renderFrame.params = createParamNodes();

  const disposeCurrent = () => {
    renderer?.setAnimationLoop(null);
    const simulation = (
      renderFrame as typeof renderFrame & {
        simulation?: ReturnType<typeof createSimulation>;
      }
    ).simulation;

    simulation?.clearGrid.dispose();
    simulation?.prefixSumGrid.dispose();
    simulation?.scanBlockSumsForward.dispose();
    simulation?.scanBlockSumsBackward.dispose();
    simulation?.finalizeGridSums.dispose();
    simulation?.addBlockSums.dispose();
    simulation?.generateBoids.dispose();
    simulation?.updateGrid.dispose();
    simulation?.rearrangeBoids.dispose();
    simulation?.updateBoids.dispose();

    scene?.traverse((object: any) => {
      if ("geometry" in object) {
        object.geometry?.dispose?.();
      }
      if ("material" in object) {
        const material = object.material;

        if (Array.isArray(material)) {
          material.forEach((entry) => entry.dispose());
        } else {
          material?.dispose?.();
        }
      }
    });

    scene = null;
    camera = null;
    renderer?.dispose();
    renderer = null;
    delete (renderFrame as typeof renderFrame & { simulation?: unknown })
      .simulation;
    delete (renderFrame as typeof renderFrame & { lastTime?: number }).lastTime;
  };

  const rebuild = async () => {
    const version = ++rebuildVersion;

    disposeCurrent();

    if (disposed) {
      return;
    }

    const nextRenderer = new WebGPURenderer({
      alpha: false,
      antialias: false,
      canvas,
      device: await requestWebGPUDeviceWithMaxLimits(),
    });

    nextRenderer.setPixelRatio(window.devicePixelRatio);
    nextRenderer.setSize(window.innerWidth, window.innerHeight, false);
    nextRenderer.setClearColor(new Color(0x000000));

    await nextRenderer.init();
    patchRendererForGpuOnlyStorage(nextRenderer);

    if (disposed || version !== rebuildVersion) {
      nextRenderer.dispose();
      return;
    }

    const device = (
      nextRenderer.backend as {
        device?: {
          limits?: {
            maxComputeWorkgroupSizeX?: number;
            maxComputeWorkgroupsPerDimension?: number;
          };
        } | null;
      }
    ).device;
    const workgroupSize = Math.max(
      1,
      device?.limits?.maxComputeWorkgroupSizeX ?? DEFAULT_WORKGROUP_SIZE,
    );
    const maxBlocks = device?.limits?.maxComputeWorkgroupsPerDimension ?? 65535;
    const boidLimit = Math.max(32, workgroupSize * maxBlocks);

    boidSlider.max = Math.ceil(Math.log2(boidLimit)).toString();
    if (numBoids > boidLimit) {
      numBoids = boidLimit;
      boidSlider.valueAsNumber = Math.log2(boidLimit);
    }

    const bounds = computeBounds(numBoids, getAspectRatio(), workgroupSize);
    const nextScene = new Scene();
    const nextCamera = new OrthographicCamera(
      -bounds.orthoSize * bounds.aspectRatio,
      bounds.orthoSize * bounds.aspectRatio,
      bounds.orthoSize,
      -bounds.orthoSize,
      0.1,
      20,
    );

    orthoSize = bounds.orthoSize;
    targetZoom = bounds.orthoSize;

    nextScene.background = new Color(0x000000);
    nextCamera.position.set(0, 0, 5);
    nextCamera.lookAt(0, 0, 0);

    const simulation = createSimulation(
      renderFrame.params,
      numBoids,
      workgroupSize,
      bounds,
    );
    const boidMesh = createBoidGpuDeformMesh2d({
      baseMesh: triangleMesh,
      boids: simulation.boids,
      boundRadius: Math.hypot(bounds.xBound, bounds.yBound) + 1,
      color: 0xffffff,
      numBoids,
    });

    nextScene.add(boidMesh);

    renderFrame.params.avoidMouse.value = avoidToggle.checked ? 1 : 0;
    renderFrame.params.divider.value = 1;
    renderFrame.params.dt.value = 1 / 60;
    renderFrame.params.mousePos.value.copy(currentMouseWorld);
    renderFrame.params.zoom.value = orthoSize / 3;

    renderer = nextRenderer;
    scene = nextScene;
    camera = nextCamera;
    (
      renderFrame as typeof renderFrame & {
        simulation?: ReturnType<typeof createSimulation>;
      }
    ).simulation = simulation;

    nextRenderer.compute(simulation.generateBoids);
    boidText.innerHTML = `Boids: ${numBoids.toLocaleString()}`;
    document.getElementById("loader")?.remove();
    renderer.setAnimationLoop(renderFrame);
  };

  const scheduleRebuild = () => {
    window.clearTimeout(rebuildDebounce);
    rebuildDebounce = window.setTimeout(() => {
      void rebuild();
    }, 120);
  };

  const handleWheel = (event: WheelEvent) => {
    event.preventDefault();

    const zoomDelta = event.deltaY * orthoSize * 0.001;
    if (targetZoom + zoomDelta > 1) {
      targetZoom += zoomDelta;
    }
  };

  const handlePointerDown = (event: PointerEvent) => {
    isPanning = true;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    updateMouseWorld(event.clientX, event.clientY);
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (isPanning && camera !== null) {
      camera.position.x -= event.movementX * 0.002 * orthoSize;
      camera.position.y += event.movementY * 0.002 * orthoSize;
    }

    updateMouseWorld(event.clientX, event.clientY);
  };

  const handlePointerUp = (event: PointerEvent) => {
    isPanning = false;
    canvas.style.cursor = "grab";

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  const handleResize = () => {
    if (renderer === null || camera === null) {
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight, false);
    updateCameraProjection();
  };

  boidSlider.oninput = () => {
    numBoids = Math.min(
      Math.round(Math.pow(2, boidSlider.valueAsNumber)),
      Math.pow(2, Number(boidSlider.max)),
    );
    boidText.innerHTML = `Boids: ${numBoids.toLocaleString()}`;
    scheduleRebuild();
  };

  avoidToggle.onchange = () => {
    renderFrame.params.avoidMouse.value = avoidToggle.checked ? 1 : 0;
  };

  canvas.style.cursor = "grab";
  canvas.addEventListener("wheel", handleWheel, { passive: false });
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  window.addEventListener("resize", handleResize);

  await rebuild();

  return {
    dispose() {
      disposed = true;
      isPanning = false;
      window.clearTimeout(rebuildDebounce);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.style.cursor = "grab";
      boidSlider.oninput = null;
      avoidToggle.onchange = null;
      disposeCurrent();
    },
  };
};
