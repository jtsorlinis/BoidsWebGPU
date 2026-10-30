# 2D/3D Boids Flocking Simulation (three.js/WebGPU)

**See it here: https://jtsorlinis.github.io/BoidsWebGPU/**

---

Boids simulation made with three.js and WebGPU, running on a compute shader this allows the simulation of millions of boids. It's a port of [BoidsUnity](https://github.com/jtsorlinis/BoidsUnity)'s GPU mode.

The simulation uses a uniform spatial grid as an acceleration structure to determine nearest neighbours, as brute force method would cap out at around 50k entities even on GPU.

Method used is inspired by this presentation: https://on-demand.gputechconf.com/gtc/2014/presentations/S4117-fast-fixed-radius-nearest-neighbor-gpu.pdf
