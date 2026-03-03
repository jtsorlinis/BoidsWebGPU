declare module "three/webgpu" {
  export * from "three";

  export const WebGPURenderer: any;
  export const MeshBasicNodeMaterial: any;
  export const MeshPhongNodeMaterial: any;
}

declare module "three/tsl" {
  export const Fn: any;
  export const If: any;
  export const Loop: any;
  export const abs: any;
  export const atan: any;
  export const atomicAdd: any;
  export const attribute: any;
  export const clamp: any;
  export const cos: any;
  export const cross: any;
  export const distance: any;
  export const dot: any;
  export const mix: any;
  export const float: any;
  export const floor: any;
  export const instanceIndex: any;
  export const invocationLocalIndex: any;
  export const instancedArray: any;
  export const length: any;
  export const max: any;
  export const normalLocal: any;
  export const normalize: any;
  export const pow: any;
  export const positionLocal: any;
  export const sign: any;
  export const sin: any;
  export const storage: any;
  export const sqrt: any;
  export const step: any;
  export const uniform: any;
  export const uint: any;
  export const vec2: any;
  export const vec3: any;
  export const workgroupArray: any;
  export const workgroupBarrier: any;
  export const workgroupId: any;
}
