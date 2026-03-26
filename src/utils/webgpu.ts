const WEBGPU_REQUIRED_LIMIT_NAMES = [
  "maxBufferSize",
  "maxStorageBufferBindingSize",
  "maxComputeInvocationsPerWorkgroup",
  "maxComputeWorkgroupSizeX",
  "maxComputeWorkgroupSizeY",
  "maxComputeWorkgroupSizeZ",
  "maxComputeWorkgroupsPerDimension",
] as const;

export const requestWebGPUDeviceWithMaxLimits = async () => {
  if (!navigator.gpu) {
    throw new Error("WebGPU is not supported in this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();

  if (adapter === null) {
    throw new Error("Unable to create a WebGPU adapter.");
  }

  const requiredLimits = Object.fromEntries(
    WEBGPU_REQUIRED_LIMIT_NAMES.map((name) => [name, adapter.limits[name]]),
  );

  return adapter.requestDevice({
    requiredFeatures: Array.from(adapter.features.values()) as any,
    requiredLimits: requiredLimits as any,
  });
};

export const patchRendererForGpuOnlyStorage = (renderer: any) => {
  const backend = renderer.backend as {
    __gpuOnlyStoragePatched?: boolean;
    attributeUtils?: {
      _getBufferAttribute(attribute: any): any;
      createAttribute(attribute: any, usage: number): void;
      updateAttribute(attribute: any): void;
    };
    device?: {
      createBuffer(descriptor: {
        label?: string;
        mappedAtCreation?: boolean;
        size: number;
        usage: number;
      }): unknown;
    };
    get(key: object): Record<string, unknown>;
  } | null;

  if (
    backend === null ||
    backend === undefined ||
    backend.__gpuOnlyStoragePatched === true ||
    backend.attributeUtils === undefined ||
    backend.device === undefined
  ) {
    return;
  }

  const { attributeUtils } = backend;
  const originalCreateAttribute = attributeUtils.createAttribute.bind(
    attributeUtils,
  );
  const originalUpdateAttribute = attributeUtils.updateAttribute.bind(
    attributeUtils,
  );
  const device = backend.device;

  attributeUtils.createAttribute = (attribute: any, usage: number) => {
    const bufferAttribute = attributeUtils._getBufferAttribute(attribute);

    if (bufferAttribute?.isGpuOnlyStorageBufferAttribute !== true) {
      originalCreateAttribute(attribute, usage);
      return;
    }

    const bufferData = backend.get(bufferAttribute);

    if (bufferData.buffer !== undefined) {
      return;
    }

    const byteLength = bufferAttribute.gpuOnlyByteLength as number;
    const size = byteLength + ((4 - (byteLength % 4)) % 4);

    bufferData.buffer = device.createBuffer({
      label: bufferAttribute.name,
      size,
      usage,
    });
  };

  attributeUtils.updateAttribute = (attribute: any) => {
    const bufferAttribute = attributeUtils._getBufferAttribute(attribute);

    if (bufferAttribute?.isGpuOnlyStorageBufferAttribute === true) {
      return;
    }

    originalUpdateAttribute(attribute);
  };

  backend.__gpuOnlyStoragePatched = true;
};
