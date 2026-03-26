import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SkyMesh } from "three/addons/objects/SkyMesh.js";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  WebGPURenderer,
} from "three/webgpu";
import {
  attributeArray,
  float,
  int,
  storage,
  struct,
  uint,
  uniform,
  workgroupArray,
} from "three/tsl";
import { createBoidGpuDeformMesh } from "./materials/boidGpuDeformPlugin";
import { triangleMesh } from "./meshes/triangleMesh";
import { createBoidCompute3d } from "./shaders/boidCompute3d";
import { createGridShader3d } from "./shaders/gridShader3d";
import { requestWebGPUDeviceWithMaxLimits } from "./utils/webgpu";

const EDGE_MARGIN = 0.5;
const MAX_SPEED = 2;
const VISUAL_RANGE = 0.5;
const MIN_DISTANCE = 0.15;
const COHESION_FACTOR = 2;
const ALIGNMENT_FACTOR = 5;
const SEPARATION_FACTOR = 1;
const DEFAULT_WORKGROUP_SIZE = 64;
const MAX_SAFE_BOIDS = 1 << 22;
const MAX_GRID_3D_BOIDS = 16384;

const Boid3d = struct(
  {
    pos: "vec3",
    vel: "vec3",
  },
  "Boid3d",
) as any;

const floatUniform = (value: number) =>
  uniform(value as any, "float" as any) as any;
const uintUniform = (value: number) =>
  uniform(value as any, "uint" as any) as any;
const arrayNode = (count: any, type: any) =>
  (attributeArray as any)(count, type) as any;
const storageNode = (value: any, type: any, count?: any) =>
  (storage as any)(value, type, count) as any;
const workgroupArrayNode = (type: any, count: any) =>
  (workgroupArray as any)(type, count) as any;

const createParamNodes = () => ({
  divider: uintUniform(1),
  dt: floatUniform(1 / 60),
});

type ParamNodes = ReturnType<typeof createParamNodes>;

type Bounds = {
  blocks: number;
  gridDimX: number;
  gridDimY: number;
  gridDimZ: number;
  gridTotalCells: number;
  spaceBounds: number;
  xBound: number;
  yBound: number;
  zBound: number;
};

const computeBounds = (numBoids: number, workgroupSize: number): Bounds => {
  const spaceBounds = Math.max(1, Math.cbrt(numBoids) / 7.5 + EDGE_MARGIN);
  const xBound = 2 * spaceBounds - EDGE_MARGIN;
  const yBound = spaceBounds - EDGE_MARGIN;
  const zBound = 2 * spaceBounds - EDGE_MARGIN;

  const gridDimX = Math.floor((xBound * 2) / VISUAL_RANGE) + 20;
  const gridDimY = Math.floor((yBound * 2) / VISUAL_RANGE) + 20;
  const gridDimZ = Math.floor((zBound * 2) / VISUAL_RANGE) + 20;
  const gridTotalCells = gridDimX * gridDimY * gridDimZ;
  const blocks = Math.ceil(gridTotalCells / workgroupSize);

  return {
    blocks,
    gridDimX,
    gridDimY,
    gridDimZ,
    gridTotalCells,
    spaceBounds,
    xBound,
    yBound,
    zBound,
  };
};

const createSimulation = (
  params: ParamNodes,
  numBoids: number,
  workgroupSize: number,
  bounds: Bounds,
) => {
  const boids = arrayNode(numBoids, Boid3d);
  const boidsSorted = arrayNode(numBoids, Boid3d);
  const grid = arrayNode(numBoids, "uvec2");
  const gridOffsets = arrayNode(bounds.gridTotalCells, "uint");
  const gridOffsetsInclusive = arrayNode(bounds.gridTotalCells, "uint");
  const gridSums = arrayNode(bounds.blocks, "uint");
  const gridSumsScratch = arrayNode(bounds.blocks, "uint");
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
  const gridDimZFloat: any = float(bounds.gridDimZ);
  const gridDimXInt: any = int(bounds.gridDimX);
  const gridDimYInt: any = int(bounds.gridDimY);
  const gridDimZInt: any = int(bounds.gridDimZ);
  const gridDimXUint: any = uint(bounds.gridDimX);
  const gridDimYUint: any = uint(bounds.gridDimY);
  const blocksUint: any = uint(bounds.blocks);
  const gridTotalCellsUint: any = uint(bounds.gridTotalCells);
  const half: any = float(0.5);
  const lastLocalIndex: any = uint(workgroupSize - 1);
  const workgroupSizeUint: any = uint(workgroupSize);
  const maxSpeed: any = float(MAX_SPEED);
  const minDistanceSq: any = float(MIN_DISTANCE * MIN_DISTANCE);
  const minSpeed: any = float(MAX_SPEED * 0.75);
  const numBoidsUint: any = uint(numBoids);
  const separationFactor: any = float(SEPARATION_FACTOR);
  const turnSpeed: any = float(MAX_SPEED * 3);
  const visualRangeSq: any = float(VISUAL_RANGE * VISUAL_RANGE);
  const xBound: any = float(bounds.xBound);
  const yBound: any = float(bounds.yBound);
  const zBound: any = float(bounds.zBound);
  const zeroUint: any = uint(0);
  const oneUint: any = uint(1);
  const prefixTemp = workgroupArrayNode("uint", workgroupSize * 2);
  const gridShader = createGridShader3d({
    blocksUint,
    boids,
    boidsSorted,
    bounds,
    cellSize,
    grid,
    gridDimXFloat,
    gridDimXUint,
    gridDimYFloat,
    gridDimYUint,
    gridDimZFloat,
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

  const boidCompute = createBoidCompute3d({
    alignmentFactor,
    boids,
    boidsSorted,
    cohesionFactor,
    getGridId: gridShader.getGridId,
    getGridLocation: gridShader.getGridLocation,
    gridDimXInt,
    gridDimYInt,
    gridDimZInt,
    gridOffsetsInclusive,
    maxSpeed,
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
    zBound,
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

export const boids3d = async () => {
  let numBoids = 32;
  let disposed = false;
  let rebuildVersion = 0;
  let rebuildDebounce = 0;
  let scanProbeDone = false;
  let scanProbePending = false;
  let scanValidationDone = false;
  let scanValidationPending = false;

  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const boidText = document.getElementById("boidText") as HTMLElement;
  const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;
  const fpsText = document.getElementById("fpsText") as HTMLElement;

  let renderer: WebGPURenderer | null = null;
  let scene: Scene | null = null;
  let camera: PerspectiveCamera | null = null;
  let controls: OrbitControls | null = null;

  const renderFrame = () => {
    if (
      disposed ||
      renderer === null ||
      scene === null ||
      camera === null ||
      controls === null
    ) {
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

    fpsText.innerHTML = `FPS: ${(1 / dt).toFixed(2)}`;
    controls.update();

    renderer.compute(simulation.clearGrid);
    renderer.compute(simulation.updateGrid);
    const device = (
      renderer.backend as {
        device?: {
          popErrorScope(): Promise<{ message: string } | null>;
          pushErrorScope(filter: string): void;
        } | null;
      }
    ).device;

    if (!scanValidationDone && !scanValidationPending && device) {
      scanValidationPending = true;
      device.pushErrorScope("validation");

      let thrown: unknown = null;

      try {
        renderer.compute(simulation.prefixSumGrid);
      } catch (error) {
        thrown = error;
      }

      void device
        .popErrorScope()
        .then((error) => {
          if (disposed) {
            return;
          }

          if (thrown !== null) {
            console.error(
              `[boids3d] Prefix Scan throw: ${
                thrown instanceof Error ? thrown.message : String(thrown)
              }`,
            );
          } else if (error !== null) {
            console.error(`[boids3d] Prefix Scan validation: ${error.message}`);
          }

          scanValidationDone = true;
        })
        .catch((error: unknown) => {
          if (disposed) {
            return;
          }

          console.error(
            `[boids3d] Prefix Scan scope error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          scanValidationDone = true;
        })
        .finally(() => {
          scanValidationPending = false;
        });
    } else {
      renderer.compute(simulation.prefixSumGrid);
    }

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
    renderFrame.params.dt.value = dt;
    renderer.compute(simulation.updateBoids);

    renderer.render(scene, camera);

    if (!scanProbeDone && !scanProbePending) {
      const probeRenderer = renderer;
      const probeSimulation = simulation;
      const probeVersion = rebuildVersion;

      scanProbePending = true;

      void Promise.all([
        probeRenderer.getArrayBufferAsync(probeSimulation.gridOffsets.value),
        probeRenderer.getArrayBufferAsync(
          probeSimulation.gridOffsetsInclusive.value,
        ),
        probeRenderer.getArrayBufferAsync(probeSimulation.gridSums.value),
      ])
        .then(([rawOffsetsBuffer, inclusiveOffsetsBuffer, gridSumsBuffer]) => {
          if (disposed || probeVersion !== rebuildVersion) {
            return;
          }

          const rawOffsets = new Uint32Array(rawOffsetsBuffer);
          const inclusiveOffsets = new Uint32Array(inclusiveOffsetsBuffer);
          const blockSums = new Uint32Array(gridSumsBuffer);
          const rawSum = rawOffsets.reduce((sum, value) => sum + value, 0);
          const inclusiveLast =
            inclusiveOffsets[inclusiveOffsets.length - 1] ?? 0;
          let monotonic = true;

          for (let index = 1; index < inclusiveOffsets.length; index += 1) {
            if (inclusiveOffsets[index] < inclusiveOffsets[index - 1]) {
              monotonic = false;
              break;
            }
          }

          const boundaryIndex = Math.min(
            probeSimulation.workgroupSize,
            inclusiveOffsets.length - 1,
          );
          const boundaryPrevIndex = Math.max(0, boundaryIndex - 1);
          const blockPreview = Array.from(blockSums.slice(0, 4)).join(", ");

          console.info(
            `[boids3d] Scan Probe rawSum=${rawSum} inclusiveLast=${inclusiveLast} monotonic=${monotonic} ` +
              `boundary=${inclusiveOffsets[boundaryPrevIndex] ?? 0}->${inclusiveOffsets[boundaryIndex] ?? 0} ` +
              `blocks=[${blockPreview}]`,
          );

          scanProbeDone = true;
        })
        .catch((error: unknown) => {
          if (disposed || probeVersion !== rebuildVersion) {
            return;
          }

          console.error(
            `[boids3d] Scan Probe error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          scanProbeDone = true;
        })
        .finally(() => {
          scanProbePending = false;
        });
    }
  };

  renderFrame.params = createParamNodes();

  const disposeCurrent = () => {
    renderer?.setAnimationLoop(null);
    controls?.dispose();
    const simulation = (
      renderFrame as typeof renderFrame & {
        simulation?: ReturnType<typeof createSimulation>;
      }
    ).simulation;
    simulation?.generateBoids.dispose();
    simulation?.clearGrid.dispose();
    simulation?.prefixSumGrid.dispose();
    simulation?.scanBlockSumsForward.dispose();
    simulation?.scanBlockSumsBackward.dispose();
    simulation?.finalizeGridSums.dispose();
    simulation?.addBlockSums.dispose();
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
    controls = null;
    renderer?.dispose();
    renderer = null;
    scanProbeDone = false;
    scanProbePending = false;
    scanValidationDone = false;
    scanValidationPending = false;
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
      antialias: true,
      canvas,
      device: await requestWebGPUDeviceWithMaxLimits(),
    });

    nextRenderer.setPixelRatio(window.devicePixelRatio);
    nextRenderer.setSize(window.innerWidth, window.innerHeight, false);
    nextRenderer.toneMapping = ACESFilmicToneMapping;
    nextRenderer.shadowMap.enabled = true;
    nextRenderer.shadowMap.type = PCFShadowMap;
    nextRenderer.setClearColor(new Color(0x04070b));

    await nextRenderer.init();

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
      Math.min(
        DEFAULT_WORKGROUP_SIZE,
        device?.limits?.maxComputeWorkgroupSizeX ?? DEFAULT_WORKGROUP_SIZE,
      ),
    );
    const maxBlocks = device?.limits?.maxComputeWorkgroupsPerDimension ?? 65535;
    const boidLimit = Math.min(
      MAX_GRID_3D_BOIDS,
      MAX_SAFE_BOIDS,
      Math.max(32, Math.floor((workgroupSize * maxBlocks) / 4)),
    );

    boidSlider.max = Math.ceil(Math.log2(boidLimit)).toString();
    if (numBoids > boidLimit) {
      numBoids = boidLimit;
      boidSlider.valueAsNumber = Math.log2(boidLimit);
    }

    const bounds = computeBounds(numBoids, workgroupSize);
    const nextScene = new Scene();
    nextScene.background = new Color(0x04070b);

    const nextCamera = new PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      bounds.spaceBounds * 20,
    );
    nextCamera.position.set(
      bounds.spaceBounds * 0,
      bounds.spaceBounds * 0,
      bounds.spaceBounds * 5,
    );

    const nextControls = new OrbitControls(nextCamera, canvas);
    nextControls.enableDamping = true;
    nextControls.maxDistance = bounds.spaceBounds * 12;
    nextControls.minDistance = 1;
    nextControls.target.set(0, 0, 0);
    nextControls.update();

    const ambientLight = new AmbientLight(0xffffff, 0.28);
    nextScene.add(ambientLight);

    const sun = new DirectionalLight(0xffffff, 10);
    sun.position.set(3.214, 7.66, 5.567);
    sun.castShadow = true;
    sun.shadow.bias = -0.00008;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = bounds.spaceBounds * 16;
    sun.shadow.camera.left = -bounds.xBound * 2;
    sun.shadow.camera.right = bounds.xBound * 2;
    sun.shadow.camera.top = bounds.zBound * 2;
    sun.shadow.camera.bottom = -bounds.zBound * 2;
    nextScene.add(sun);

    const sky = new SkyMesh();
    sky.scale.setScalar(bounds.spaceBounds * 80);
    sky.turbidity.value = 7;
    sky.rayleigh.value = 1.8;
    sky.mieCoefficient.value = 0.005;
    sky.mieDirectionalG.value = 0.8;
    sky.sunPosition.value.copy(sun.position).normalize();
    nextScene.add(sky);

    const floor = new Mesh(
      new PlaneGeometry(bounds.xBound * 2, bounds.zBound * 2),
      new MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.5,
      }),
    );
    floor.position.y = -bounds.yBound - 0.75;
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    nextScene.add(floor);

    const simulation = createSimulation(
      renderFrame.params,
      numBoids,
      workgroupSize,
      bounds,
    );
    const boidMesh = createBoidGpuDeformMesh({
      baseMesh: triangleMesh,
      boids: simulation.boids,
      color: 0xd62828,
      numBoids,
    });
    boidMesh.position.set(0, 0, 0);
    nextScene.add(boidMesh);

    renderer = nextRenderer;
    scene = nextScene;
    camera = nextCamera;
    controls = nextControls;
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

  const handleResize = () => {
    if (renderer === null || camera === null) {
      return;
    }

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };

  boidSlider.oninput = () => {
    numBoids = Math.min(
      Math.round(Math.pow(2, boidSlider.valueAsNumber)),
      Math.pow(2, Number(boidSlider.max)),
    );
    boidText.innerHTML = `Boids: ${numBoids.toLocaleString()}`;
    scheduleRebuild();
  };

  window.addEventListener("resize", handleResize);

  await rebuild();

  return {
    dispose() {
      disposed = true;
      window.clearTimeout(rebuildDebounce);
      window.removeEventListener("resize", handleResize);
      boidSlider.oninput = null;
      disposeCurrent();
    },
  };
};
