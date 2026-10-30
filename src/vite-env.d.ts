/// <reference types="vite/client" />

// TypeScript's DOM types cover WebGPU's interfaces, but not its flag constants
declare const GPUBufferUsage: {
  readonly COPY_DST: number;
  readonly UNIFORM: number;
  readonly STORAGE: number;
};
