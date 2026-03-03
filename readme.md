# 2D/3D Boids Flocking Simulation (Three.js/WebGPU + TSL)

**See it here: https://jtsorlinis.github.io/BoidsWebGPU/**

---

Boids simulation built with `three.js` WebGPU renderer, TSL node materials, and TSL compute shaders.

The flocking update runs fully on GPU each frame using a uniform grid acceleration structure, prefix sums, and boid rearrangement (compute pass + render pass).

Method used is inspired by this presentation: https://on-demand.gputechconf.com/gtc/2014/presentations/S4117-fast-fixed-radius-nearest-neighbor-gpu.pdf

Notes:

- 2D mode supports mouse avoidance + panning/zooming.
- 3D mode supports orbit camera controls + simple/pyramid boid geometry toggle.
