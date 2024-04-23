import {
  ComputeShader,
  Scene,
  ShaderLanguage,
  ShaderMaterial,
  WebGPUEngine,
} from "@babylonjs/core";
import boid3dVertex from "./boid3dVertex.wgsl?raw";
import boid3dFragment from "./boid3dFragment.wgsl?raw";
import addSums3d from "./compute/addSums3d.wgsl?raw";
import boids3d from "./compute/boids3d.wgsl?raw";
import clearGrid3d from "./compute/clearGrid3d.wgsl?raw";
import generateBoids3d from "./compute/generateBoids3d.wgsl?raw";
import prefixSum3d from "./compute/prefixSum3d.wgsl?raw";
import rearrangeBoids3d from "./compute/rearrangeBoids3d.wgsl?raw";
import sumBuckets3d from "./compute/sumBuckets3d.wgsl?raw";
import updateGrid3d from "./compute/updateGrid3d.wgsl?raw";

export const createBoid3dMaterial = (scene: Scene) => {
  return new ShaderMaterial(
    "boidMat",
    scene,
    {
      vertexSource: boid3dVertex,
      fragmentSource: boid3dFragment,
    },
    {
      uniformBuffers: ["Scene"],
      storageBuffers: ["boids", "boidVertices", "boidNormals"],
      shaderLanguage: ShaderLanguage.WGSL,
    }
  );
};

export const createComputeShaders3d = (engine: WebGPUEngine) => {
  const generateBoidsComputeShader = new ComputeShader(
    "generateBoids",
    engine,
    { computeSource: generateBoids3d },
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
    { computeSource: boids3d },
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
    { computeSource: clearGrid3d },
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
    { computeSource: updateGrid3d },
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

  const sumBucketsComputeShader = new ComputeShader(
    "sumBuckets",
    engine,
    { computeSource: sumBuckets3d },
    {
      bindingsMapping: {
        params: { group: 0, binding: 0 },
        gridSumsIn: { group: 0, binding: 1 },
        gridSumsOut: { group: 0, binding: 2 },
      },
    }
  );

  const addSumsComputeShader = new ComputeShader(
    "addSums",
    engine,
    { computeSource: addSums3d },
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
    { computeSource: rearrangeBoids3d },
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
