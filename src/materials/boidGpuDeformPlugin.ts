import {
  BufferAttribute,
  BufferGeometry,
  InstancedMesh,
  MeshStandardNodeMaterial,
  type ColorRepresentation,
} from "three/webgpu";
import {
  Fn,
  HALF_PI,
  atan,
  attributeArray,
  instanceIndex,
  transformNormalToView,
  uint,
  vec3,
  vertexIndex,
} from "three/tsl";

type PackedMeshData = {
  normals: Float32Array;
  vertices: Float32Array;
};

type StorageNode = any;
const arrayNode = (count: any, type: any) => (attributeArray as any)(count, type) as any;

const unpackVec4ToVec3 = (source: Float32Array) => {
  const unpacked = new Float32Array((source.length / 4) * 3);

  for (let src = 0, dst = 0; src < source.length; src += 4, dst += 3) {
    unpacked[dst] = source[src];
    unpacked[dst + 1] = source[src + 1];
    unpacked[dst + 2] = source[src + 2];
  }

  return unpacked;
};

const createPlaceholderGeometry = (vertexCount: number) => {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(vertexCount * 3), 3)
  );
  geometry.setAttribute(
    "normal",
    new BufferAttribute(new Float32Array(vertexCount * 3), 3)
  );
  return geometry;
};

const rotateByVelocity = Fn(([value, velocity]: [any, any]) => {
  const pitch = atan(velocity.y, velocity.xz.length()).sub(HALF_PI);
  const pitched = vec3(
    value.x.mul(pitch.cos()).sub(value.y.mul(pitch.sin())),
    value.x.mul(pitch.sin()).add(value.y.mul(pitch.cos())),
    value.z
  );
  const yaw = atan(velocity.x, velocity.z).sub(HALF_PI);

  return vec3(
    pitched.x.mul(yaw.cos()).add(pitched.z.mul(yaw.sin())),
    pitched.y,
    pitched.z.mul(yaw.cos()).sub(pitched.x.mul(yaw.sin()))
  );
}).setLayout({
  inputs: [
    { name: "value", type: "vec3" },
    { name: "velocity", type: "vec3" },
  ],
  name: "rotateByVelocity",
  type: "vec3",
});

export const createBoidGpuDeformMesh = ({
  baseMesh,
  boids,
  color = 0xfafcff,
  numBoids,
}: {
  baseMesh: PackedMeshData;
  boids: StorageNode;
  color?: ColorRepresentation;
  numBoids: number;
}) => {
  const boidVertices = arrayNode(unpackVec4ToVec3(baseMesh.vertices), "vec3");
  const boidNormals = arrayNode(unpackVec4ToVec3(baseMesh.normals), "vec3");
  const vertexCount = boidVertices.value.count;
  const faceVertexCount = uint(3);

  const material = new MeshStandardNodeMaterial({
    color,
    metalness: 0.05,
    roughness: 0.45,
  });

  const positionNode = Fn(() => {
    const boid: any = boids.element(instanceIndex);
    const velocity: any = boid.get("vel");
    const localVertex: any = boidVertices.element(vertexIndex as any).mul(0.1);

    return (rotateByVelocity(localVertex, velocity) as any).add(boid.get("pos"));
  })();

  material.positionNode = positionNode;
  material.castShadowPositionNode = positionNode;
  material.normalNode = Fn(() => {
    const boid: any = boids.element(instanceIndex);
    const faceNormal: any = boidNormals.element((vertexIndex as any).div(faceVertexCount));
    const rotatedNormal: any = (rotateByVelocity(
      faceNormal,
      boid.get("vel")
    ) as any).normalize();

    return transformNormalToView(rotatedNormal).normalize();
  })();

  const mesh = new InstancedMesh(
    createPlaceholderGeometry(vertexCount),
    material,
    numBoids
  );
  mesh.castShadow = true;
  mesh.frustumCulled = false;

  return mesh;
};
