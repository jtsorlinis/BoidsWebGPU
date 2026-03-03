import {
  AmbientLight,
  BufferGeometry,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  InstancedMesh,
  PerspectiveCamera,
  Scene,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MeshPhongNodeMaterial, WebGPURenderer } from "three/webgpu";
import {
  Fn,
  If,
  Loop,
  abs,
  atomicAdd,
  attribute,
  clamp,
  cross,
  dot,
  float,
  floor,
  instanceIndex,
  invocationLocalIndex,
  instancedArray,
  length,
  mix,
  normalLocal,
  normalize,
  positionLocal,
  sign,
  step,
  storage,
  uint,
  uniform,
  vec3,
  workgroupArray,
  workgroupBarrier,
  workgroupId,
} from "three/tsl";
import { pyramidMesh } from "./meshes/pyramidMesh";
import { triangleMesh } from "./meshes/triangleMesh";

type SceneHandle = { dispose: () => void };

type Pipeline3D = {
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

type GpuBoids3D = {
  count: number;
  spaceBounds: number;
  posA: any;
  velA: any;
  mesh: InstancedMesh;
  pipeline: Pipeline3D;
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

const createGeometryFromMesh = (mesh: {
  vertices: Float32Array;
  normals: Float32Array;
}) => {
  const positions4 = mesh.vertices;
  const normals4 = mesh.normals;

  const vertexCount = positions4.length / 4;
  const triangleCount = vertexCount / 3;

  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  for (let i = 0; i < vertexCount; i += 1) {
    const src = i * 4;
    const dst = i * 3;

    positions[dst] = positions4[src];
    positions[dst + 1] = positions4[src + 1];
    positions[dst + 2] = positions4[src + 2];
  }

  for (let t = 0; t < triangleCount; t += 1) {
    const normalSrc = t * 4;
    const nx = normals4[normalSrc];
    const ny = normals4[normalSrc + 1];
    const nz = normals4[normalSrc + 2];

    for (let v = 0; v < 3; v += 1) {
      const normalDst = (t * 3 + v) * 3;
      normals[normalDst] = nx;
      normals[normalDst + 1] = ny;
      normals[normalDst + 2] = nz;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));

  return geometry;
};

const createBoidMaterial3D = () => {
  const boidPos = attribute("boidPos", "vec3");
  const boidVel = attribute("boidVel", "vec3");

  const material = new MeshPhongNodeMaterial({
    side: DoubleSide,
    shininess: 32,
  });

  material.positionNode = Fn(() => {
    const forward = normalize(boidVel.add(vec3(0.00001, 0, 0.00001)));
    const useAltUp = step(0.98, abs(forward.y));
    const upSeed = mix(vec3(0, 1, 0), vec3(1, 0, 0), useAltUp);

    const right = normalize(cross(upSeed, forward));
    const up = normalize(cross(forward, right));

    const local = positionLocal.mul(0.1);

    const rotated = right
      .mul(local.x)
      .add(up.mul(local.y))
      .add(forward.mul(local.z));

    return rotated.add(boidPos);
  })();

  material.normalNode = Fn(() => {
    const forward = normalize(boidVel.add(vec3(0.00001, 0, 0.00001)));
    const useAltUp = step(0.98, abs(forward.y));
    const upSeed = mix(vec3(0, 1, 0), vec3(1, 0, 0), useAltUp);

    const right = normalize(cross(upSeed, forward));
    const up = normalize(cross(forward, right));

    return normalize(
      right
        .mul(normalLocal.x)
        .add(up.mul(normalLocal.y))
        .add(forward.mul(normalLocal.z))
    );
  })();

  material.colorNode = vec3(0.98, 0.98, 1.0);

  return material;
};

const createPipeline3D = (
  count: number,
  blockSize: number,
  xBound: number,
  yBound: number,
  zBound: number,
  gridDimX: number,
  gridDimY: number,
  gridDimZ: number,
  posA: any,
  velA: any,
  posB: any,
  velB: any,
  dtNode: ReturnType<typeof uniform>
): Pipeline3D => {
  const gridTotalCells = gridDimX * gridDimY * gridDimZ;
  const blocks = Math.ceil(gridTotalCells / blockSize);

  const numBoidsNode = uint(count);
  const gridDimXNode = uint(gridDimX);
  const gridDimYNode = uint(gridDimY);
  const gridDimZNode = uint(gridDimZ);
  const gridTotalCellsNode = uint(gridTotalCells);
  const blocksNode = uint(blocks);
  const blockSizeNode = uint(blockSize);
  const zStepNode = gridDimXNode.mul(gridDimYNode).toVar();

  const xBoundNode = uniform(xBound, "float");
  const yBoundNode = uniform(yBound, "float");
  const zBoundNode = uniform(zBound, "float");
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

  const gridCellId = instancedArray(count, "uint").setName("gridCellId3D");
  const gridCellOffset = instancedArray(count, "uint").setName("gridCellOffset3D");

  const gridCounts = instancedArray(gridTotalCells, "uint").setName("gridCounts3D");
  const gridCountsAtomic = storage(
    gridCounts.value,
    "uint",
    gridTotalCells
  ).toAtomic();

  const gridPrefix = instancedArray(gridTotalCells, "uint").setName("gridPrefix3D");
  const gridSumsA = instancedArray(blocks, "uint").setName("gridSumsA3D");
  const gridSumsB = instancedArray(blocks, "uint").setName("gridSumsB3D");

  const clearGrid = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(gridTotalCellsNode), () => {
      gridCounts.element(index).assign(uint(0));
    });
  })().compute(gridTotalCells, [blockSize]);

  const updateGrid = Fn(() => {
    const index = instanceIndex;

    If(index.lessThan(numBoidsNode), () => {
      const boidPos = posA.element(index).xyz;

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

      const gridZ = uint(
        clamp(
          floor(
            boidPos.z
              .div(gridCellSizeNode)
              .add(float(gridDimZNode).mul(0.5))
          ),
          0,
          float(gridDimZ - 1)
        )
      );

      const gridId = gridZ
        .mul(zStepNode)
        .add(gridY.mul(gridDimXNode))
        .add(gridX)
        .toVar();

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
      const boidPos = posB.element(index).xyz.toVar();
      const boidVel = velB.element(index).xyz.toVar();

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

      const gridZ = uint(
        clamp(
          floor(
            boidPos.z
              .div(gridCellSizeNode)
              .add(float(gridDimZNode).mul(0.5))
          ),
          0,
          float(gridDimZ - 1)
        )
      );

      const minX = gridX.toVar();
      const maxX = gridX.toVar();
      const minY = gridY.toVar();
      const maxY = gridY.toVar();
      const minZ = gridZ.toVar();
      const maxZ = gridZ.toVar();

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

      If(gridZ.greaterThan(uint(0)), () => {
        minZ.assign(gridZ.sub(uint(1)));
      });

      If(gridZ.lessThan(gridDimZNode.sub(uint(1))), () => {
        maxZ.assign(gridZ.add(uint(1)));
      });

      const center = vec3(0, 0, 0).toVar();
      const close = vec3(0, 0, 0).toVar();
      const avgVel = vec3(0, 0, 0).toVar();
      const neighbours = uint(0).toVar();

      Loop(
        { start: minZ, end: maxZ.add(uint(1)), type: "uint" },
        ({ i: zz }: { i: any }) => {
          const zBase = zz.mul(zStepNode).toVar();

          Loop(
            { start: minY, end: maxY.add(uint(1)), type: "uint" },
            ({ i: yy }: { i: any }) => {
              const yBase = zBase.add(yy.mul(gridDimXNode)).toVar();

              Loop(
                { start: minX, end: maxX.add(uint(1)), type: "uint" },
                ({ i: xx }: { i: any }) => {
                  const cellId = yBase.add(xx).toVar();
                  const startIndex = uint(0).toVar();

                  If(cellId.greaterThan(uint(0)), () => {
                    startIndex.assign(gridPrefix.element(cellId.sub(uint(1))));
                  });

                  const endIndex = gridPrefix.element(cellId).toVar();

                  Loop(
                    { start: startIndex, end: endIndex, type: "uint" },
                    ({ i: otherIndex }: { i: any }) => {
                      const otherPos = posB.element(otherIndex).xyz;
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
                          avgVel.addAssign(velB.element(otherIndex).xyz);
                          neighbours.addAssign(uint(1));
                        }
                      );
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
        boidVel.assign(vec3(minSpeedNode, float(0), float(0)));
      });

      If(abs(boidPos.x).greaterThan(xBoundNode), () => {
        boidVel.x.subAssign(sign(boidPos.x).mul(turnSpeedNode).mul(dtNode));
      });

      If(abs(boidPos.y).greaterThan(yBoundNode), () => {
        boidVel.y.subAssign(sign(boidPos.y).mul(turnSpeedNode).mul(dtNode));
      });

      If(abs(boidPos.z).greaterThan(zBoundNode), () => {
        boidVel.z.subAssign(sign(boidPos.z).mul(turnSpeedNode).mul(dtNode));
      });

      const nextPos = boidPos.add(boidVel.mul(dtNode)).toVar();

      posA.element(index).assign(nextPos);
      velA.element(index).assign(boidVel);
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

const disposePipeline3D = (pipeline: Pipeline3D) => {
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

const runPipeline3D = (renderer: any, pipeline: Pipeline3D) => {
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

const createGpuBoids3D = (
  count: number,
  blockSize: number,
  simpleMesh: boolean,
  dtNode: ReturnType<typeof uniform>
): GpuBoids3D => {
  const spaceBounds = Math.max(1, Math.cbrt(count) / 7.5 + EDGE_MARGIN);
  const xBound = 2 * spaceBounds - EDGE_MARGIN;
  const yBound = spaceBounds - EDGE_MARGIN;
  const zBound = 2 * spaceBounds - EDGE_MARGIN;

  const gridDimX = Math.floor((xBound * 2) / VISUAL_RANGE) + 20;
  const gridDimY = Math.floor((yBound * 2) / VISUAL_RANGE) + 20;
  const gridDimZ = Math.floor((zBound * 2) / VISUAL_RANGE) + 20;

  const posA = instancedArray(count, "vec3").setName("boidPosA3D");
  const velA = instancedArray(count, "vec3").setName("boidVelA3D");
  const posB = instancedArray(count, "vec3").setName("boidPosB3D");
  const velB = instancedArray(count, "vec3").setName("boidVelB3D");

  const posAArray = posA.value.array as Float32Array;
  const velAArray = velA.value.array as Float32Array;
  const posBArray = posB.value.array as Float32Array;
  const velBArray = velB.value.array as Float32Array;

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;

    posAArray[i3] = (Math.random() * 2 - 1) * xBound;
    posAArray[i3 + 1] = (Math.random() * 2 - 1) * yBound;
    posAArray[i3 + 2] = (Math.random() * 2 - 1) * zBound;

    const phi = Math.random() * Math.PI * 2;
    const cosTheta = Math.random() * 2 - 1;
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);

    velAArray[i3] = Math.cos(phi) * sinTheta * speed;
    velAArray[i3 + 1] = cosTheta * speed;
    velAArray[i3 + 2] = Math.sin(phi) * sinTheta * speed;

    posBArray[i3] = posAArray[i3];
    posBArray[i3 + 1] = posAArray[i3 + 1];
    posBArray[i3 + 2] = posAArray[i3 + 2];

    velBArray[i3] = velAArray[i3];
    velBArray[i3 + 1] = velAArray[i3 + 1];
    velBArray[i3 + 2] = velAArray[i3 + 2];
  }

  posA.value.needsUpdate = true;
  velA.value.needsUpdate = true;
  posB.value.needsUpdate = true;
  velB.value.needsUpdate = true;

  const pipeline = createPipeline3D(
    count,
    blockSize,
    xBound,
    yBound,
    zBound,
    gridDimX,
    gridDimY,
    gridDimZ,
    posA,
    velA,
    posB,
    velB,
    dtNode
  );

  const baseMesh = simpleMesh ? triangleMesh : pyramidMesh;
  const geometry = createGeometryFromMesh(baseMesh);
  geometry.setAttribute("boidPos", posA.value);
  geometry.setAttribute("boidVel", velA.value);

  const material = createBoidMaterial3D();
  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;

  return {
    count,
    spaceBounds,
    posA,
    velA,
    mesh,
    pipeline,
  };
};

const disposeGpuBoids3D = (boids: GpuBoids3D | null, scene: Scene) => {
  if (boids === null) {
    return;
  }

  scene.remove(boids.mesh);
  boids.mesh.geometry.dispose();
  (boids.mesh.material as { dispose: () => void }).dispose();

  disposePipeline3D(boids.pipeline);
};

const rebuildMeshGeometry = (boids: GpuBoids3D, simpleMesh: boolean) => {
  boids.mesh.geometry.dispose();

  const baseMesh = simpleMesh ? triangleMesh : pyramidMesh;
  const geometry = createGeometryFromMesh(baseMesh);
  geometry.setAttribute("boidPos", boids.posA.value);
  geometry.setAttribute("boidVel", boids.velA.value);

  boids.mesh.geometry = geometry;
};

export const boids3d = async (): Promise<SceneHandle> => {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const boidText = document.getElementById("boidText") as HTMLElement;
  const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;
  const simpleToggle = document.getElementById("simpleToggle") as HTMLInputElement;
  const fpsText = document.getElementById("fpsText") as HTMLElement;

  simpleToggle.checked = false;
  boidSlider.valueAsNumber = Math.max(boidSlider.valueAsNumber || 5, 5);
  const { blockSize, maxBlocks, requiredLimits } = await getRequestedComputeLimits();
  const boidLimit = Math.max(32, Math.floor((blockSize * maxBlocks) / 4));
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
  const camera = new PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  const ambient = new AmbientLight(0xffffff, 0.2);
  scene.add(ambient);

  const directional = new DirectionalLight(0xffffff, 1.0);
  directional.position.set(-4, -8, 6);
  scene.add(directional);

  const dtNode = uniform(0.016, "float");

  let gpuBoids: GpuBoids3D | null = null;

  const resetSimulation = (count: number) => {
    disposeGpuBoids3D(gpuBoids, scene);

    gpuBoids = createGpuBoids3D(count, blockSize, simpleToggle.checked, dtNode);
    scene.add(gpuBoids.mesh);

    boidText.textContent = `Boids: ${gpuBoids.count}`;

    camera.position.set(0, 0, gpuBoids.spaceBounds * 4.5);
    controls.target.set(0, 0, 0);
    controls.maxDistance = gpuBoids.spaceBounds * 12;
    controls.update();
  };

  resetSimulation(Math.min(Math.round(Math.pow(2, boidSlider.valueAsNumber)), boidLimit));

  boidSlider.oninput = () => {
    const requested = Math.round(Math.pow(2, boidSlider.valueAsNumber));
    resetSimulation(Math.min(requested, boidLimit));
  };

  simpleToggle.onclick = () => {
    if (gpuBoids !== null) {
      rebuildMeshGeometry(gpuBoids, simpleToggle.checked);
    }
  };

  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  };

  window.addEventListener("resize", onResize);

  let lastTime = performance.now();

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) * 0.001, 0.05);
    lastTime = now;

    fpsText.textContent = `FPS: ${(1 / Math.max(dt, 1e-4)).toFixed(2)}`;
    dtNode.value = dt;

    if (gpuBoids !== null) {
      runPipeline3D(renderer, gpuBoids.pipeline);
    }

    controls.update();
    renderer.render(scene, camera);
  });

  return {
    dispose: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);

      boidSlider.oninput = null;
      simpleToggle.onclick = null;

      disposeGpuBoids3D(gpuBoids, scene);
      controls.dispose();
      renderer.dispose();
    },
  };
};
