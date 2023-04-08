# Boids flocking with WebGPU

Boids simulation made with babylon.js and WebGPU, running on a compute shader this allows the simulation of millions of boids.

The simulation uses a spatial hash grid to optimise each Boid's nearest neighbours checks, to avoid looping over every single boid each time (O(N^2)).

See it here: https://jtsorlinis.github.io/BoidsWebGPU/
