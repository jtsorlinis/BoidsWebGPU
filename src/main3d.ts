import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { Constants } from "@babylonjs/core/Engines/constants";
import "@babylonjs/core/Helpers/sceneHelpers";
import { UniversalCamera, WebGPUEngine } from "@babylonjs/core";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { UniformBuffer } from "@babylonjs/core/Materials/uniformBuffer";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { RawCubeTexture } from "@babylonjs/core/Materials/Textures/rawCubeTexture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { StorageBuffer } from "@babylonjs/core/Buffers/storageBuffer";
import { setupIncludes } from "./shaders";
import { triangleMesh } from "./meshes/triangleMesh";
import { createComputeShaders3d } from "./shaders/3d";

const BOID_SCALE = 0.1;
const SKYBOX_TEXTURE_SIZE = 64;
const SKYBOX_SIZE = 100000;
const SHADOW_MAP_SIZE = 4096;
const SUN_INTENSITY = 3;
const FILL_LIGHT_INTENSITY = 0.4;
const ZENITH_SKY = [0.45, 0.55, 0.71] as const;
const HORIZON_SKY = [0.65, 0.76, 0.88] as const;
const HORIZON_GLOW = [0.84, 0.92, 0.94] as const;
const GROUND_SKY = [0.44, 0.42, 0.4] as const;

type BoidTemplateMesh = {
  normals: Float32Array;
  vertices: Float32Array;
};

const packVec4Data = (data: Float32Array) => {
  const vertexCount = data.length / 3;
  const packed = new Float32Array(vertexCount * 4);

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const source = vertex * 3;
    const target = vertex * 4;
    packed[target] = data[source];
    packed[target + 1] = data[source + 1];
    packed[target + 2] = data[source + 2];
  }

  return packed;
};

const getRenderMeshData = (mesh: BoidTemplateMesh) => {
  const vertexCount = mesh.vertices.length / 4;
  const triangleCount = vertexCount / 3;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const source = vertex * 4;
    const target = vertex * 3;
    positions[target] = mesh.vertices[source] * BOID_SCALE;
    positions[target + 1] = mesh.vertices[source + 1] * BOID_SCALE;
    positions[target + 2] = mesh.vertices[source + 2] * BOID_SCALE;
  }

  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const normalSource = triangle * 4;
    const nx = mesh.normals[normalSource];
    const ny = mesh.normals[normalSource + 1];
    const nz = mesh.normals[normalSource + 2];
    const target = triangle * 9;

    for (let vertex = 0; vertex < 3; vertex += 1) {
      const offset = target + vertex * 3;
      normals[offset] = nx;
      normals[offset + 1] = ny;
      normals[offset + 2] = nz;
    }
  }

  return { normals, positions };
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const getCubeDirection = (face: number, u: number, v: number) => {
  switch (face) {
    case 0:
      return [1, -v, -u] as const;
    case 1:
      return [-1, -v, u] as const;
    case 2:
      return [u, 1, v] as const;
    case 3:
      return [u, -1, -v] as const;
    case 4:
      return [u, -v, 1] as const;
    default:
      return [-u, -v, -1] as const;
  }
};

const sampleSkyboxColour = (x: number, y: number, z: number) => {
  const length = Math.hypot(x, y, z);
  const dirY = y / length;

  const skyBlend = smoothstep(0.0, 0.95, dirY * 0.5 + 0.5);
  const groundBlend = smoothstep(-0.08, 0.02, dirY);
  const skyMix = Math.pow(skyBlend, 0.8);
  const horizonGlow =
    smoothstep(-0.01, 0.05, dirY) * (1 - smoothstep(0.08, 0.22, dirY));

  const skyR = lerp(HORIZON_SKY[0], ZENITH_SKY[0], skyMix);
  const skyG = lerp(HORIZON_SKY[1], ZENITH_SKY[1], skyMix);
  const skyB = lerp(HORIZON_SKY[2], ZENITH_SKY[2], skyMix);
  const baseR = lerp(GROUND_SKY[0], skyR, groundBlend);
  const baseG = lerp(GROUND_SKY[1], skyG, groundBlend);
  const baseB = lerp(GROUND_SKY[2], skyB, groundBlend);

  return [
    lerp(baseR, HORIZON_GLOW[0], horizonGlow * 0.7),
    lerp(baseG, HORIZON_GLOW[1], horizonGlow * 0.7),
    lerp(baseB, HORIZON_GLOW[2], horizonGlow * 0.7),
  ] as const;
};

const createSkyboxTexture = (scene: Scene) => {
  const faces: Uint8Array[] = [];

  for (let face = 0; face < 6; face += 1) {
    const data = new Uint8Array(SKYBOX_TEXTURE_SIZE * SKYBOX_TEXTURE_SIZE * 4);

    for (let py = 0; py < SKYBOX_TEXTURE_SIZE; py += 1) {
      for (let px = 0; px < SKYBOX_TEXTURE_SIZE; px += 1) {
        const u = ((px + 0.5) / SKYBOX_TEXTURE_SIZE) * 2 - 1;
        const v = ((py + 0.5) / SKYBOX_TEXTURE_SIZE) * 2 - 1;
        const [dx, dy, dz] = getCubeDirection(face, u, v);
        const [r, g, b] = sampleSkyboxColour(dx, dy, dz);
        const offset = (py * SKYBOX_TEXTURE_SIZE + px) * 4;

        data[offset] = Math.round(Math.max(0, Math.min(1, r)) * 255);
        data[offset + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
        data[offset + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
        data[offset + 3] = 255;
      }
    }

    faces.push(data);
  }

  return new RawCubeTexture(
    scene,
    faces,
    SKYBOX_TEXTURE_SIZE,
    undefined,
    undefined,
    true,
  );
};

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
  document.getElementById("loader")?.remove();

  const blockSize = engine.currentLimits.maxComputeWorkgroupSizeX;
  setupIncludes(blockSize);
  const maxBlocks = engine.currentLimits.maxComputeWorkgroupsPerDimension;
  const boidLimit = (blockSize * maxBlocks) / 4;
  boidSlider.max = Math.ceil(Math.log2(boidLimit)).toString();

  let scene: Scene;
  let spaceBounds: number;
  let camera: UniversalCamera;

  const {
    generateBoidsComputeShader,
    boidComputeShader,
    buildRenderBuffersComputeShader,
    clearGridComputeShader,
    updateGridComputeShader,
    prefixSumComputeShader,
    sumBucketsComputeShader,
    addSumsComputeShader,
    rearrangeBoidsComputeShader,
  } = createComputeShaders3d(engine);

  let boidsComputeBuffer: StorageBuffer;
  let boidsComputeBuffer2: StorageBuffer;
  let gridBuffer: StorageBuffer;
  let gridOffsetsBuffer: StorageBuffer;
  let gridOffsetsBuffer2: StorageBuffer;
  let gridSumsBuffer: StorageBuffer;
  let gridSumsBuffer2: StorageBuffer;
  let templatePositionsBuffer: StorageBuffer;
  let templateNormalsBuffer: StorageBuffer;
  let renderPositionsBuffer: StorageBuffer;
  let renderNormalsBuffer: StorageBuffer;
  let gridTotalCells: number;
  let blocks: number;
  let renderVertexCount: number;
  let boidMesh: Mesh;

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
  params.addUniform("verticesPerBoid", 1);

  const setup = () => {
    boidText.innerHTML = `Boids: ${numBoids}`;
    scene = new Scene(engine);
    scene.clearColor = new Color4(
      ZENITH_SKY[0],
      ZENITH_SKY[1],
      ZENITH_SKY[2],
      1,
    );
    camera = new UniversalCamera("camera1", new Vector3(0, 0, -5), scene);
    camera.minZ = 0.3;
    camera.fov = Math.PI / 3;
    camera.speed = 0.3;
    camera.keysLeft = [65];
    camera.keysRight = [68];
    camera.keysUp = [87];
    camera.keysDown = [83];
    camera.keysUpward = [69];
    camera.keysDownward = [81];
    camera.attachControl();
    spaceBounds = Math.max(1, Math.pow(numBoids, 1 / 3) / 7.5 + edgeMargin);
    camera.position.set(0, 0, -spaceBounds * 3.8);

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

    // Scene lighting and shadow receiver
    const sun = new DirectionalLight(
      "sun",
      new Vector3(-0.3213937660622072, -0.7660444011712928, 0.5566704252156701),
      scene,
    );
    sun.position = new Vector3(-5.4498076, 8.44, -21.35);
    sun.diffuse = new Color3(1, 0.95686275, 0.8392157);
    sun.specular = new Color3(1, 0.95686275, 0.8392157);
    sun.intensity = SUN_INTENSITY;
    sun.autoUpdateExtends = true;
    sun.autoCalcShadowZBounds = true;

    const fillLight = new HemisphericLight(
      "fillLight",
      new Vector3(0, 1, 0),
      scene,
    );
    fillLight.diffuse = new Color3(1, 1, 1);
    fillLight.groundColor = new Color3(0.047, 0.043, 0.035);
    fillLight.intensity = FILL_LIGHT_INTENSITY;

    const shadowGenerator = new ShadowGenerator(SHADOW_MAP_SIZE, sun);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.05;
    shadowGenerator.normalBias = 0.4;
    shadowGenerator.darkness = 0;

    const skybox = scene.createDefaultSkybox(
      createSkyboxTexture(scene),
      false,
      SKYBOX_SIZE,
      0,
      false,
    );
    if (skybox?.material) {
      skybox.material.disableDepthWrite = true;
    }

    const ground = MeshBuilder.CreateGround(
      "ground",
      {
        width: spaceBounds * 4,
        height: spaceBounds * 4,
      },
      scene,
    );
    ground.position.y = -spaceBounds - 1;
    ground.receiveShadows = true;

    const groundMaterial = new PBRMaterial("groundMat", scene);
    groundMaterial.albedoColor = Color3.White();
    groundMaterial.metallic = 0;
    groundMaterial.roughness = 0.5;
    ground.material = groundMaterial;

    // Create boid mesh
    const renderMesh = getRenderMeshData(triangleMesh);
    const verticesPerBoid = renderMesh.positions.length / 3;
    const totalVertices = verticesPerBoid * numBoids;
    renderVertexCount = totalVertices;
    templatePositionsBuffer = new StorageBuffer(
      engine,
      verticesPerBoid * 4 * 4,
    );
    templateNormalsBuffer = new StorageBuffer(engine, verticesPerBoid * 4 * 4);
    renderPositionsBuffer = new StorageBuffer(
      engine,
      totalVertices * 4 * 4,
      Constants.BUFFER_CREATIONFLAG_VERTEX |
        Constants.BUFFER_CREATIONFLAG_READWRITE,
    );
    renderNormalsBuffer = new StorageBuffer(
      engine,
      totalVertices * 4 * 4,
      Constants.BUFFER_CREATIONFLAG_VERTEX |
        Constants.BUFFER_CREATIONFLAG_READWRITE,
    );
    templatePositionsBuffer.update(packVec4Data(renderMesh.positions));
    templateNormalsBuffer.update(packVec4Data(renderMesh.normals));

    boidMesh = new Mesh("boids", scene);
    boidMesh.isUnIndexed = true;
    boidMesh.setVerticesBuffer(
      new VertexBuffer(
        engine,
        renderPositionsBuffer.getBuffer(),
        VertexBuffer.PositionKind,
        {
          offset: 0,
          size: 3,
          stride: 4,
          takeBufferOwnership: false,
        },
      ),
      false,
      totalVertices,
    );
    boidMesh.setVerticesBuffer(
      new VertexBuffer(
        engine,
        renderNormalsBuffer.getBuffer(),
        VertexBuffer.NormalKind,
        {
          offset: 0,
          size: 3,
          stride: 4,
          takeBufferOwnership: false,
        },
      ),
      false,
    );
    boidMesh.receiveShadows = true;

    const boidMaterial = new PBRMaterial("boidMat", scene);
    boidMaterial.albedoColor = new Color3(1, 0.02, 0);
    boidMaterial.metallic = 0;
    boidMaterial.roughness = 0.5;
    boidMesh.material = boidMaterial;
    shadowGenerator.addShadowCaster(boidMesh);

    boidMesh.buildBoundingInfo(
      new Vector3(
        -xBound - BOID_SCALE,
        -yBound - BOID_SCALE,
        -zBound - BOID_SCALE,
      ),
      new Vector3(
        xBound + BOID_SCALE,
        yBound + BOID_SCALE,
        zBound + BOID_SCALE,
      ),
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
    params.updateUInt("verticesPerBoid", verticesPerBoid);

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
      gridOffsetsBuffer2,
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
      gridOffsetsBuffer2,
    );
    rearrangeBoidsComputeShader.setStorageBuffer("boidsIn", boidsComputeBuffer);
    rearrangeBoidsComputeShader.setStorageBuffer(
      "boidsOut",
      boidsComputeBuffer2,
    );

    boidComputeShader.setUniformBuffer("params", params);
    boidComputeShader.setStorageBuffer("boidsIn", boidsComputeBuffer2);
    boidComputeShader.setStorageBuffer("boids", boidsComputeBuffer);
    boidComputeShader.setStorageBuffer("gridOffsets", gridOffsetsBuffer2);

    buildRenderBuffersComputeShader.setUniformBuffer("params", params);
    buildRenderBuffersComputeShader.setStorageBuffer(
      "boids",
      boidsComputeBuffer,
    );
    buildRenderBuffersComputeShader.setStorageBuffer(
      "templatePositions",
      templatePositionsBuffer,
    );
    buildRenderBuffersComputeShader.setStorageBuffer(
      "templateNormals",
      templateNormalsBuffer,
    );
    buildRenderBuffersComputeShader.setStorageBuffer(
      "renderPositions",
      renderPositionsBuffer,
    );
    buildRenderBuffersComputeShader.setStorageBuffer(
      "renderNormals",
      renderNormalsBuffer,
    );

    // Generate boids on GPU
    generateBoidsComputeShader.setUniformBuffer("params", params);
    generateBoidsComputeShader.setStorageBuffer("boids", boidsComputeBuffer);
    generateBoidsComputeShader.dispatchWhenReady(
      Math.ceil(numBoids / blockSize),
      1,
      1,
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
    templatePositionsBuffer.dispose();
    templateNormalsBuffer.dispose();
    renderPositionsBuffer.dispose();
    renderNormalsBuffer.dispose();
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

  engine.runRenderLoop(() => {
    const fps = engine.getFps();
    fpsText.innerHTML = `FPS: ${fps.toFixed(2)}`;

    params.updateFloat("dt", engine.getDeltaTime() / 1000);
    params.update();

    clearGridComputeShader.dispatch(blocks, 1, 1);
    updateGridComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);

    prefixSumComputeShader.dispatch(blocks, 1, 1);

    let swap = false;
    for (let d = 1; d < blocks; d *= 2) {
      sumBucketsComputeShader.setStorageBuffer(
        "gridSumsIn",
        swap ? gridSumsBuffer2 : gridSumsBuffer,
      );
      sumBucketsComputeShader.setStorageBuffer(
        "gridSumsOut",
        swap ? gridSumsBuffer : gridSumsBuffer2,
      );

      params.updateUInt("divider", d);
      params.update();
      sumBucketsComputeShader.dispatch(Math.ceil(blocks / blockSize), 1, 1);
      swap = !swap;
    }

    addSumsComputeShader.setStorageBuffer(
      "gridSumsIn",
      swap ? gridSumsBuffer2 : gridSumsBuffer,
    );
    addSumsComputeShader.dispatch(blocks, 1, 1);
    rearrangeBoidsComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);
    boidComputeShader.dispatch(Math.ceil(numBoids / blockSize), 1, 1);
    buildRenderBuffersComputeShader.dispatch(
      Math.ceil(renderVertexCount / blockSize),
      1,
      1,
    );
    scene.render();
  });

  return engine;
};
