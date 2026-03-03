import {
  BufferGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  OrthographicCamera,
  Scene,
  Vector2,
} from "three";
import { MeshBasicNodeMaterial, WebGPURenderer } from "three/webgpu";
import {
  Fn,
  If,
  Loop,
  abs,
  atan,
  atomicAdd,
  attribute,
  clamp,
  cos,
  distance,
  dot,
  float,
  floor,
  instanceIndex,
  invocationLocalIndex,
  instancedArray,
  length,
  max,
  mix,
  normalize,
  positionLocal,
  pow,
  sign,
  sin,
  sqrt,
  step,
  storage,
  uint,
  uniform,
  vec2,
  vec3,
  workgroupArray,
  workgroupBarrier,
  workgroupId,
} from "three/tsl";
import { triangleMesh } from "./meshes/triangleMesh";

type SceneHandle = { dispose: () => void };

type Pipeline2D = {
  clearGrid: any;
  updateGrid: any;
  prefixSum: any;
  sumBucketsAtoB: any;
  sumBucketsBtoA: any;
  addSumsFromA: any;
  addSumsFromB: any;
  rearrange: any;
  boidUpdate: any;
  dividerNode: ReturnType<typeof uniform>;
  blocks: number;
};

type GpuBoids2D = {
  count: number;
  orthoSize: number;
  mesh: InstancedMesh;
  pipeline: Pipeline2D;
};

const EDGE_MARGIN = 0.5;
const MAX_SPEED = 2;
const MIN_SPEED = MAX_SPEED * 0.75;
const TURN_SPEED = MAX_SPEED * 3;
const VISUAL_RANGE = 0.5;
const VISUAL_RANGE_SQ = VISUAL_RANGE * VISUAL_RANGE;
const MIN_DISTANCE = 0.15;
const MIN_DISTANCE_SQ = MIN_DISTANCE * MIN_DISTANCE;
const COHESION_FACTOR = 2;
const ALIGNMENT_FACTOR = 5;
const SEPARATION_FACTOR = 1;
const DEFAULT_BLOCK_SIZE = 64;
const DEFAULT_MAX_BLOCKS = 65_535;

const getRequestedComputeLimits = async () => {
  let blockSize = DEFAULT_BLOCK_SIZE;
  let maxBlocks = DEFAULT_MAX_BLOCKS;
  let maxInvocations = DEFAULT_BLOCK_SIZE;
  let requiredLimits: Record<string, number> = {};

  const gpu = (navigator as any).gpu;
  if (gpu?.requestAdapter) {
    const adapter = await gpu.requestAdapter({
      powerPreference: "high-performance",
      featureLevel: "compatibility",
    });
    if (adapter) {
      const adapterBlockSizeX =
        Number(adapter.limits.maxComputeWorkgroupSizeX) || blockSize;
      maxInvocations =
        Number(adapter.limits.maxComputeInvocationsPerWorkgroup) || maxInvocations;
      blockSize = Math.max(1, Math.min(adapterBlockSizeX, maxInvocations));
      maxBlocks =
        Number(adapter.limits.maxComputeWorkgroupsPerDimension) || maxBlocks;

      requiredLimits = {
        maxComputeWorkgroupSizeX: blockSize,
        maxComputeInvocationsPerWorkgroup: maxInvocations,
        maxComputeWorkgroupsPerDimension: maxBlocks,
      };
    }
  }

  return { blockSize, maxBlocks, requiredLimits };
};

const createTriangleGeometry2D = () => {
  const vertices4 = triangleMesh.vertices;
  const positions = new Float32Array(9);

  for (let i = 0; i < 3; i += 1) {
    const src = i * 4;
    const dst = i * 3;
    positions[dst] = vertices4[src];
    positions[dst + 1] = vertices4[src + 1];
    positions[dst + 2] = vertices4[src + 2];
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  return geometry;
};

const createBoidMaterial2D = (
  mouseNode: ReturnType<typeof uniform>,
  zoomNode: ReturnType<typeof uniform>,
  avoidNode: ReturnType<typeof uniform>
) => {
  const boidPos = attribute("boidPos", "vec3");
  const boidVel = attribute("boidVel", "vec3");

  const material = new MeshBasicNodeMaterial();

  material.positionNode = Fn(() => {
    const local = positionLocal.xy.mul(0.1);
    const angle = atan(boidVel.x.negate(), boidVel.y);
    const s = sin(angle);
    const c = cos(angle);

    const rotated = vec2(
      local.x.mul(c).sub(local.y.mul(s)),
      local.x.mul(s).add(local.y.mul(c))
    );

    return vec3(rotated.add(boidPos.xy), 0);
  })();

  const d = clamp(distance(boidPos.xy, mouseNode).div(max(zoomNode, 0.0001)), 0, 1);
  const t = mix(1, d, step(0.5, avoidNode));
  material.colorNode = vec3(1, t, t);

  return material;
};

const createPipeline2D = (
  count: number,
  blockSize: number,
  xBound: number,
  yBound: number,
  gridDimX: number,
  gridDimY: number,
  posA: any,
  velA: any,
  posB: any,
  velB: any,
  mouseNode: ReturnType<typeof uniform>,
  zoomNode: ReturnType<typeof uniform>,
  avoidNode: ReturnType<typeof uniform>,
  dtNode: ReturnType<typeof uniform>
): Pipeline2D => {
  const gridTotalCells = gridDimX * gridDimY;
  const blocks = Math.ceil(gridTotalCells / blockSize);

  const numBoidsNode = uint(count);
  const gridDimXNode = uint(gridDimX);
  const gridDimYNode = uint(gridDimY);
  const gridTotalCellsNode = uint(gridTotalCells);
  const blocksNode = uint(blocks);
  const blockSizeNode = uint(blockSize);

  const xBoundNode = uniform(xBound, "float");
  const yBoundNode = uniform(yBound, "float");
  const gridCellSizeNode = uniform(VISUAL_RANGE, "float");
  const minSpeedNode = uniform(MIN_SPEED, "float");
  const maxSpeedNode = uniform(MAX_SPEED, "float");
  const turnSpeedNode = uniform(TURN_SPEED, "float");
  const visualRangeSqNode = uniform(VISUAL_RANGE_SQ, "float");
  const minDistanceSqNode = uniform(MIN_DISTANCE_SQ, "float");
  const cohesionNode = uniform(COHESION_FACTOR, "float");
  const alignmentNode = uniform(ALIGNMENT_FACTOR, "float");
  const separationNode = uniform(SEPARATION_FACTOR, "float");
  const dividerNode = uniform(1, "uint");

  const gridCellId = instancedArray(count, "uint").setName("gridCellId2D");
  const gridCellOffset = instancedArray(count, "uint").setName("gridCellOffset2D");

  const gridCounts = instancedArray(gridTotalCells, "uint").setName("gridCounts2D");
  const gridCountsAtomic = storage(
    gridCounts.value,
    "uint",
    gridTotalCells
  ).toAtomic();

  const gridPrefix = instancedArray(gridTotalCells, "uint").setName("gridPrefix2D");
  const gridSumsA = instancedArray(blocks, "uint").setName("gridSumsA2D");
  const gridSumsB = instancedArray(blocks, "uint").setName("gridSumsB2D");

  const clearGrid = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(gridTotalCellsNode), () => {
      gridCounts.element(index).assign(uint(0));
    });
  })().compute(gridTotalCells, [blockSize]);

  const updateGrid = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(numBoidsNode), () => {
      const boidPos = posA.element(index).xy;

      const gridX = uint(
        clamp(
          floor(
            boidPos.x
              .div(gridCellSizeNode)
              .add(float(gridDimXNode).mul(0.5))
          ),
          0,
          float(gridDimX - 1)
        )
      );

      const gridY = uint(
        clamp(
          floor(
            boidPos.y
              .div(gridCellSizeNode)
              .add(float(gridDimYNode).mul(0.5))
          ),
          0,
          float(gridDimY - 1)
        )
      );

      const gridId = gridY.mul(gridDimXNode).add(gridX).toVar();
      const offset = atomicAdd(gridCountsAtomic.element(gridId), uint(1)).toVar();

      gridCellId.element(index).assign(gridId);
      gridCellOffset.element(index).assign(offset);
    });
  })().compute(count, [blockSize]);

  const temp = workgroupArray("uint", blockSize * 2);

  const prefixSum = Fn(() => {
    const globalId = instanceIndex;
    const localId = invocationLocalIndex;
    const groupId = workgroupId.x;

    const pout = uint(0).toVar();
    const pin = uint(1).toVar();

    If(globalId.lessThan(gridTotalCellsNode), () => {
      temp.element(localId).assign(gridCounts.element(globalId));
    }).Else(() => {
      temp.element(localId).assign(uint(0));
    });

    workgroupBarrier();

    for (let offset = 1; offset < blockSize; offset *= 2) {
      pout.assign(uint(1).sub(pout));
      pin.assign(uint(1).sub(pout));

      const writeIndex = pout.mul(blockSizeNode).add(localId).toVar();
      const readIndex = pin.mul(blockSizeNode).add(localId).toVar();

      If(localId.greaterThanEqual(uint(offset)), () => {
        temp
          .element(writeIndex)
          .assign(temp.element(readIndex).add(temp.element(readIndex.sub(uint(offset)))));
      }).Else(() => {
        temp.element(writeIndex).assign(temp.element(readIndex));
      });

      workgroupBarrier();
    }

    If(globalId.lessThan(gridTotalCellsNode), () => {
      gridPrefix
        .element(globalId)
        .assign(temp.element(pout.mul(blockSizeNode).add(localId)));
    });

    If(localId.equal(uint(0)), () => {
      gridSumsA
        .element(groupId)
        .assign(temp.element(pout.mul(blockSizeNode).add(blockSizeNode.sub(uint(1)))));
    });
  })().compute(blocks * blockSize, [blockSize]);

  const sumBucketsAtoB = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(blocksNode), () => {
      If(index.lessThan(dividerNode), () => {
        gridSumsB.element(index).assign(gridSumsA.element(index));
      }).Else(() => {
        gridSumsB
          .element(index)
          .assign(gridSumsA.element(index).add(gridSumsA.element(index.sub(dividerNode))));
      });
    });
  })().compute(blocks, [blockSize]);

  const sumBucketsBtoA = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(blocksNode), () => {
      If(index.lessThan(dividerNode), () => {
        gridSumsA.element(index).assign(gridSumsB.element(index));
      }).Else(() => {
        gridSumsA
          .element(index)
          .assign(gridSumsB.element(index).add(gridSumsB.element(index.sub(dividerNode))));
      });
    });
  })().compute(blocks, [blockSize]);

  const addSumsFromA = Fn(() => {
    const globalId = instanceIndex;
    const groupId = workgroupId.x;

    If(groupId.greaterThan(uint(0)), () => {
      If(globalId.lessThan(gridTotalCellsNode), () => {
        gridPrefix
          .element(globalId)
          .addAssign(gridSumsA.element(groupId.sub(uint(1))));
      });
    });
  })().compute(blocks * blockSize, [blockSize]);

  const addSumsFromB = Fn(() => {
    const globalId = instanceIndex;
    const groupId = workgroupId.x;

    If(groupId.greaterThan(uint(0)), () => {
      If(globalId.lessThan(gridTotalCellsNode), () => {
        gridPrefix
          .element(globalId)
          .addAssign(gridSumsB.element(groupId.sub(uint(1))));
      });
    });
  })().compute(blocks * blockSize, [blockSize]);

  const rearrange = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(numBoidsNode), () => {
      const gridId = gridCellId.element(index).toVar();
      const cellOffset = gridCellOffset.element(index).toVar();
      const newIndex = gridPrefix
        .element(gridId)
        .sub(uint(1))
        .sub(cellOffset)
        .toVar();

      posB.element(newIndex).assign(posA.element(index));
      velB.element(newIndex).assign(velA.element(index));
    });
  })().compute(count, [blockSize]);

  const boidUpdate = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(numBoidsNode), () => {
      const boidPos = posB.element(index).xy.toVar();
      const boidVel = velB.element(index).xy.toVar();

      const gridX = uint(
        clamp(
          floor(
            boidPos.x
              .div(gridCellSizeNode)
              .add(float(gridDimXNode).mul(0.5))
          ),
          0,
          float(gridDimX - 1)
        )
      );

      const gridY = uint(
        clamp(
          floor(
            boidPos.y
              .div(gridCellSizeNode)
              .add(float(gridDimYNode).mul(0.5))
          ),
          0,
          float(gridDimY - 1)
        )
      );

      const minX = gridX.toVar();
      const maxX = gridX.toVar();
      const minY = gridY.toVar();
      const maxY = gridY.toVar();

      If(gridX.greaterThan(uint(0)), () => {
        minX.assign(gridX.sub(uint(1)));
      });

      If(gridX.lessThan(gridDimXNode.sub(uint(1))), () => {
        maxX.assign(gridX.add(uint(1)));
      });

      If(gridY.greaterThan(uint(0)), () => {
        minY.assign(gridY.sub(uint(1)));
      });

      If(gridY.lessThan(gridDimYNode.sub(uint(1))), () => {
        maxY.assign(gridY.add(uint(1)));
      });

      const center = vec2(0, 0).toVar();
      const close = vec2(0, 0).toVar();
      const avgVel = vec2(0, 0).toVar();
      const neighbours = uint(0).toVar();

      Loop(
        { start: minY, end: maxY.add(uint(1)), type: "uint" },
        ({ i: yy }: { i: any }) => {
          const rowBase = yy.mul(gridDimXNode).toVar();

          Loop(
            { start: minX, end: maxX.add(uint(1)), type: "uint" },
            ({ i: xx }: { i: any }) => {
              const cellId = rowBase.add(xx).toVar();
              const startIndex = uint(0).toVar();

              If(cellId.greaterThan(uint(0)), () => {
                startIndex.assign(gridPrefix.element(cellId.sub(uint(1))));
              });

              const endIndex = gridPrefix.element(cellId).toVar();

              Loop(
                { start: startIndex, end: endIndex, type: "uint" },
                ({ i: otherIndex }: { i: any }) => {
                  const otherPos = posB.element(otherIndex).xy;
                  const diff = boidPos.sub(otherPos).toVar();
                  const distSq = dot(diff, diff).toVar();

                  If(
                    distSq.lessThan(visualRangeSqNode).and(
                      distSq.greaterThan(float(0.000001))
                    ),
                    () => {
                      If(distSq.lessThan(minDistanceSqNode), () => {
                        close.addAssign(diff.mul(float(1).div(distSq)));
                      });

                      center.addAssign(otherPos);
                      avgVel.addAssign(velB.element(otherIndex).xy);
                      neighbours.addAssign(uint(1));
                    }
                  );
                }
              );
            }
          );
        }
      );

      If(neighbours.greaterThan(uint(0)), () => {
        const invNeighbours = float(1).div(float(neighbours));

        center.mulAssign(invNeighbours);
        avgVel.mulAssign(invNeighbours);

        boidVel.addAssign(center.sub(boidPos).mul(cohesionNode.mul(dtNode)));
        boidVel.addAssign(avgVel.sub(boidVel).mul(alignmentNode.mul(dtNode)));
      });

      boidVel.addAssign(close.mul(separationNode.mul(dtNode)));

      const speed = length(boidVel).toVar();

      If(speed.greaterThan(float(0.00001)), () => {
        const clampedSpeed = clamp(speed, minSpeedNode, maxSpeedNode);
        boidVel.mulAssign(clampedSpeed.div(speed));
      }).Else(() => {
        boidVel.assign(vec2(minSpeedNode, float(0)));
      });

      If(abs(boidPos.x).greaterThan(xBoundNode), () => {
        boidVel.x.subAssign(sign(boidPos.x).mul(turnSpeedNode).mul(dtNode));
      });

      If(abs(boidPos.y).greaterThan(yBoundNode), () => {
        boidVel.y.subAssign(sign(boidPos.y).mul(turnSpeedNode).mul(dtNode));
      });

      If(avoidNode.greaterThan(float(0.5)), () => {
        const distToMouse = distance(boidPos, mouseNode).toVar();

        If(
          distToMouse.lessThan(zoomNode).and(
            abs(boidPos.x).lessThan(xBoundNode).and(abs(boidPos.y).lessThan(yBoundNode))
          ),
          () => {
            If(distToMouse.greaterThan(float(0.000001)), () => {
              const normalizedDist = max(
                sqrt(minDistanceSqNode),
                distToMouse.div(max(zoomNode, float(0.0001)))
              );

              const force = normalize(boidPos.sub(mouseNode)).div(
                pow(normalizedDist, float(2))
              );

              boidVel.addAssign(force.mul(dtNode));
            });
          }
        );
      });

      const nextPos = boidPos.add(boidVel.mul(dtNode)).toVar();

      posA.element(index).assign(vec3(nextPos, 0));
      velA.element(index).assign(vec3(boidVel, 0));
    });
  })().compute(count, [blockSize]);

  return {
    clearGrid,
    updateGrid,
    prefixSum,
    sumBucketsAtoB,
    sumBucketsBtoA,
    addSumsFromA,
    addSumsFromB,
    rearrange,
    boidUpdate,
    dividerNode,
    blocks,
  };
};

const disposePipeline2D = (pipeline: Pipeline2D) => {
  pipeline.clearGrid.dispose();
  pipeline.updateGrid.dispose();
  pipeline.prefixSum.dispose();
  pipeline.sumBucketsAtoB.dispose();
  pipeline.sumBucketsBtoA.dispose();
  pipeline.addSumsFromA.dispose();
  pipeline.addSumsFromB.dispose();
  pipeline.rearrange.dispose();
  pipeline.boidUpdate.dispose();
};

const runPipeline2D = (renderer: any, pipeline: Pipeline2D) => {
  renderer.compute(pipeline.clearGrid);
  renderer.compute(pipeline.updateGrid);
  renderer.compute(pipeline.prefixSum);

  let swap = false;
  for (let divider = 1; divider < pipeline.blocks; divider *= 2) {
    pipeline.dividerNode.value = divider;

    if (swap) {
      renderer.compute(pipeline.sumBucketsBtoA);
    } else {
      renderer.compute(pipeline.sumBucketsAtoB);
    }

    swap = !swap;
  }

  if (swap) {
    renderer.compute(pipeline.addSumsFromB);
  } else {
    renderer.compute(pipeline.addSumsFromA);
  }

  renderer.compute(pipeline.rearrange);
  renderer.compute(pipeline.boidUpdate);
};

const createGpuBoids2D = (
  count: number,
  blockSize: number,
  aspectRatio: number,
  mouseNode: ReturnType<typeof uniform>,
  zoomNode: ReturnType<typeof uniform>,
  avoidNode: ReturnType<typeof uniform>,
  dtNode: ReturnType<typeof uniform>
): GpuBoids2D => {
  const orthoSize = Math.max(2, Math.sqrt(count) / 10 + EDGE_MARGIN);
  const xBound = orthoSize * aspectRatio - EDGE_MARGIN;
  const yBound = orthoSize - EDGE_MARGIN;

  const gridDimX = Math.floor((xBound * 2) / VISUAL_RANGE) + 30;
  const gridDimY = Math.floor((yBound * 2) / VISUAL_RANGE) + 30;

  const posA = instancedArray(count, "vec3").setName("boidPosA2D");
  const velA = instancedArray(count, "vec3").setName("boidVelA2D");
  const posB = instancedArray(count, "vec3").setName("boidPosB2D");
  const velB = instancedArray(count, "vec3").setName("boidVelB2D");

  const posAArray = posA.value.array as Float32Array;
  const velAArray = velA.value.array as Float32Array;
  const posBArray = posB.value.array as Float32Array;
  const velBArray = velB.value.array as Float32Array;

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;

    posAArray[i3] = (Math.random() * 2 - 1) * xBound;
    posAArray[i3 + 1] = (Math.random() * 2 - 1) * yBound;
    posAArray[i3 + 2] = 0;

    const angle = Math.random() * Math.PI * 2;
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);

    velAArray[i3] = Math.cos(angle) * speed;
    velAArray[i3 + 1] = Math.sin(angle) * speed;
    velAArray[i3 + 2] = 0;

    posBArray[i3] = posAArray[i3];
    posBArray[i3 + 1] = posAArray[i3 + 1];
    posBArray[i3 + 2] = 0;

    velBArray[i3] = velAArray[i3];
    velBArray[i3 + 1] = velAArray[i3 + 1];
    velBArray[i3 + 2] = 0;
  }

  posA.value.needsUpdate = true;
  velA.value.needsUpdate = true;
  posB.value.needsUpdate = true;
  velB.value.needsUpdate = true;

  const pipeline = createPipeline2D(
    count,
    blockSize,
    xBound,
    yBound,
    gridDimX,
    gridDimY,
    posA,
    velA,
    posB,
    velB,
    mouseNode,
    zoomNode,
    avoidNode,
    dtNode
  );

  const geometry = createTriangleGeometry2D();
  geometry.setAttribute("boidPos", posA.value);
  geometry.setAttribute("boidVel", velA.value);

  const material = createBoidMaterial2D(mouseNode, zoomNode, avoidNode);
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;

  return {
    count,
    orthoSize,
    mesh,
    pipeline,
  };
};

const disposeGpuBoids2D = (boids: GpuBoids2D | null, scene: Scene) => {
  if (boids === null) {
    return;
  }

  scene.remove(boids.mesh);
  boids.mesh.geometry.dispose();
  (boids.mesh.material as { dispose: () => void }).dispose();

  disposePipeline2D(boids.pipeline);
};

export const boids2d = async (): Promise<SceneHandle> => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const boidText = document.getElementById("boidText") as HTMLElement;
  const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;
  const avoidToggle = document.getElementById("avoidToggle") as HTMLInputElement;
  const fpsText = document.getElementById("fpsText") as HTMLElement;

  avoidToggle.checked = false;
  boidSlider.valueAsNumber = Math.max(boidSlider.valueAsNumber || 5, 5);
  const { blockSize, maxBlocks, requiredLimits } = await getRequestedComputeLimits();
  const boidLimit = Math.max(32, Math.floor(blockSize * maxBlocks));
  boidSlider.max = Math.ceil(Math.log2(boidLimit)).toString();

  const sliderMax = Number(boidSlider.max);
  boidSlider.valueAsNumber = Math.min(
    Math.max(boidSlider.valueAsNumber, 5),
    sliderMax
  );

  const renderer = new WebGPURenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
    requiredLimits,
  });

  await renderer.init();
  document.getElementById("loader")?.remove();

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
  camera.position.z = 5;

  const mouseWorld = new Vector2();
  const mouseNode = uniform(new Vector2(), "vec2");
  const zoomNode = uniform(1, "float");
  const avoidNode = uniform(0, "float");
  const dtNode = uniform(0.016, "float");

  let gpuBoids: GpuBoids2D | null = null;
  let orthoSize = 2;
  let targetZoom = 2;
  let aspectRatio = window.innerWidth / window.innerHeight;

  const updateOrthoProjection = () => {
    aspectRatio = window.innerWidth / window.innerHeight;
    camera.left = -orthoSize * aspectRatio;
    camera.right = orthoSize * aspectRatio;
    camera.bottom = -orthoSize;
    camera.top = orthoSize;
    camera.updateProjectionMatrix();
  };

  const resetSimulation = (count: number) => {
    disposeGpuBoids2D(gpuBoids, scene);

    gpuBoids = createGpuBoids2D(
      count,
      blockSize,
      aspectRatio,
      mouseNode,
      zoomNode,
      avoidNode,
      dtNode
    );

    scene.add(gpuBoids.mesh);
    boidText.textContent = `Boids: ${gpuBoids.count}`;

    orthoSize = gpuBoids.orthoSize;
    targetZoom = gpuBoids.orthoSize;
    camera.position.set(0, 0, 5);
    updateOrthoProjection();
  };

  resetSimulation(Math.min(Math.round(Math.pow(2, boidSlider.valueAsNumber)), boidLimit));

  boidSlider.oninput = () => {
    const requested = Math.round(Math.pow(2, boidSlider.valueAsNumber));
    resetSimulation(Math.min(requested, boidLimit));
  };

  avoidToggle.onclick = () => {
    avoidNode.value = avoidToggle.checked ? 1 : 0;
  };

  let isDragging = false;

  const updateMousePosition = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    mouseWorld.x = camera.position.x + nx * orthoSize * aspectRatio;
    mouseWorld.y = camera.position.y + ny * orthoSize;
  };

  const onWheel = (event: WheelEvent) => {
    const zoomDelta = event.deltaY * orthoSize * 0.001;
    if (targetZoom + zoomDelta > 1) {
      targetZoom += zoomDelta;
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    isDragging = true;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
    updateMousePosition(event);
  };

  const onPointerUp = (event: PointerEvent) => {
    isDragging = false;
    canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = "grab";
  };

  const onPointerMove = (event: PointerEvent) => {
    updateMousePosition(event);

    if (isDragging) {
      camera.position.x -= event.movementX * 0.002 * orthoSize;
      camera.position.y += event.movementY * 0.002 * orthoSize;
    }
  };

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    updateOrthoProjection();
  };

  canvas.style.cursor = "grab";
  canvas.addEventListener("wheel", onWheel, { passive: true });
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointermove", onPointerMove);
  window.addEventListener("resize", onResize);

  let lastTime = performance.now();

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) * 0.001, 0.05);
    lastTime = now;

    fpsText.textContent = `FPS: ${(1 / Math.max(dt, 1e-4)).toFixed(2)}`;

    if (Math.abs(orthoSize - targetZoom) > 0.01) {
      orthoSize += (targetZoom - orthoSize) * 0.1;
      updateOrthoProjection();
    }

    mouseNode.value.copy(mouseWorld);
    zoomNode.value = orthoSize / 3;
    avoidNode.value = avoidToggle.checked ? 1 : 0;
    dtNode.value = dt;

    if (gpuBoids !== null) {
      runPipeline2D(renderer, gpuBoids.pipeline);
    }

    renderer.render(scene, camera);
  });

  return {
    dispose: () => {
      renderer.setAnimationLoop(null);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);

      boidSlider.oninput = null;
      avoidToggle.onclick = null;

      disposeGpuBoids2D(gpuBoids, scene);
      renderer.dispose();
    },
  };
};
