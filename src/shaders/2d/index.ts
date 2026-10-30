import { NodeMaterial, type StorageBufferAttribute } from "three/webgpu";
import {
  Fn,
  screenCoordinate,
  select,
  storage,
  uint,
  unpackUnorm4x8,
  uvec2,
  vec4,
} from "three/tsl";
import { ComputeShader } from "../../gpu";
import boids from "./compute/boids.wgsl?raw";
import generateBoids from "./compute/generateBoids.wgsl?raw";
import rearrangeBoids from "./compute/rearrangeBoids.wgsl?raw";

// include is boidInclude2d, for Params and the shared helpers
export const createComputeShaders2d = async (
  device: GPUDevice,
  include: string,
) => {
  const [generateBoidsShader, rearrangeBoidsShader, boidsShader] =
    await Promise.all([
      ComputeShader.create(
        device,
        "generateBoids",
        `${generateBoids}\n${include}`,
        ["params", "boids", "gridOffsets", "grid"],
      ),
      ComputeShader.create(
        device,
        "rearrangeBoids",
        `${rearrangeBoids}\n${include}`,
        ["params", "grid", "gridOffsets", "boids", "sortedIndices", "raster"],
      ),
      ComputeShader.create(device, "boids", `${boids}\n${include}`, [
        "params",
        "boidsIn",
        "boidsOut",
        "sortedIndices",
        "gridOffsets",
        "gridOffsetsIn",
        "grid",
      ]),
    ]);

  return { generateBoidsShader, rearrangeBoidsShader, boidsShader };
};

// Shows the raster rearrangeBoids draws into, one pixel per screen pixel. Pixels
// no boid covered are still 0, and show the background.
export const createRasterMaterial = (
  raster: StorageBufferAttribute,
  width: number,
  height: number,
  background: readonly [number, number, number],
) => {
  const pixels = storage(raster, "uint", width * height).toReadOnly();
  const material = new NodeMaterial();
  material.fragmentNode = Fn(() => {
    // The raster's rows go from the bottom of the screen up
    const pixel = uvec2(screenCoordinate);
    const row = uint(height - 1).sub(pixel.y);
    const packed = pixels.element(row.mul(width).add(pixel.x));
    return select(
      packed.equal(uint(0)),
      vec4(...background, 1),
      unpackUnorm4x8(packed),
    );
  })();
  return material;
};
