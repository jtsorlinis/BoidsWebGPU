import "./style.css";
import { boids2d } from "./main2d";
import { boids3d } from "./main3d";
import { WebGPUEngine } from "@babylonjs/core";

let is3D = false;
let engine: WebGPUEngine | null;
const optionsUI = document.getElementById("options") as HTMLElement;
const modeRadio2D = document.getElementById("radio2D") as HTMLInputElement;
const modeRadio3D = document.getElementById("radio3D") as HTMLInputElement;
const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;

modeRadio2D.onchange = () => {
  is3D = false;
  startScene();
};
modeRadio3D.onchange = () => {
  is3D = true;
  startScene();
};

const startScene = async () => {
  optionsUI.style.display = is3D ? "none" : "block";
  engine?.dispose();
  engine = null;

  boidSlider.valueAsNumber = 5;
  if (is3D) {
    engine = await boids3d();
  } else {
    engine = await boids2d();
  }
};

startScene();
