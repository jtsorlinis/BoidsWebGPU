import {
  ComputeShader,
  Scene,
  ShaderLanguage,
  ShaderMaterial,
  ThinEngine,
} from "@babylonjs/core";
import boidVertex from "./boidVertex.wgsl?raw";
import boidFragment from "./boidFragment.wgsl?raw";
import addSums from "./compute/addSums.wgsl?raw";
import clearGrid from "./compute/clearGrid.wgsl?raw";
import boids from "./compute/boids.wgsl?raw";
import generateBoids from "./compute/generateBoids.wgsl?raw";
import prefixSum from "./compute/prefixSum.wgsl?raw";
import rearrangeBoids from "./compute/rearrangeBoids.wgsl?raw";
import sumBuckets from "./compute/sumBuckets.wgsl?raw";
import updateGrid from "./compute/updateGrid.wgsl?raw";

export const createBoidMaterial = (scene: Scene) => {
  return new ShaderMaterial(
    "boidMat",
    scene,
    {
      vertexSource: boidVertex,
      fragmentSource: boidFragment,
    },
    {
      uniformBuffers: ["Scene"],
      storageBuffers: ["boids", "boidVertices"],
      shaderLanguage: ShaderLanguage.WGSL,
    }
  );
};

export const createComputeShaders = (engine: ThinEngine) => {
  const generateBoidsComputeShader = new ComputeShader(
    "generateBoids",
    engine,
    { computeSource: generateBoids },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        boids: { group: 0, binding: 1 },
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
      },
    }
  );

  const clearGridComputeShader = new ComputeShader(
    "clearGrid",
    engine,
    { computeSource: clearGrid },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridOffsets: { group: 0, binding: 1 },
      },
    }
  );

  const updateGridComputeShader = new ComputeShader(
    "updateGrid",
    engine,
    { computeSource: updateGrid },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        grid: { group: 0, binding: 1 },
        gridOffsets: { group: 0, binding: 2 },
        boids: { group: 0, binding: 3 },
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

  const sumBucketsComputeShader = new ComputeShader(
    "sumBuckets",
    engine,
    { computeSource: sumBuckets },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridSumOfSums: { group: 0, binding: 1 },
      },
    }
  );

  const addSumsComputeShader = new ComputeShader(
    "addSums",
    engine,
    { computeSource: addSums },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridSumsIn: { group: 0, binding: 1 },
        gridOffsetsOut: { group: 0, binding: 2 },
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
      },
    }
  );

  return {
    generateBoidsComputeShader,
    boidComputeShader,
    clearGridComputeShader,
    updateGridComputeShader,
    prefixSumComputeShader,
    sumBucketsComputeShader,
    addSumsComputeShader,
    rearrangeBoidsComputeShader,
  };
};
