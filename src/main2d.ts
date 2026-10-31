import { LinearSRGBColorSpace, NodeMaterial, QuadMesh } from "three/webgpu";
import { createCamera2D } from "./cameras";
import { createBoidCompute, edgeMargin, visualRange } from "./compute";
import { type GPUContext, createStorageBuffer, shareWithRenderer } from "./gpu";
import { createRasterMaterial, kernels2d } from "./shaders/2d";

const backgroundColour = [0.19215687, 0.3019608, 0.4745098] as const;

export const createSim = async (
  { device, renderer }: GPUContext,
  canvas: HTMLCanvasElement,
  initialBoids: number,
) => {
  // The raster's colours go to the screen as they are
  renderer.outputColorSpace = LinearSRGBColorSpace;

  const compute = await createBoidCompute(device, kernels2d, {
    avoidMouse: "u32",
    zoom: "f32",
    mousePos: "vec2<f32>",
    renderWidth: "u32",
    renderHeight: "u32",
    viewportHalfSize: "vec2<f32>",
    cameraPos: "vec2<f32>",
  });
  const { params } = compute;

  const abort = new AbortController();
  const view = createCamera2D(canvas, abort.signal);

  // Where the pointer is on the canvas, in CSS pixels
  const pointer = { x: 0, y: 0 };
  canvas.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.offsetX;
      pointer.y = event.offsetY;
    },
    { signal: abort.signal },
  );

  let numBoids = initialBoids;
  let pendingNumBoids = 0;

  // Screen sized raster the boids are drawn into, shown by a fullscreen quad
  let quad: QuadMesh | null = null;
  let rasterBuffer: GPUBuffer | null = null;
  let rasterMaterial: NodeMaterial | null = null;
  let rasterWidth = 0;
  let rasterHeight = 0;

  const ensureRaster = () => {
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    if (width === rasterWidth && height === rasterHeight) {
      return;
    }

    rasterBuffer?.destroy();
    rasterMaterial?.dispose();
    rasterBuffer = createStorageBuffer(device, width * height * 4);
    rasterWidth = width;
    rasterHeight = height;
    rasterMaterial = createRasterMaterial(
      shareWithRenderer(renderer, rasterBuffer, 1),
      width,
      height,
      backgroundColour,
    );
    if (quad) {
      quad.material = rasterMaterial;
    } else {
      quad = new QuadMesh(rasterMaterial);
    }
    compute.setViewBuffers({ raster: rasterBuffer });
  };

  const setup = () => {
    // Zoom camera based on number of boids
    view.resetView(Math.max(2, Math.sqrt(numBoids) / 10 + edgeMargin));
    const aspect = rasterWidth / rasterHeight;
    const xBound = view.orthoSize * aspect - edgeMargin;
    const yBound = view.orthoSize - edgeMargin;

    // Spatial grid setup
    const gridDimX = Math.floor((xBound * 2) / visualRange) + 30;
    const gridDimY = Math.floor((yBound * 2) / visualRange) + 30;
    compute.setup(numBoids, gridDimX * gridDimY, {
      xBound,
      yBound,
      gridDimX,
      gridDimY,
    });
  };

  ensureRaster();
  setup();

  const frame = (deltaTime: number) => {
    // Restart here rather than from the slider, so it happens at most once a frame
    if (pendingNumBoids > 0) {
      numBoids = pendingNumBoids;
      pendingNumBoids = 0;
      setup();
    }

    ensureRaster();
    view.update(deltaTime);

    const aspect = rasterWidth / rasterHeight;
    const mouseX =
      (pointer.x / canvas.clientWidth - 0.5) * view.orthoSize * 2 * aspect + view.x;
    const mouseY =
      -(pointer.y / canvas.clientHeight - 0.5) * view.orthoSize * 2 + view.y;
    params.set("zoom", view.orthoSize / 3);
    params.set("mousePos", [mouseX, mouseY]);
    params.set("renderWidth", rasterWidth);
    params.set("renderHeight", rasterHeight);
    params.set("viewportHalfSize", [view.orthoSize * aspect, view.orthoSize]);
    params.set("cameraPos", [view.x, view.y]);

    const encoder = device.createCommandEncoder();
    // Cleared first, the boids kernel draws the boids
    encoder.clearBuffer(rasterBuffer!);
    compute.encode(encoder, deltaTime);
    device.queue.submit([encoder.finish()]);

    quad!.render(renderer);
  };

  return {
    boidLimit: compute.boidLimit,
    frame,
    setNumBoids: (count: number) => {
      pendingNumBoids = Math.min(count, compute.boidLimit);
    },
    setAvoidMouse: (avoid: boolean) => {
      params.set("avoidMouse", avoid ? 1 : 0);
    },
    dispose: () => {
      abort.abort();
      compute.dispose();
      rasterBuffer?.destroy();
      rasterMaterial?.dispose();
    },
  };
};
