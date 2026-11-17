import {
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardNodeMaterial,
  type Node,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  SRGBColorSpace,
  Scene,
  Vector3,
} from "three/webgpu";
import {
  cameraPosition,
  mix,
  positionWorld,
  saturate,
  uniform,
  vec4,
} from "three/tsl";
import { CSMShadowNode } from "three/addons/csm/CSMShadowNode.js";
import { createCamera3D } from "./cameras";
import { createBoidCompute, edgeMargin, visualRange } from "./compute";
import { type GPUContext, shareWithRenderer } from "./gpu";
import {
  boidVertices,
  createBoidMaterial,
  kernels3d,
  skyNode,
} from "./shaders/3d";

const sunDirection = new Vector3(
  -0.3213937660622072,
  -0.7660444011712928,
  -0.5566704252156701,
);
const sunColour = new Color().setRGB(1, 0.95686275, 0.8392157, SRGBColorSpace);
const sunIntensity = Math.PI;
const ambientSky = new Color().setRGB(0.36, 0.45, 0.62, SRGBColorSpace);
const ambientGround = new Color().setRGB(0.3, 0.28, 0.26, SRGBColorSpace);
const ambientIntensity = Math.PI;
const shadowMapSize = 8192;

export const createSim = async (
  { device, renderer }: GPUContext,
  canvas: HTMLCanvasElement,
  initialBoids: number,
) => {
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const compute = await createBoidCompute(device, kernels3d, {
    zBound: "f32",
    gridDimZ: "u32",
  });

  const scene = new Scene();
  scene.backgroundNode = skyNode;

  const camera = new PerspectiveCamera(
    60,
    canvas.width / canvas.height,
    0.3,
    1000,
  );
  const abort = new AbortController();
  const controls = createCamera3D(camera, canvas, abort.signal);

  const sun = new DirectionalLight(sunColour, sunIntensity);
  sun.position.copy(sunDirection).negate();
  sun.castShadow = true;
  const mapSize = Math.min(shadowMapSize, device.limits.maxTextureDimension2D);
  sun.shadow.mapSize.set(mapSize, mapSize);
  sun.shadow.bias = -0.0001;
  sun.shadow.normalBias = 0.01;
  sun.shadow.radius = 2;
  const csm = new CSMShadowNode(sun, {
    cascades: 2,
    mode: "custom",
    customSplitsCallback: (_cascades, _near, _far, breaks) => {
      breaks.push(0.2, 1);
    },
  });
  const shadowFadeScale = uniform(0);
  const shadowFadeBias = uniform(0);
  const cameraToPixel = positionWorld.sub(cameraPosition);
  const shadowFade = saturate(
    cameraToPixel.dot(cameraToPixel).mul(shadowFadeScale).add(shadowFadeBias),
  );
  // CSMShadowNode is a vec4, its types just don't say so
  const csmShadow = csm as unknown as Node<"vec4">;
  sun.shadow.shadowNode = mix(csmShadow, vec4(1, 1, 1, 1), shadowFade);
  scene.add(sun, sun.target);
  scene.add(new HemisphereLight(ambientSky, ambientGround, ambientIntensity));

  const floorGeometry = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const floorMaterial = new MeshStandardNodeMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.receiveShadow = true;
  scene.add(floor);

  // No attributes, the boid material places every vertex. three warns that there's no
  // position attribute each time it builds the boid shaders, but draws the range given.
  const boidGeometry = new BufferGeometry();
  const boidMesh = new Mesh(boidGeometry);
  boidMesh.frustumCulled = false;
  boidMesh.castShadow = true;
  boidMesh.receiveShadow = true;
  // The shadow maps are only sampled for depth, so skip writing their colour target
  boidMesh.onBeforeShadow = (
    _renderer,
    _object,
    _camera,
    _shadowCamera,
    _geometry,
    depthMaterial,
  ) => {
    depthMaterial.colorWrite = false;
  };
  scene.add(boidMesh);

  let numBoids = initialBoids;
  let pendingNumBoids = 0;
  let viewWidth = 0;
  let viewHeight = 0;

  // One of each for each boid buffer, the boids are drawn from whichever was just written
  let triangleMaterials: MeshStandardNodeMaterial[] = [];
  let birdMaterials: MeshStandardNodeMaterial[] = [];
  // On to begin with, like the card's switch
  let birds = true;

  // Draws the boids just written, as the shape picked
  const showBoids = () => {
    boidMesh.material = (birds ? birdMaterials : triangleMaterials)[compute.current];
    boidGeometry.setDrawRange(0, numBoids * boidVertices(birds));
  };

  const disposeMaterials = () => {
    for (const material of [...triangleMaterials, ...birdMaterials]) {
      material.dispose();
    }
  };

  const updateShadows = (spaceBounds: number) => {
    const shadowDistance = spaceBounds * 6.5;
    csm.maxFar = shadowDistance;
    // Far enough back towards the sun to catch every boid between it and the view
    csm.lightMargin = spaceBounds * 4;
    const far = csm.lightMargin + shadowDistance * 2;
    for (const { shadow } of [sun, ...csm.lights]) {
      shadow!.camera.far = far;
      shadow!.camera.updateProjectionMatrix();
    }

    const fadeNearSq = (0.95 * shadowDistance) ** 2;
    shadowFadeScale.value = 1 / (shadowDistance ** 2 - fadeNearSq);
    shadowFadeBias.value = -fadeNearSq * shadowFadeScale.value;

    // The cascades are made on the first render, after that they need updating
    if (csm.camera) {
      csm.updateFrustums();
    }
  };

  const setup = () => {
    const spaceBounds = Math.max(
      1,
      Math.pow(numBoids, 1 / 3) / 7.5 + edgeMargin,
    );
    controls.resetView(spaceBounds * 3.8);
    floor.scale.set(spaceBounds * 4, 1, spaceBounds * 4);
    floor.position.y = -spaceBounds - 1;
    updateShadows(spaceBounds);

    const xBound = 2 * spaceBounds - edgeMargin;
    const yBound = spaceBounds - edgeMargin;
    const zBound = 2 * spaceBounds - edgeMargin;

    // Spatial grid setup, GPU cells are half as wide in x
    const gridDimX = (Math.floor((xBound * 2) / visualRange) + 20) * 2;
    const gridDimY = Math.floor((yBound * 2) / visualRange) + 20;
    const gridDimZ = Math.floor((zBound * 2) / visualRange) + 20;

    disposeMaterials();
    compute.setup(numBoids, gridDimX * gridDimY * gridDimZ, {
      xBound,
      yBound,
      zBound,
      gridDimX,
      gridDimY,
      gridDimZ,
    });

    // Only the shape that's drawn gets its shaders built
    const buffers = compute.boidBuffers.map((boids) =>
      shareWithRenderer(renderer, boids, 1),
    );
    triangleMaterials = buffers.map((boids) =>
      createBoidMaterial(boids, numBoids, false),
    );
    birdMaterials = buffers.map((boids) =>
      createBoidMaterial(boids, numBoids, true),
    );
    showBoids();
  };

  setup();

  const frame = (deltaTime: number) => {
    // Restart here rather than from the slider, so it happens at most once a frame
    if (pendingNumBoids > 0) {
      numBoids = pendingNumBoids;
      pendingNumBoids = 0;
      setup();
    }

    if (canvas.width !== viewWidth || canvas.height !== viewHeight) {
      viewWidth = canvas.width;
      viewHeight = canvas.height;
      camera.aspect = viewWidth / viewHeight;
      camera.updateProjectionMatrix();
      if (csm.camera) {
        csm.updateFrustums();
      }
    }
    controls.update(deltaTime);

    const encoder = device.createCommandEncoder();
    compute.encode(encoder, deltaTime);
    device.queue.submit([encoder.finish()]);

    showBoids();
    renderer.render(scene, camera);
  };

  return {
    boidLimit: compute.boidLimit,
    frame,
    setNumBoids: (count: number) => {
      pendingNumBoids = Math.min(count, compute.boidLimit);
    },
    setBirds: (enabled: boolean) => {
      birds = enabled;
    },
    dispose: () => {
      abort.abort();
      disposeMaterials();
      compute.dispose();
      csm.dispose();
      sun.shadow.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      boidGeometry.dispose();
    },
  };
};
