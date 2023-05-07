import "./style.css";
import { boids2d } from "./main2d";
import { boids3d } from "./main3d";
import { WebGPUEngine } from "@babylonjs/core";

let is3D = true;
let engine: WebGPUEngine | null;
const optionsUI = document.getElementById("options") as HTMLElement;
const switchButton = document.getElementById(
  "switchButton"
) as HTMLButtonElement;
const boidSlider = document.getElementById("boidSlider") as HTMLInputElement;

switchButton.onclick = () => {
  is3D = !is3D;
  startScene();
};

const startScene = async () => {
  is3D ? (switchButton.innerText = "3D") : (switchButton.innerText = "2D");
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
