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
      gridInverseCellSize : f32,
      gridTotalCells : u32,
      divider: u32,
      rngSeed: u32,
      blocks: u32,
      avoidMouse: u32,
      zoom: f32,
      mousePos: vec2<f32>,
      renderWidth: u32,
      renderHeight: u32,
      viewportHalfSize: vec2<f32>,
      cameraPos: vec2<f32>,
    };

    struct Boid {
      pos : vec2<f32>,
      vel : vec2<f32>,
    };

    // Shared so every kernel that bins a boid gets the exact same cell
    fn getGridID(pos: vec2<f32>) -> u32 {
      let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);
      let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);
      return params.gridDimX * u32(y) + u32(x);
    }
  `;

  ShaderStore.IncludesShadersStoreWGSL["boid3dInclude"] = `
    const blockSize: u32 = ${blockSize};

    struct Params {
      numBoids: u32,
      xBound : f32,
      yBound : f32,
      zBound : f32,
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
      gridDimZ : u32,
      gridInverseCellSize : f32,
      gridTotalCells : u32,
      divider: u32,
      rngSeed: u32,
      blocks: u32,
      verticesPerBoid: u32,
      lightDir: vec3<f32>,
    };

    struct Boid3d {
      pos : vec3<f32>,
      vel : vec3<f32>,
    };

    // vec3s are 16 byte aligned in storage, so boids are stored as 3 vec2s
    // (24 bytes instead of 32) and unpacked into Boid3d
    struct PackedBoid3d {
      posXY : vec2<f32>,
      posZVelX : vec2<f32>,
      velYZ : vec2<f32>,
    };

    fn unpackBoid(boid: PackedBoid3d) -> Boid3d {
      return Boid3d(
        vec3<f32>(boid.posXY, boid.posZVelX.x),
        vec3<f32>(boid.posZVelX.y, boid.velYZ),
      );
    }

    fn packBoid(boid: Boid3d) -> PackedBoid3d {
      return PackedBoid3d(boid.pos.xy, vec2<f32>(boid.pos.z, boid.vel.x), boid.vel.yz);
    }

    // Shared so every kernel that bins a boid gets the exact same cell
    fn getGridID(pos: vec3<f32>) -> u32 {
      let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);
      let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);
      let z = i32(floor(pos.z * params.gridInverseCellSize)) + i32(params.gridDimZ / 2u);
      return params.gridDimX * params.gridDimY * u32(z) + params.gridDimX * u32(y) + u32(x);
    }
  `;
};
