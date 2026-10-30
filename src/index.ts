import "./style.css";
import { initRenderer } from "./gpu";
import { createUI, initialBoids } from "./ui";

type Sim = Awaited<ReturnType<typeof import("./main2d").createSim>>;

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const loader = document.getElementById("loader") as HTMLElement;

const gpu = await initRenderer(canvas);
if (!gpu) {
  loader.textContent =
    "WebGPU is not supported on this browser, please update to the latest version of Chrome";
  throw new Error("WebGPU is not supported");
}
const { renderer } = gpu;

const ui = createUI();
let sim: Sim | null = null;
let starting = 0;

const startSim = async (is3D: boolean) => {
  const start = ++starting;
  sim?.dispose();
  sim = null;
  ui.setView(is3D, initialBoids);

  const { createSim } = is3D
    ? await import("./main3d")
    : await import("./main2d");
  const next = await createSim(gpu, canvas, initialBoids);
  // Switched view again while this one was compiling
  if (start !== starting) {
    next.dispose();
    return;
  }
  sim = next;
  ui.setLimit(sim.boidLimit);
  loader.remove();
};

ui.on.viewChanged = startSim;
ui.on.numBoidsChanged = (count) => sim?.setNumBoids(count);
ui.on.avoidMouseChanged = (avoid) => sim?.setAvoidMouse(avoid);

const resize = () => {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
  }
};
resize();
await startSim(false);

let lastTime: number | undefined;
renderer.setAnimationLoop((time) => {
  const deltaTime = lastTime === undefined ? 0 : (time - lastTime) / 1000;
  lastTime = time;
  ui.frame(deltaTime);

  resize();
  sim?.frame(Math.min(deltaTime, 1 / 3));
});
