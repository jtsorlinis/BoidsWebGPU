import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";

ShaderStore.IncludesShadersStoreWGSL["boidInclude"] = `
struct Params {
  numBoids: u32,
  xBound : f32,
  yBound : f32,
  maxSpeed : f32,
  minSpeed : f32,
  turnSpeed: f32,
  visualRange : f32,
  minDistance : f32,
  cohesionFactor : f32,
  alignmentFactor : f32,
  separationFactor : f32,
  dt : f32,
  gridDimX : u32,
  gridDimY : u32,
  gridCellSize : f32,
  gridTotalCells : u32,
  divider: u32,
};

struct Boid {
  pos : vec2<f32>,
  vel : vec2<f32>,
};
`;
