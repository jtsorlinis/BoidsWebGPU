import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import "./style.css";
import { ShaderLanguage, UniversalCamera, WebGPUEngine } from "@babylonjs/core";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { setupIncludes } from "./shaderIncludes";
import { pyramidMesh } from "./pyramidMesh";
import { triangleMesh } from "./triangleMesh";

export const boids3d = async () => {
  let numBoids = 32;
  const edgeMargin = 0.5;
  const maxSpeed = 2;
  const visualRange = 0.5;
  const minDistance = 0.15;
  const cohesionFactor = 2;
  const alignmentFactor = 5;
  const separationFactor = 1;

  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  const boidText = document.getElementById("boidText") as HTMLElement;
  const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;

  const fpsText = document.getElementById("fpsText") as HTMLElement;
  const engine = new WebGPUEngine(canvas, {
    setMaximumLimits: true,
    enableAllFeatures: true,
  });
  await engine.initAsync();

  if (!engine.getCaps()?.supportComputeShaders) {
    document.body.innerHTML =
      "WebGPU is not supported on this browser, please update to the latest version of Chrome";
  }

  const blockSize = engine.currentLimits.maxComputeWorkgroupSizeX;
  setupIncludes(blockSize);
  const maxBlocks = engine.currentLimits.maxComputeWorkgroupsPerDimension;
  const boidLimit = (blockSize * maxBlocks) / 4;
  boidSlider.max = Math.ceil(Math.log2(boidLimit)).toString();

  let scene: Scene;
  let spaceBounds: number;
  let camera: UniversalCamera;

  const generateBoidsComputeShader = new ComputeShader(
    "generateBoids",
    engine,
    "./3d/generateBoids3d",
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        boids: { group: 0, binding: 1 },
      },
    }
  );

  const boidComputeShader = new ComputeShader("boids", engine, "./3d/boids3d", {
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
    "./3d/clearGrid3d",
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
    "./3d/updateGrid3d",
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
    "./3d/prefixSum3d",
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridOffsetsIn: { group: 0, binding: 1 },
        gridOffsetsOut: { group: 0, binding: 2 },
        gridSums: { group: 0, binding: 3 },
      },
    }
  );

  const sumBucketsComputeShader = new ComputeShader(
    "sumBuckets",
    engine,
    "./3d/sumBuckets3d",
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridSumsIn: { group: 0, binding: 1 },
        gridSumsOut: { group: 0, binding: 2 },
      },
    }
  );

  const addSumsComputeShader = new ComputeShader(
    "addSums",
    engine,
    "./3d/addSums3d",
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridSumsIn: { group: 0, binding: 1 },
        gridOffsetsOut: { group: 0, binding: 2 },
      },
    }
  );

  const rearrangeBoidsComputeShader = new ComputeShader(
    "rearrangeBoids",
    engine,
    "./3d/rearrangeBoids3d",
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

  let boidsComputeBuffer: StorageBuffer;
  let boidsComputeBuffer2: StorageBuffer;
  let gridBuffer: StorageBuffer;
  let gridOffsetsBuffer: StorageBuffer;
  let gridOffsetsBuffer2: StorageBuffer;
  let gridSumsBuffer: StorageBuffer;
  let gridSumsBuffer2: StorageBuffer;
  let gridTotalCells: number;
  let blocks: number;
  let boidMat: ShaderMaterial;
  let boidVerticesBuffer: StorageBuffer;
  let boidNormalsBuffer: StorageBuffer;

  const params = new UniformBuffer(engine, undefined, false, "params");
  params.addUniform("numBoids", 1);
  params.addUniform("xBound", 1);
  params.addUniform("yBound", 1);
  params.addUniform("zBound", 1);
  params.addUniform("maxSpeed", 1);
  params.addUniform("minSpeed", 1);
  params.addUniform("turnSpeed", 1);
  params.addUniform("visualRangeSq", 1);
  params.addUniform("minDistanceSq", 1);
  params.addUniform("cohesionFactor", 1);
  params.addUniform("alignmentFactor", 1);
  params.addUniform("separationFactor", 1);
  params.addUniform("dt", 1);
  params.addUniform("gridDimX", 1);
  params.addUniform("gridDimY", 1);
  params.addUniform("gridDimZ", 1);
  params.addUniform("gridCellSize", 1);
  params.addUniform("gridTotalCells", 1);
  params.addUniform("divider", 1);
  params.addUniform("rngSeed", 1);
  params.addUniform("blocks", 1);

  const setup = () => {
    boidText.innerHTML = `Boids: ${numBoids}`;
    scene = new Scene(engine);
    camera = new UniversalCamera("camera1", new Vector3(0, 0, -5), scene);
    camera.minZ = 0.1;
    camera.speed = 0.3;
    camera.keysLeft = [65];
    camera.keysRight = [68];
    camera.keysUp = [87];
    camera.keysDown = [83];
    camera.keysUpward = [69];
    camera.keysDownward = [81];
    camera.attachControl();
    spaceBounds = Math.max(1, Math.pow(numBoids, 1 / 3) / 7.5 + edgeMargin);
    camera.position.z = -spaceBounds * 4.5;

    const xBound = 2 * spaceBounds - edgeMargin;
    const yBound = spaceBounds - edgeMargin;
    const zBound = 2 * spaceBounds - edgeMargin;

    const gridDimX = Math.floor((xBound * 2) / visualRange) + 20;
    const gridDimY = Math.floor((yBound * 2) / visualRange) + 20;
    const gridDimZ = Math.floor((zBound * 2) / visualRange) + 20;
    gridTotalCells = gridDimX * gridDimY * gridDimZ;
    blocks = Math.ceil(gridTotalCells / blockSize);

    // Boids
    boidsComputeBuffer = new StorageBuffer(engine, numBoids * 32);
    boidsComputeBuffer2 = new StorageBuffer(engine, numBoids * 32);

    // Load texture and materials
    boidMat = new ShaderMaterial("boidMat", scene, "./3d/boidShader3d", {
      uniformBuffers: ["Scene"],
      storageBuffers: ["boids", "boidVertices", "boidNormals"],
      shaderLanguage: ShaderLanguage.WGSL,
    });
    boidMat.setStorageBuffer("boids", boidsComputeBuffer);

    // Create boid mesh
    const mesh = pyramidMesh;
    const boidMesh = new Mesh("custom", scene);
    boidMesh.setVerticesData(VertexBuffer.PositionKind, [0]);
    boidMesh.isUnIndexed = true;
    boidMesh.subMeshes[0].verticesCount = (numBoids * mesh.vertices.length) / 4;

    boidVerticesBuffer = new StorageBuffer(engine, mesh.vertices.length * 4);
    boidVerticesBuffer.update(mesh.vertices);
    boidMat.setStorageBuffer("boidVertices", boidVerticesBuffer);
    boidNormalsBuffer = new StorageBuffer(engine, mesh.normals.length * 4);
    boidNormalsBuffer.update(mesh.normals);
    boidMat.setStorageBuffer("boidNormals", boidNormalsBuffer);
    boidMat.setUInt("numVertices", mesh.vertices.length / 4);
    boidMat.setVector3("cameraPosition", camera.position);

    boidMesh.material = boidMat;
    boidMesh.buildBoundingInfo(
      new Vector3(-xBound, -yBound, -zBound),
      new Vector3(xBound, yBound, zBound)
    );

    params.updateUInt("numBoids", numBoids);
    params.updateFloat("xBound", xBound);
    params.updateFloat("yBound", yBound);
    params.updateFloat("zBound", zBound);
    params.updateFloat("maxSpeed", maxSpeed);
    params.updateFloat("minSpeed", maxSpeed * 0.75);
    params.updateFloat("turnSpeed", maxSpeed * 3);
    params.updateFloat("visualRangeSq", visualRange * visualRange);
    params.updateFloat("minDistanceSq", minDistance * minDistance);
    params.updateFloat("cohesionFactor", cohesionFactor);
    params.updateFloat("alignmentFactor", alignmentFactor);
    params.updateFloat("separationFactor", separationFactor);
    params.updateUInt("gridDimX", gridDimX);
    params.updateUInt("gridDimY", gridDimY);
    params.updateUInt("gridDimZ", gridDimZ);
    params.updateFloat("gridCellSize", visualRange);
    params.updateUInt("gridTotalCells", gridTotalCells);
    params.updateUInt("rngSeed", Math.floor(Math.random() * 10000000));
    params.updateUInt("blocks", blocks);

    params.update();

    // Grid
    gridBuffer = new StorageBuffer(engine, numBoids * 8);
    gridOffsetsBuffer = new StorageBuffer(engine, gridTotalCells * 4);
    gridOffsetsBuffer2 = new StorageBuffer(engine, gridTotalCells * 4);
    gridSumsBuffer = new StorageBuffer(engine, blocks * 4);
    gridSumsBuffer2 = new StorageBuffer(engine, blocks * 4);

    clearGridComputeShader.setUniformBuffer("params", params);
    clearGridComputeShader.setStorageBuffer("gridOffsets", gridOffsetsBuffer);

    updateGridComputeShader.setUniformBuffer("params", params);
    updateGridComputeShader.setStorageBuffer("grid", gridBuffer);
    updateGridComputeShader.setStorageBuffer("gridOffsets", gridOffsetsBuffer);
    updateGridComputeShader.setStorageBuffer("boids", boidsComputeBuffer);

    prefixSumComputeShader.setUniformBuffer("params", params);
    prefixSumComputeShader.setStorageBuffer(
      "gridOffsetsOut",
      gridOffsetsBuffer2
    );
    prefixSumComputeShader.setStorageBuffer("gridOffsetsIn", gridOffsetsBuffer);
    prefixSumComputeShader.setStorageBuffer("gridSums", gridSumsBuffer);

    sumBucketsComputeShader.setUniformBuffer("params", params);

    addSumsComputeShader.setUniformBuffer("params", params);
    addSumsComputeShader.setStorageBuffer("gridOffsetsOut", gridOffsetsBuffer2);

    rearrangeBoidsComputeShader.setUniformBuffer("params", params);
    rearrangeBoidsComputeShader.setStorageBuffer("grid", gridBuffer);
    rearrangeBoidsComputeShader.setStorageBuffer(
      "gridOffsets",
      gridOffsetsBuffer2
    );
    rearrangeBoidsComputeShader.setStorageBuffer("boidsIn", boidsComputeBuffer);
    rearrangeBoidsComputeShader.setStorageBuffer(
      "boidsOut",
      boidsComputeBuffer2
    );

    boidComputeShader.setUniformBuffer("params", params);
    boidComputeShader.setStorageBuffer("boidsIn", boidsComputeBuffer2);
    boidComputeShader.setStorageBuffer("boids", boidsComputeBuffer);
    boidComputeShader.setStorageBuffer("gridOffsets", gridOffsetsBuffer2);

    // Generate boids on GPU
    generateBoidsComputeShader.setUniformBuffer("params", params);
    generateBoidsComputeShader.setStorageBuffer("boids", boidsComputeBuffer);
    generateBoidsComputeShader.dispatchWhenReady(
      Math.ceil(numBoids / blockSize),
      1,
      1
    );
  };

  const disposeAll = () => {
    scene.dispose();
    boidsComputeBuffer.dispose();
    boidsComputeBuffer2.dispose();
    gridBuffer.dispose();
    gridOffsetsBuffer.dispose();
    gridOffsetsBuffer2.dispose();
    gridSumsBuffer.dispose();
    gridSumsBuffer2.dispose();
    boidVerticesBuffer.dispose();
    boidNormalsBuffer.dispose();
  };

  setup();

  boidSlider.oninput = () => {
    numBoids = Math.round(Math.pow(2, boidSlider.valueAsNumber));
    if (numBoids > boidLimit) {
      numBoids = boidLimit;
    }
    disposeAll();
    setup();
  };

  canvas.onpointerdown = () => {
    canvas.requestPointerLock();
  };

  canvas.onpointerup = () => {
    document.exitPointerLock();
  };

  let debounce: number;
  window.onresize = () => {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      engine.resize();
    }, 100);
  };

  engine.runRenderLoop(async () => {
    const fps = engine.getFps();
    fpsText.innerHTML = `FPS: ${fps.toFixed(2)}`;

    clearGridComputeShader.dispatch(blocks, 1, 1);
    updateGridComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);

    prefixSumComputeShader.dispatch(blocks, 1, 1);

    let swap = false;
    for (let d = 1; d < gridTotalCells; d *= 2) {
      sumBucketsComputeShader.setStorageBuffer(
        "gridSumsIn",
        swap ? gridSumsBuffer2 : gridSumsBuffer
      );
      sumBucketsComputeShader.setStorageBuffer(
        "gridSumsOut",
        swap ? gridSumsBuffer : gridSumsBuffer2
      );

      params.updateUInt("divider", d);
      params.update();
      sumBucketsComputeShader.dispatch(Math.ceil(blocks / blockSize), 1, 1);
      swap = !swap;
    }

    addSumsComputeShader.setStorageBuffer(
      "gridSumsIn",
      swap ? gridSumsBuffer2 : gridSumsBuffer
    );
    addSumsComputeShader.dispatch(blocks, 1, 1);
    rearrangeBoidsComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);

    const dt = scene.deltaTime / 1000;
    if (isFinite(dt) && dt > 0) {
      params.updateFloat("dt", dt);
      params.update();
    }
    boidComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);
    scene.render();
  });

  return engine;
};
