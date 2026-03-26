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
  Fn,
  If,
  Loop,
  Return,
  atomicAdd,
  float,
  instanceIndex,
  rand,
  storage,
  struct,
  uint,
  uniform,
  uvec2,
  vec2,
  workgroupArray,
  workgroupBarrier,
} from "three/tsl";
import { createBoidGpuDeformMesh2d } from "./materials/boidGpuDeform2d";
import { triangleMesh } from "./meshes/triangleMesh";
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
const uvec2Node = (...args: any[]) => (uvec2 as any)(...args) as any;
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
  const attribute = new BufferAttribute(new typeClass(itemSize * 2), itemSize) as any;
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
  const randomSeed: any = float(Math.random() * 10000);
  const zeroUint: any = uint(0);

  const randomValue = (offset: number) =>
    rand(vec2(float(instanceIndex), randomSeed.add(float(offset))));

  const getGridLocation = Fn(([position]: [any]) => {
    return uvec2Node(
      position.x.div(cellSize).add(gridDimXFloat.mul(half)).floor().toUint(),
      position.y.div(cellSize).add(gridDimYFloat.mul(half)).floor().toUint(),
    );
  }).setLayout({
    inputs: [{ name: "position", type: "vec2" }],
    name: "getGridLocation2d",
    type: "uvec2",
  });

  const getGridId = Fn(([cell]: [any]) => {
    return gridDimXUint.mul(cell.y).add(cell.x);
  }).setLayout({
    inputs: [{ name: "cell", type: "uvec2" }],
    name: "getGridId2d",
    type: "uint",
  });

  const generateBoids = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const boid: any = boids.element(instanceIndex);

    boid.get("pos").assign(
      vec2(
        randomValue(1).mul(xBound.mul(float(2))).sub(xBound),
        randomValue(2).mul(yBound.mul(float(2))).sub(yBound),
      ),
    );
    boid.get("vel").assign(
      vec2(
        randomValue(3).mul(float(2)).sub(float(1)),
        randomValue(4).mul(float(2)).sub(float(1)),
      ),
    );
  })().compute(numBoids, [workgroupSize]);

  const clearGrid = Fn(() => {
    If(instanceIndex.greaterThanEqual(gridTotalCellsUint), () => {
      Return();
    });

    gridOffsets.element(instanceIndex).assign(zeroUint);
  })().compute(bounds.gridTotalCells, [workgroupSize]);

  const updateGrid = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const boid: any = boids.element(instanceIndex);
    const gridId = getGridId(getGridLocation(boid.get("pos"))).toVar("gridId");
    const gridCell = grid.element(instanceIndex);

    gridCell.x.assign(gridId);
    gridCell.y.assign(atomicAdd(gridOffsetsAtomic.element(gridId), oneUint));
  })().compute(numBoids, [workgroupSize]);

  const prefixSumGrid = Fn(() => {
    const groupIndex = instanceIndex.div(workgroupSizeUint).toVar("groupIndex");
    const localIndex = instanceIndex.mod(workgroupSizeUint).toVar("localIndex");

    If(instanceIndex.lessThan(gridTotalCellsUint), () => {
      prefixTemp.element(localIndex).assign(gridOffsets.element(instanceIndex));
    }).Else(() => {
      prefixTemp.element(localIndex).assign(zeroUint);
    });

    workgroupBarrier();

    let readBase: any = zeroUint;
    let writeBase: any = workgroupSizeUint;

    for (let offset = 1; offset < workgroupSize; offset *= 2) {
      const offsetUint: any = uint(offset);
      const currentReadBase = readBase;
      const currentWriteBase = writeBase;

      If(localIndex.greaterThanEqual(offsetUint), () => {
        prefixTemp
          .element(currentWriteBase.add(localIndex))
          .assign(
            prefixTemp
              .element(currentReadBase.add(localIndex))
              .add(
                prefixTemp.element(
                  currentReadBase.add(localIndex.sub(offsetUint)),
                ),
              ),
          );
      }).Else(() => {
        prefixTemp
          .element(currentWriteBase.add(localIndex))
          .assign(prefixTemp.element(currentReadBase.add(localIndex)));
      });

      workgroupBarrier();

      const nextReadBase = writeBase;
      writeBase = readBase;
      readBase = nextReadBase;
    }

    If(instanceIndex.greaterThanEqual(gridTotalCellsUint), () => {
      Return();
    });

    gridOffsetsInclusive
      .element(instanceIndex)
      .assign(prefixTemp.element(readBase.add(localIndex)));

    If(localIndex.equal(zeroUint), () => {
      gridSums
        .element(groupIndex)
        .assign(prefixTemp.element(readBase.add(lastLocalIndex)));
    });
  })().compute(bounds.gridTotalCells, [workgroupSize]);

  const createBlockSumsPass = (scanIn: any, scanOut: any) =>
    Fn(() => {
      If(instanceIndex.greaterThanEqual(blocksUint), () => {
        Return();
      });

      If(instanceIndex.lessThan(params.divider), () => {
        scanOut.element(instanceIndex).assign(scanIn.element(instanceIndex));
      }).Else(() => {
        scanOut
          .element(instanceIndex)
          .assign(
            scanIn
              .element(instanceIndex)
              .add(scanIn.element(instanceIndex.sub(params.divider))),
          );
      });
    })().compute(bounds.blocks, [workgroupSize]);

  const scanBlockSumsForward = createBlockSumsPass(gridSums, gridSumsScratch);
  const scanBlockSumsBackward = createBlockSumsPass(gridSumsScratch, gridSums);

  const finalizeGridSums = Fn(() => {
    If(instanceIndex.greaterThanEqual(blocksUint), () => {
      Return();
    });

    gridSums
      .element(instanceIndex)
      .assign(gridSumsScratch.element(instanceIndex));
  })().compute(bounds.blocks, [workgroupSize]);

  const addBlockSums = Fn(() => {
    const groupIndex = instanceIndex.div(workgroupSizeUint).toVar("groupIndex");

    If(
      groupIndex
        .equal(zeroUint)
        .or(instanceIndex.greaterThanEqual(gridTotalCellsUint)),
      () => {
        Return();
      },
    );

    gridOffsetsInclusive
      .element(instanceIndex)
      .assign(
        gridOffsetsInclusive
          .element(instanceIndex)
          .add(gridSums.element(groupIndex.sub(oneUint))),
      );
  })().compute(bounds.gridTotalCells, [workgroupSize]);

  const rearrangeBoids = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const gridCell = grid.element(instanceIndex);
    const newIndex = gridOffsetsInclusive
      .element(gridCell.x)
      .sub(oneUint)
      .sub(gridCell.y)
      .toVar("newIndex");
    const boidIn = boids.element(instanceIndex);
    const boidOut = boidsSorted.element(newIndex);

    boidOut.get("pos").assign(boidIn.get("pos"));
    boidOut.get("vel").assign(boidIn.get("vel"));
  })().compute(numBoids, [workgroupSize]);

  const updateBoids = Fn(() => {
    If(instanceIndex.greaterThanEqual(numBoidsUint), () => {
      Return();
    });

    const boidIn: any = boidsSorted.element(instanceIndex);
    const boidPos: any = boidIn.get("pos").toVar("boidPos");
    const boidVel: any = boidIn.get("vel").toVar("boidVel");
    const center: any = (float(0) as any).toVec2().toVar("center");
    const close: any = (float(0) as any).toVec2().toVar("close");
    const avgVel: any = (float(0) as any).toVec2().toVar("avgVel");
    const neighbours: any = zeroUint.toVar("neighbours");
    const cell = getGridId(getGridLocation(boidPos)).toVar("cell");

    // The padded grid keeps boids away from the outer edge, so we can scan each
    // neighbouring row as one contiguous range like the Babylon shader did.
    Loop(
      {
        condition: "<=",
        end: cell.add(gridDimXUint),
        start: cell.sub(gridDimXUint),
        type: "uint",
        update: gridDimXUint,
      },
      ({ i: row }: { i: any }) => {
        const bucketStart = gridOffsetsInclusive
          .element(row.sub(uint(2)))
          .toVar("bucketStart");
        const bucketEnd = gridOffsetsInclusive
          .element(row.add(oneUint))
          .toVar("bucketEnd");

        Loop(
          {
            condition: "<",
            end: bucketEnd,
            start: bucketStart,
            type: "uint",
          },
          ({ i }: { i: any }) => {
            const other = boidsSorted.element(i);
            const diff = boidPos.sub(other.get("pos")).toVar("diff");
            const distSq = diff.dot(diff).toVar("distSq");

            If(
              distSq.lessThan(visualRangeSq).and(distSq.greaterThan(float(0))),
              () => {
                If(distSq.lessThan(minDistanceSq), () => {
                  close.addAssign(diff.mul(float(1).div(distSq)));
                });

                center.addAssign(other.get("pos"));
                avgVel.addAssign(other.get("vel"));
                neighbours.addAssign(oneUint);
              },
            );
          },
        );
      },
    );

    If(neighbours.greaterThan(zeroUint), () => {
      const neighbourCount = float(neighbours);

      center.divAssign(neighbourCount);
      avgVel.divAssign(neighbourCount);
      boidVel.addAssign(center.sub(boidPos).mul(cohesionFactor).mul(params.dt));
      boidVel.addAssign(
        avgVel.sub(boidVel).mul(alignmentFactor).mul(params.dt),
      );
    });

    boidVel.addAssign(close.mul(separationFactor).mul(params.dt));

    const speed = boidVel.length().toVar("speed");
    If(speed.greaterThan(float(0)), () => {
      const clampedSpeed = speed
        .clamp(minSpeed, maxSpeed)
        .toVar("clampedSpeed");
      boidVel.mulAssign(clampedSpeed.div(speed));
    });

    If(boidPos.x.abs().greaterThan(xBound), () => {
      boidVel.x.subAssign(boidPos.x.sign().mul(turnSpeed).mul(params.dt));
    });

    If(boidPos.y.abs().greaterThan(yBound), () => {
      boidVel.y.subAssign(boidPos.y.sign().mul(turnSpeed).mul(params.dt));
    });

    If(params.avoidMouse.greaterThan(zeroUint), () => {
      const inBounds = boidPos
        .x
        .abs()
        .lessThan(xBound)
        .and(boidPos.y.abs().lessThan(yBound));
      const mouseDelta = boidPos.sub(params.mousePos).toVar("mouseDelta");
      const mouseDistance = mouseDelta.length().toVar("mouseDistance");

      If(
        mouseDistance
          .greaterThan(float(0))
          .and(mouseDistance.lessThan(params.zoom))
          .and(inBounds),
        () => {
          const dist = mouseDistance.div(params.zoom).max(minDistance).toVar(
            "dist",
          );

          boidVel.addAssign(
            mouseDelta
              .normalize()
              .div(dist.mul(dist))
              .mul(params.dt),
          );
        },
      );
    });

    boidPos.addAssign(boidVel.mul(params.dt));

    const boidOut: any = boids.element(instanceIndex);
    boidOut.get("pos").assign(boidPos);
    boidOut.get("vel").assign(boidVel);
  })().compute(numBoids, [workgroupSize]);

  return {
    addBlockSums,
    boids,
    boidsSorted,
    bounds,
    clearGrid,
    finalizeGridSums,
    generateBoids,
    grid,
    gridOffsets,
    gridOffsetsInclusive,
    gridSums,
    rearrangeBoids,
    prefixSumGrid,
    scanBlockSumsBackward,
    scanBlockSumsForward,
    updateBoids,
    updateGrid,
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
