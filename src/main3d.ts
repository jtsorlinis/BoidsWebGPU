import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import "./style.css";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Scalar, ShaderLanguage, WebGPUEngine } from "@babylonjs/core";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Vector2, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { setupIncludes } from "./shaderIncludes";

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
  const avoidToggle = document.getElementById(
    "avoidToggle"
  ) as HTMLInputElement;

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
  const boidLimit = blockSize * maxBlocks;
  boidSlider.max = Math.ceil(Math.log2(boidLimit)).toString();

  let scene: Scene;
  let targetZoom: number;
  let orthoSize: number;
  let aspectRatio: number;
  let camera: FreeCamera;

  const generateBoidsComputeShader = new ComputeShader(
    "generateBoids",
    engine,
    "./3d/generateBoids",
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        boids: { group: 0, binding: 1 },
      },
    }
  );

  const boidComputeShader = new ComputeShader("boids", engine, "./3d/boids", {
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
    "./3d/clearGrid",
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
    "./3d/updateGrid",
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
    "./3d/prefixSum",
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
    "./3d/sumBuckets",
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
    "./3d/addSums",
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
    "./3d/rearrangeBoids",
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
  let gridSumsBuffer: StorageBuffer;
  let gridSumsBuffer2: StorageBuffer;
  let gridTotalCells: number;
  let blocks: number;
  let boidMat: ShaderMaterial;

  const params = new UniformBuffer(engine, undefined, false, "params");
  params.addUniform("numBoids", 1);
  params.addUniform("xBound", 1);
  params.addUniform("yBound", 1);
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
  params.addUniform("gridCellSize", 1);
  params.addUniform("gridTotalCells", 1);
  params.addUniform("divider", 1);
  params.addUniform("rngSeed", 1);
  params.addUniform("blocks", 1);
  params.addUniform("avoidMouse", 1);
  params.addUniform("zoom", 1);
  params.addFloat2("mousePos", 0, 0);

  const setup = () => {
    boidText.innerHTML = `Boids: ${numBoids}`;
    scene = new Scene(engine);
    camera = new FreeCamera("camera1", new Vector3(0, 0, -5), scene);
    camera.mode = 1;
    aspectRatio = engine.getRenderWidth() / engine.getRenderHeight();
    orthoSize = Math.max(2, Math.sqrt(numBoids) / 10 + edgeMargin);
    targetZoom = orthoSize;
    camera.orthoBottom = -orthoSize;
    camera.orthoTop = orthoSize;
    camera.orthoLeft = -orthoSize * aspectRatio;
    camera.orthoRight = orthoSize * aspectRatio;

    const xBound = orthoSize * aspectRatio - edgeMargin;
    const yBound = orthoSize - edgeMargin;

    const gridDimX = Math.floor((xBound * 2) / visualRange) + 30;
    const gridDimY = Math.floor((yBound * 2) / visualRange) + 30;
    gridTotalCells = gridDimX * gridDimY;
    blocks = Math.ceil(gridTotalCells / blockSize);

    const stride = 4;
    const boids = new Float32Array(numBoids * stride);

    // Boids
    const boidsComputeBuffer = new StorageBuffer(
      engine,
      boids.byteLength,
      8 | 2
    );
    const boidsComputeBuffer2 = new StorageBuffer(engine, boids.byteLength);
    boidsComputeBuffer.update(boids);

    // Load texture and materials
    boidMat = new ShaderMaterial("boidMat", scene, "./3d/boidShader", {
      uniformBuffers: ["Scene", "boidVertices"],
      storageBuffers: ["boids"],
      shaderLanguage: ShaderLanguage.WGSL,
    });
    boidMat.setStorageBuffer("boids", boidsComputeBuffer);

    // Create boid mesh
    const boidMesh = new Mesh("custom", scene);
    boidMesh.setVerticesData(VertexBuffer.PositionKind, [0]);
    boidMesh.isUnIndexed = true;
    boidMesh.subMeshes[0].verticesCount = numBoids * 3;

    const positions = [0, 0.5, 0, 0, -0.4, -0.5, 0, 0, 0.4, -0.5, 0, 0];
    const boidVerticesBuffer = new UniformBuffer(engine, positions);
    boidVerticesBuffer.update();
    boidMat.setUniformBuffer("boidVertices", boidVerticesBuffer);

    boidMesh.material = boidMat;
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
    params.updateFloat("visualRangeSq", visualRange * visualRange);
    params.updateFloat("minDistanceSq", minDistance * minDistance);
    params.updateFloat("cohesionFactor", cohesionFactor);
    params.updateFloat("alignmentFactor", alignmentFactor);
    params.updateFloat("separationFactor", separationFactor);
    params.updateUInt("gridDimX", gridDimX);
    params.updateUInt("gridDimY", gridDimY);
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

  setup();

  canvas.onwheel = (e) => {
    const zoomDelta = e.deltaY * orthoSize * 0.001;
    if (targetZoom + zoomDelta > 1) {
      targetZoom += zoomDelta;
    }
  };

  canvas.onpointermove = (e) => {
    const mouseX =
      (e.x / canvas.width - 0.5) * orthoSize * 2 * aspectRatio +
      camera.position.x;
    const mouseY =
      -(e.y / canvas.height - 0.5) * orthoSize * 2 + camera.position.y;
    boidMat.setVector2("mousePos", new Vector2(mouseX, mouseY));
    params.updateFloat2("mousePos", mouseX, mouseY);
    params.update();

    if (e.buttons) {
      camera.position.x -= e.movementX * 0.002 * orthoSize;
      camera.position.y += e.movementY * 0.002 * orthoSize;
    }
  };

  boidSlider.oninput = () => {
    numBoids = Math.round(Math.pow(2, boidSlider.valueAsNumber));
    if (numBoids > boidLimit) {
      numBoids = boidLimit;
    }
    scene.dispose();
    setup();
  };

  let debounce: number;
  window.onresize = () => {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      scene.dispose();
      engine.resize();
      setup();
    }, 100);
  };

  avoidToggle.onclick = () => {
    params.updateUInt("avoidMouse", avoidToggle.checked ? 1 : 0);
    boidMat.setUInt("avoidMouse", avoidToggle.checked ? 1 : 0);
  };

  const smoothZoom = () => {
    if (Math.abs(orthoSize - targetZoom) > 0.01) {
      const aspectRatio = engine.getAspectRatio(camera);
      orthoSize = Scalar.Lerp(orthoSize, targetZoom, 0.1);
      camera.orthoBottom = -orthoSize;
      camera.orthoTop = orthoSize;
      camera.orthoLeft = -orthoSize * aspectRatio;
      camera.orthoRight = orthoSize * aspectRatio;
    }
  };

  engine.runRenderLoop(async () => {
    const fps = engine.getFps();
    fpsText.innerHTML = `FPS: ${fps.toFixed(2)}`;
    smoothZoom();

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

    params.updateFloat("dt", scene.deltaTime / 1000 || 0.016);
    params.updateFloat("zoom", orthoSize / 3);
    boidMat.setFloat("zoom", orthoSize / 3);
    params.update();
    boidComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);
    scene.render();
  });

  return engine;
};
