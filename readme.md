# 2D/3D Boids Flocking Simulation (Babylon.js/WebGPU)

See it here: https://jtsorlinis.github.io/BoidsWebGPU/

Boids simulation made with babylon.js and WebGPU, running on a compute shader this allows the simulation of millions of boids.

The simulation uses a uniform spatial grid as an acceleration structure to determine nearest neighbours, as brute force method would cap out at around 50k entities even on GPU.

Method used is inspired by this presentation: https://on-demand.gputechconf.com/gtc/2014/presentations/S4117-fast-fixed-radius-nearest-neighbor-gpu.pdf

Number of boids before I drop below 60fps on my M1 Max:

- 2D: ~16 million
- 3D: ~4 million
