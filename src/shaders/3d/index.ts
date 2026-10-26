import "@babylonjs/core/Engines/WebGPU/Extensions/engine.computeShader";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import boids3d from "./compute/boids3d.wgsl?raw";
import generateBoids3d from "./compute/generateBoids3d.wgsl?raw";
import prefixSum3d from "./compute/prefixSum3d.wgsl?raw";
import rearrangeBoids3d from "./compute/rearrangeBoids3d.wgsl?raw";
import scanSums3d from "./compute/scanSums3d.wgsl?raw";
import sumBlocks3d from "./compute/sumBlocks3d.wgsl?raw";

export const createComputeShaders3d = (engine: WebGPUEngine) => {
  const generateBoidsComputeShader = new ComputeShader(
    "generateBoids",
    engine,
    { computeSource: generateBoids3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        boids: { group: 0, binding: 1 },
        gridOffsets: { group: 0, binding: 2 },
        grid: { group: 0, binding: 3 },
      },
    }
  );

  const boidComputeShader = new ComputeShader(
    "boids",
    engine,
    { computeSource: boids3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        boids: { group: 0, binding: 1 },
        boidsIn: { group: 0, binding: 2 },
        gridOffsets: { group: 0, binding: 3 },
        gridOffsetsIn: { group: 0, binding: 4 },
        grid: { group: 0, binding: 5 },
      },
    }
  );

  const sumBlocksComputeShader = new ComputeShader(
    "sumBlocks",
    engine,
    { computeSource: sumBlocks3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridOffsetsIn: { group: 0, binding: 1 },
        gridSums: { group: 0, binding: 2 },
      },
    }
  );

  const scanSumsComputeShader = new ComputeShader(
    "scanSums",
    engine,
    { computeSource: scanSums3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridSums: { group: 0, binding: 1 },
      },
    }
  );

  const prefixSumComputeShader = new ComputeShader(
    "prefixSum",
    engine,
    { computeSource: prefixSum3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridOffsetsIn: { group: 0, binding: 1 },
        gridOffsetsOut: { group: 0, binding: 2 },
        gridSums: { group: 0, binding: 3 },
      },
    }
  );

  const rearrangeBoidsComputeShader = new ComputeShader(
    "rearrangeBoids",
    engine,
    { computeSource: rearrangeBoids3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        grid: { group: 0, binding: 1 },
        gridOffsets: { group: 0, binding: 2 },
        boidsIn: { group: 0, binding: 3 },
        boidsOut: { group: 0, binding: 4 },
        templatePositions: { group: 0, binding: 5 },
        templateNormals: { group: 0, binding: 6 },
        renderPositions: { group: 0, binding: 7 },
        renderNormals: { group: 0, binding: 8 },
      },
    }
  );

  return {
    generateBoidsComputeShader,
    boidComputeShader,
    sumBlocksComputeShader,
    scanSumsComputeShader,
    prefixSumComputeShader,
    rearrangeBoidsComputeShader,
  };
};
