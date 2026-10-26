import "@babylonjs/core/Engines/WebGPU/Extensions/engine.computeShader";
import { ComputeShader } from "@babylonjs/core/Compute/computeShader";
import type { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import clearRaster from "./compute/clearRaster.wgsl?raw";
import boids from "./compute/boids.wgsl?raw";
import generateBoids from "./compute/generateBoids.wgsl?raw";
import prefixSum from "./compute/prefixSum.wgsl?raw";
import rearrangeBoids from "./compute/rearrangeBoids.wgsl?raw";
import scanSums from "./compute/scanSums.wgsl?raw";
import sumBlocks from "./compute/sumBlocks.wgsl?raw";

export const createComputeShaders = (engine: WebGPUEngine) => {
  const clearRasterComputeShader = new ComputeShader(
    "clearRaster",
    engine,
    { computeSource: clearRaster },
    {
      bindingsMapping: {
        renderTarget: { group: 0, binding: 0 },
        params: { group: 0, binding: 1 },
      },
    }
  );

  const generateBoidsComputeShader = new ComputeShader(
    "generateBoids",
    engine,
    { computeSource: generateBoids },
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
    { computeSource: boids },
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
    { computeSource: sumBlocks },
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
    { computeSource: scanSums },
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
    { computeSource: prefixSum },
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
    { computeSource: rearrangeBoids },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        grid: { group: 0, binding: 1 },
        gridOffsets: { group: 0, binding: 2 },
        boidsIn: { group: 0, binding: 3 },
        boidsOut: { group: 0, binding: 4 },
        renderTarget: { group: 0, binding: 5 },
      },
    }
  );

  return {
    clearRasterComputeShader,
    generateBoidsComputeShader,
    boidComputeShader,
    sumBlocksComputeShader,
    scanSumsComputeShader,
    prefixSumComputeShader,
    rearrangeBoidsComputeShader,
  };
};
