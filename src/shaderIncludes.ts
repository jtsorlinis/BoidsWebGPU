import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";

export const setupIncludes = (blockSize: number) => {
  ShaderStore.IncludesShadersStoreWGSL["boidInclude"] = `
    const blockSize: u32 = ${blockSize};

    struct Params {
      numBoids: u32,
      xBound : f32,
      yBound : f32,
      maxSpeed : f32,
      minSpeed : f32,
      turnSpeed: f32,
      visualRangeSq : f32,
      minDistanceSq : f32,
      cohesionFactor : f32,
      alignmentFactor : f32,
      separationFactor : f32,
      dt : f32,
      gridDimX : u32,
      gridDimY : u32,
      gridCellSize : f32,
      gridTotalCells : u32,
      divider: u32,
      rngSeed: u32,
      blocks: u32,
      avoidMouse: u32,
      zoom: f32,
      mousePos: vec2<f32>,
    };

    struct Boid {
      pos : vec2<f32>,
      vel : vec2<f32>,
    };
`;
};
