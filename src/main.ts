import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import "./style.css";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { WebGPUEngine } from "@babylonjs/core";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import "./shaderIncludes";

let numBoids = 32;
const edgeMargin = 0.5;
const maxSpeed = 2;
const visualRange = 0.5;

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const boidText = document.getElementById("boidText") as HTMLElement;
const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;

const fpsText = document.getElementById("fpsText") as HTMLElement;
const engine = new WebGPUEngine(canvas);
await engine.initAsync();

let scene: Scene;
let zoom: number;
let orthoSize: number;
let aspectRatio: number;
let camera: FreeCamera;

const boidComputeShader = new ComputeShader("boids", engine, "./boids", {
  bindingsMapping: {
    params: { group: 0, binding: 0 },
    boids: { group: 0, binding: 1 },
    boidsIn: { group: 0, binding: 2 },
    gridOffsets: { group: 0, binding: 3 },
  },
});

const clearGridComputeShader = new ComputeShader(
  "clearGrid",
  engine,
  "./clearGrid",
  {
    bindingsMapping: {
      params: { group: 0, binding: 0 },
      gridOffsets: { group: 0, binding: 1 },
    },
  }
);

const updateGridComputeShader = new ComputeShader(
  "updateGrid",
  engine,
  "./updateGrid",
  {
    bindingsMapping: {
      params: { group: 0, binding: 0 },
      grid: { group: 0, binding: 1 },
      gridOffsets: { group: 0, binding: 2 },
      boids: { group: 0, binding: 3 },
    },
  }
);

const prefixSumComputeShader = new ComputeShader(
  "prefixSum",
  engine,
  "./prefixSum",
  {
    bindingsMapping: {
      params: { group: 0, binding: 0 },
      gridOffsetsIn: { group: 0, binding: 1 },
      gridOffsetsOut: { group: 0, binding: 2 },
      divider: { group: 0, binding: 3 },
    },
  }
);

const rearrangeBoidsComputeShader = new ComputeShader(
  "rearrangeBoids",
  engine,
  "./rearrangeBoids",
  {
    bindingsMapping: {
      params: { group: 0, binding: 0 },
      grid: { group: 0, binding: 1 },
      gridOffsets: { group: 0, binding: 2 },
      boidsIn: { group: 0, binding: 3 },
      boidsOut: { group: 0, binding: 4 },
    },
  }
);

let gridBuffer: StorageBuffer;
let gridOffsetsBuffer: StorageBuffer;
let gridOffsetsBuffer2: StorageBuffer;
let gridTotalCells: number;

// TODO: when theres an easier way to pass a single uint to a compute shader multiple times per frame, use that
// eg. https://github.com/gpuweb/gpuweb/issues/75
const dividers: UniformBuffer[] = [];
for (let i = 0; i < 25; i++) {
  const divider = new UniformBuffer(
    engine,
    undefined,
    false,
    `dividerBuffer${i}`
  );
  divider.updateUInt("divider", 1 << i);
  divider.update();
  dividers.push(divider);
}

const params = new UniformBuffer(engine, undefined, true, "params");
params.addUniform("numBoids", 1);
params.addUniform("xBound", 1);
params.addUniform("yBound", 1);
params.addUniform("maxSpeed", 1);
params.addUniform("minSpeed", 1);
params.addUniform("turnSpeed", 1);
params.addUniform("visualRange", 1);
params.addUniform("minDistance", 1);
params.addUniform("cohesionFactor", 1);
params.addUniform("alignmentFactor", 1);
params.addUniform("separationFactor", 1);
params.addUniform("dt", 1);
params.addUniform("gridDimX", 1);
params.addUniform("gridDimY", 1);
params.addUniform("gridCellSize", 1);
params.addUniform("gridTotalCells", 1);

const setup = () => {
  boidText.innerHTML = `Boids: ${numBoids}`;
  scene = new Scene(engine);
  camera = new FreeCamera("camera1", new Vector3(0, 0, -5), scene);
  camera.mode = 1;
  aspectRatio = engine.getRenderWidth() / engine.getRenderHeight();
  orthoSize = Math.max(2, Math.sqrt(numBoids) / 10 + edgeMargin);
  zoom = orthoSize;
  camera.orthoBottom = -orthoSize;
  camera.orthoTop = orthoSize;
  camera.orthoLeft = -orthoSize * aspectRatio;
  camera.orthoRight = orthoSize * aspectRatio;

  const xBound = orthoSize * aspectRatio - edgeMargin;
  const yBound = orthoSize - edgeMargin;

  const gridDimX = Math.floor((xBound * 2) / visualRange) + 30;
  const gridDimY = Math.floor((yBound * 2) / visualRange) + 30;
  gridTotalCells = gridDimX * gridDimY;

  const stride = 4;
  const boids = new Float32Array(numBoids * stride);
  for (let i = 0; i < numBoids; ++i) {
    // Position
    boids[stride * i + 0] = Math.random() * xBound * 2 - xBound;
    boids[stride * i + 1] = Math.random() * yBound * 2 - yBound;
    // Velocity
    boids[stride * i + 2] = Math.random() - 0.5;
    boids[stride * i + 3] = Math.random() - 0.5;
  }

  // Boids
  const boidsComputeBuffer = new StorageBuffer(engine, boids.byteLength, 8 | 2);
  const boidsComputeBuffer2 = new StorageBuffer(engine, boids.byteLength);
  boidsComputeBuffer.update(boids);

  const boidPositionBuffer = new VertexBuffer(
    engine,
    boidsComputeBuffer.getBuffer(),
    "boidPos",
    false,
    false,
    stride,
    true,
    0,
    2
  );

  const boidVelocityBuffer = new VertexBuffer(
    engine,
    boidsComputeBuffer.getBuffer(),
    "boidVel",
    false,
    false,
    stride,
    true,
    2,
    2
  );

  // Load texture and materials
  const boidMat = new ShaderMaterial("boidMat", scene, "./boidShader", {
    attributes: ["position", "boidPos", "boidVel"],
    uniforms: ["worldViewProjection"],
  });

  // Create boid mesh
  var boidMesh = new Mesh("custom", scene);
  var positions = [0, 0.5, 0, -0.4, -0.5, 0, 0.4, -0.5, 0];
  var indices = [0, 1, 2];
  var vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.applyToMesh(boidMesh);

  boidMesh.material = boidMat;
  boidMesh.forcedInstanceCount = numBoids;
  boidMesh.setVerticesBuffer(boidPositionBuffer, false);
  boidMesh.setVerticesBuffer(boidVelocityBuffer, false);
  boidMesh.buildBoundingInfo(
    new Vector3(-xBound, -yBound, 0),
    new Vector3(xBound, yBound, 0)
  );

  params.updateUInt("numBoids", numBoids);
  params.updateFloat("xBound", xBound);
  params.updateFloat("yBound", yBound);
  params.updateFloat("maxSpeed", maxSpeed);
  params.updateFloat("minSpeed", maxSpeed * 0.75);
  params.updateFloat("turnSpeed", maxSpeed * 3);
  params.updateFloat("visualRange", visualRange);
  params.updateFloat("minDistance", 0.15);
  params.updateFloat("cohesionFactor", 1);
  params.updateFloat("alignmentFactor", 5);
  params.updateFloat("separationFactor", 30);
  params.updateUInt("gridDimX", gridDimX);
  params.updateUInt("gridDimY", gridDimY);
  params.updateFloat("gridCellSize", visualRange);
  params.updateUInt("gridTotalCells", gridTotalCells);

  params.update();

  // Grid
  gridBuffer = new StorageBuffer(engine, numBoids * 8);
  gridOffsetsBuffer = new StorageBuffer(engine, gridTotalCells * 4);
  gridOffsetsBuffer2 = new StorageBuffer(engine, gridTotalCells * 4);

  clearGridComputeShader.setUniformBuffer("params", params);
  clearGridComputeShader.setStorageBuffer("gridOffsets", gridOffsetsBuffer);

  updateGridComputeShader.setUniformBuffer("params", params);
  updateGridComputeShader.setStorageBuffer("grid", gridBuffer);
  updateGridComputeShader.setStorageBuffer("gridOffsets", gridOffsetsBuffer);
  updateGridComputeShader.setStorageBuffer("boids", boidsComputeBuffer);

  prefixSumComputeShader.setUniformBuffer("params", params);
  prefixSumComputeShader.setUniformBuffer("divider", dividers[0]);

  rearrangeBoidsComputeShader.setUniformBuffer("params", params);
  rearrangeBoidsComputeShader.setStorageBuffer("grid", gridBuffer);
  rearrangeBoidsComputeShader.setStorageBuffer(
    "gridOffsets",
    gridOffsetsBuffer
  );
  rearrangeBoidsComputeShader.setStorageBuffer("boidsIn", boidsComputeBuffer);
  rearrangeBoidsComputeShader.setStorageBuffer("boidsOut", boidsComputeBuffer2);

  boidComputeShader.setUniformBuffer("params", params);
  boidComputeShader.setStorageBuffer("boids", boidsComputeBuffer);
  boidComputeShader.setStorageBuffer("boidsIn", boidsComputeBuffer2);
};

setup();

canvas.addEventListener("wheel", (e) => {
  zoom += e.deltaY * 0.001 * orthoSize;
  orthoSize = zoom;
  camera.orthoBottom = -orthoSize;
  camera.orthoTop = orthoSize;
  camera.orthoLeft = -orthoSize * aspectRatio;
  camera.orthoRight = orthoSize * aspectRatio;
});

canvas.addEventListener("pointermove", (e) => {
  if (e.buttons) {
    camera.position.x -= e.movementX * 0.0025 * orthoSize;
    camera.position.y += e.movementY * 0.0025 * orthoSize;
  }
});

boidSlider.oninput = () => {
  numBoids = Math.round(Math.pow(2, boidSlider.valueAsNumber));
  scene.dispose();
  setup();
};

engine.runRenderLoop(async () => {
  const fps = engine.getFps();
  fpsText.innerHTML = `FPS: ${fps.toFixed(2)}`;

  clearGridComputeShader.dispatch(Math.ceil(gridTotalCells / 256), 1, 1);
  updateGridComputeShader.dispatch(Math.ceil(numBoids / 256), 1, 1);

  let swap = false;
  let dBufferInd = 0;
  for (let d = 1; d < gridTotalCells; d *= 2) {
    prefixSumComputeShader.setStorageBuffer(
      "gridOffsetsIn",
      swap ? gridOffsetsBuffer2 : gridOffsetsBuffer
    );
    prefixSumComputeShader.setStorageBuffer(
      "gridOffsetsOut",
      swap ? gridOffsetsBuffer : gridOffsetsBuffer2
    );

    prefixSumComputeShader.setUniformBuffer("divider", dividers[dBufferInd]);
    prefixSumComputeShader.dispatch(Math.ceil(gridTotalCells / 256), 1, 1);
    swap = !swap;
    dBufferInd++;
  }

  // // Left for testing in-case I need to debug the prefix sum
  // const test = new Uint32Array((await gridOffsetsBuffer.read()).buffer);
  // const test2 = new Uint32Array((await gridOffsetsBuffer2.read()).buffer);
  // console.log(test2.at(-1), test.at(-1));
  // // console.log(...test.slice(0, 5), ...test2.slice(0, 5));
  // return;

  rearrangeBoidsComputeShader.setStorageBuffer(
    "gridOffsets",
    swap ? gridOffsetsBuffer2 : gridOffsetsBuffer
  );
  boidComputeShader.setStorageBuffer(
    "gridOffsets",
    swap ? gridOffsetsBuffer2 : gridOffsetsBuffer
  );
  rearrangeBoidsComputeShader.dispatch(Math.ceil(numBoids / 256), 1, 1);

  boidComputeShader.dispatch(Math.ceil(numBoids / 256), 1, 1);
  scene.render();
  params.updateFloat("dt", scene.deltaTime / 1000);
  params.update();
});
