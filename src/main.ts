import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import "./style.css";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import {
  ComputeShader,
  Mesh,
  UniformBuffer,
  VertexData,
  WebGPUEngine,
} from "@babylonjs/core";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { boidComputeSource } from "./boidComputeShader";

let numBoids = 32;
const edgeMargin = 0.5;
const maxSpeed = 2;

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const boidText = document.getElementById("boidText") as HTMLElement;
const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;

const fpsText = document.getElementById("fpsText") as HTMLElement;
const engine = new WebGPUEngine(canvas);
await engine.initAsync();

let scene: Scene;
let boidComputeShader: ComputeShader;

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

const setup = () => {
  boidText.innerHTML = `Boids: ${numBoids}`;
  scene = new Scene(engine);
  var camera = new FreeCamera("camera1", new Vector3(0, 0, -5), scene);
  camera.mode = 1;
  const aspectRatio = engine.getRenderWidth() / engine.getRenderHeight();
  const orthoSize = Math.max(2, Math.sqrt(numBoids) / 10 + edgeMargin);
  camera.orthoBottom = -orthoSize;
  camera.orthoTop = orthoSize;
  camera.orthoLeft = -orthoSize * aspectRatio;
  camera.orthoRight = orthoSize * aspectRatio;

  const xBound = orthoSize * aspectRatio - edgeMargin;
  const yBound = orthoSize - edgeMargin;

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

  const boidsComputeBuffer = new StorageBuffer(engine, boids.byteLength, 8 | 2);
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

  params.updateUInt("numBoids", numBoids);
  params.updateFloat("xBound", xBound);
  params.updateFloat("yBound", yBound);
  params.updateFloat("maxSpeed", maxSpeed);
  params.updateFloat("minSpeed", maxSpeed * 0.75);
  params.updateFloat("turnSpeed", maxSpeed * 3);
  params.updateFloat("visualRange", 0.5);
  params.updateFloat("minDistance", 0.15);
  params.updateFloat("cohesionFactor", 1);
  params.updateFloat("alignmentFactor", 5);
  params.updateFloat("separationFactor", 30);

  params.update();

  boidComputeShader = new ComputeShader(
    "bunniesCompute",
    engine,
    { computeSource: boidComputeSource },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        bunnies: { group: 0, binding: 1 },
      },
    }
  );
  boidComputeShader.setUniformBuffer("params", params);
  boidComputeShader.setStorageBuffer("bunnies", boidsComputeBuffer);
};

setup();

boidSlider.oninput = (e) => {
  numBoids = boidSlider.valueAsNumber;
  scene.dispose();
  setup();
};

engine.runRenderLoop(() => {
  const fps = engine.getFps();
  fpsText.innerHTML = `FPS: ${fps.toFixed(2)}`;

  boidComputeShader.dispatch(Math.ceil(numBoids / 256), 1, 1);
  scene.render();
  params.updateFloat("dt", scene.deltaTime / 1000);
  params.update();
});
