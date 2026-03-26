import {
  Box3,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicNodeMaterial,
  Sphere,
  Vector3,
  type ColorRepresentation,
} from "three/webgpu";
import {
  Fn,
  atan,
  attributeArray,
  cameraProjectionMatrix,
  modelViewMatrix,
  uint,
  vec3,
  vec4,
  vertexIndex,
} from "three/tsl";

type PackedMeshData = {
  vertices: Float32Array;
};

type StorageNode = any;
const arrayNode = (count: any, type: any) =>
  (attributeArray as any)(count, type) as any;

const unpackFrontFaceVertices = (source: Float32Array) => {
  const unpacked = new Float32Array(9);

  for (let src = 0, dst = 0; src < 12; src += 4, dst += 3) {
    unpacked[dst] = source[src];
    unpacked[dst + 1] = source[src + 1];
    unpacked[dst + 2] = source[src + 2];
  }

  return unpacked;
};

const createPlaceholderGeometry = (vertexCount: number, boundRadius: number) => {
  const geometry = new BufferGeometry();
  const position = new BufferAttribute(new Float32Array(3), 3) as any;
  position.count = vertexCount;
  geometry.setAttribute("position", position);
  geometry.setDrawRange(0, vertexCount);
  geometry.boundingBox = new Box3(
    new Vector3(-boundRadius, -boundRadius, -1),
    new Vector3(boundRadius, boundRadius, 1),
  );
  geometry.boundingSphere = new Sphere(new Vector3(), boundRadius);

  return geometry;
};

class BoidMeshBasicNodeMaterial2d extends MeshBasicNodeMaterial {
  setupVertex() {
    return vec4(0, 0, 0, 1);
  }
}

const rotateByVelocity2d = Fn(([value, velocity]: [any, any]) => {
  const angle = atan(velocity.x, velocity.y).negate();

  return vec3(
    value.x.mul(angle.cos()).sub(value.y.mul(angle.sin())),
    value.x.mul(angle.sin()).add(value.y.mul(angle.cos())),
    value.z,
  );
}).setLayout({
  inputs: [
    { name: "value", type: "vec3" },
    { name: "velocity", type: "vec2" },
  ],
  name: "rotateByVelocity2d",
  type: "vec3",
});

export const createBoidGpuDeformMesh2d = ({
  baseMesh,
  boids,
  boundRadius,
  color = 0xffffff,
  numBoids,
}: {
  baseMesh: PackedMeshData;
  boids: StorageNode;
  boundRadius: number;
  color?: ColorRepresentation;
  numBoids: number;
}) => {
  const boidVertices = arrayNode(unpackFrontFaceVertices(baseMesh.vertices), "vec3");
  const faceVertexCount = uint(3);
  const vertexCount = numBoids * 3;
  const material = new BoidMeshBasicNodeMaterial2d({
    color,
    side: DoubleSide,
  });

  material.vertexNode = Fn(() => {
    const boidIndex = (vertexIndex as any).div(faceVertexCount).toVar("boidIndex");
    const localVertexIndex = (vertexIndex as any)
      .sub(boidIndex.mul(faceVertexCount))
      .toVar("localVertexIndex");
    const boid: any = boids.element(boidIndex);
    const position: any = boid.get("pos");
    const localPosition: any = (rotateByVelocity2d(
      boidVertices.element(localVertexIndex).mul(0.1),
      boid.get("vel"),
    ) as any).add(vec3(position.x, position.y, 0));

    return cameraProjectionMatrix.mul(modelViewMatrix).mul(vec4(localPosition, 1));
  })();

  const mesh = new Mesh(createPlaceholderGeometry(vertexCount, boundRadius), material);
  mesh.frustumCulled = false;

  return mesh;
};
