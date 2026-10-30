import { StorageBufferAttribute, WebGPURenderer } from "three/webgpu";

// The compute passes share three.js's device so both can use the same buffers.
// Millions of boids need the adapter's maximum buffer sizes.
export const initRenderer = async (canvas: HTMLCanvasElement) => {
  const adapter = await navigator.gpu?.requestAdapter({
    powerPreference: "high-performance",
  });
  if (!adapter) {
    return null;
  }
  const requiredLimits: Record<string, number> = {};
  for (const name in adapter.limits) {
    if (name === "minSubgroupSize" || name === "maxSubgroupSize") {
      // Chrome exposes these limits in "webgpu developer" mode, but they can't be set on the device.
      continue;
    }
    requiredLimits[name] = adapter.limits[name as keyof GPUSupportedLimits];
  }
  const device = await adapter.requestDevice({
    requiredFeatures: [...adapter.features] as GPUFeatureName[],
    requiredLimits,
  });

  const renderer = new WebGPURenderer({ canvas, device });
  await renderer.init();
  return { device, renderer };
};

export type GPUContext = NonNullable<Awaited<ReturnType<typeof initRenderer>>>;

// A WGSL compute shader run directly on the device three.js renders with.
// Bindings are all in group 0, numbered in the order their names are given.
export class ComputeShader {
  private readonly device: GPUDevice;
  private readonly pipeline: GPUComputePipeline;
  private readonly bindings: readonly string[];

  private constructor(
    device: GPUDevice,
    pipeline: GPUComputePipeline,
    bindings: readonly string[],
  ) {
    this.device = device;
    this.pipeline = pipeline;
    this.bindings = bindings;
  }

  // Shared code (Params, helpers) goes after the kernel: WGSL declarations can come in
  // any order, and compile errors then point at the kernel's own lines
  static async create(
    device: GPUDevice,
    label: string,
    code: string,
    bindings: readonly string[],
  ) {
    const module = device.createShaderModule({ label, code });
    const pipeline = await device.createComputePipelineAsync({
      label,
      layout: "auto",
      compute: { module },
    });
    return new ComputeShader(device, pipeline, bindings);
  }

  createBindGroup(buffers: Record<string, GPUBuffer>) {
    return this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: this.bindings.map((name, binding) => ({
        binding,
        resource: { buffer: buffers[name] },
      })),
    });
  }

  dispatch(
    pass: GPUComputePassEncoder,
    bindGroup: GPUBindGroup,
    groupsX: number,
    groupsY = 1,
  ) {
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, bindGroup);
    pass.dispatchWorkgroups(groupsX, groupsY);
  }
}

// New buffers are zeroed
export const createStorageBuffer = (device: GPUDevice, size: number) =>
  device.createBuffer({
    size: Math.max(4, size),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });

// Lets three.js read one of the simulation's buffers in place, rather than
// uploading a copy of its own. three.js only creates a buffer for an attribute that has none.
export const shareWithRenderer = (
  renderer: WebGPURenderer,
  buffer: GPUBuffer,
  itemSize: number,
) => {
  const attribute = new StorageBufferAttribute(1, itemSize);
  const backend = renderer.backend as unknown as {
    get(object: object): { buffer?: GPUBuffer };
  };
  backend.get(attribute).buffer = buffer;
  return attribute;
};

export type ParamType = "u32" | "f32" | "vec2<f32>";

const paramSizes: Record<ParamType, number> = {
  u32: 4,
  f32: 4,
  "vec2<f32>": 8,
};

// A uniform block laid out with WGSL's uniform rules. The shaders get their Params
// struct from here too, so the two layouts can't drift apart.
export class Params<Name extends string> {
  readonly buffer: GPUBuffer;
  readonly wgsl: string;
  private readonly device: GPUDevice;
  private readonly data: DataView;
  private readonly fields = new Map<
    string,
    { offset: number; type: ParamType }
  >();

  constructor(device: GPUDevice, layout: Record<Name, ParamType>) {
    let offset = 0;
    const members: string[] = [];
    for (const [name, type] of Object.entries(layout) as [Name, ParamType][]) {
      // Each member is aligned to its own size
      const size = paramSizes[type];
      offset = Math.ceil(offset / size) * size;
      this.fields.set(name, { offset, type });
      members.push(`  ${name}: ${type},`);
      offset += size;
    }

    this.device = device;
    this.data = new DataView(new ArrayBuffer(Math.ceil(offset / 16) * 16));
    this.buffer = device.createBuffer({
      size: this.data.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.wgsl = `struct Params {\n${members.join("\n")}\n};\n`;
  }

  set(name: Name, value: number | readonly [number, number]) {
    const { offset, type } = this.fields.get(name)!;
    if (type === "u32") {
      this.data.setUint32(offset, value as number, true);
    } else if (type === "f32") {
      this.data.setFloat32(offset, value as number, true);
    } else {
      const [x, y] = value as readonly [number, number];
      this.data.setFloat32(offset, x, true);
      this.data.setFloat32(offset + 4, y, true);
    }
  }

  update() {
    this.device.queue.writeBuffer(this.buffer, 0, this.data);
  }

  dispose() {
    this.buffer.destroy();
  }
}
