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
  vec2,
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

const createPlaceholderGeometry = (
  vertexCount: number,
  boundRadius: number,
) => {
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
  const boidVertices = arrayNode(
    unpackFrontFaceVertices(baseMesh.vertices),
    "vec3",
  );
  const vertexCount = numBoids * 3;
  const material = new BoidMeshBasicNodeMaterial2d({
    color,
    side: DoubleSide,
  });

  material.vertexNode = Fn(() => {
    const instanceId = vertexIndex.div(3).toVar();
    const vertexId = vertexIndex.sub(instanceId.mul(3)).toVar();
    const boid = boids.element(instanceId);
    const angle = atan(boid.get("vel").x, boid.get("vel").y).negate();
    const pos = boidVertices.element(vertexId).mul(0.1);
    const rotated = vec2(
      pos.x.mul(angle.cos()).sub(pos.y.mul(angle.sin())),
      pos.x.mul(angle.sin()).add(pos.y.mul(angle.cos())),
    );

    return cameraProjectionMatrix
      .mul(modelViewMatrix)
      .mul(vec4(rotated.add(boid.get("pos")), 0, 1));
  })();

  const mesh = new Mesh(
    createPlaceholderGeometry(vertexCount, boundRadius),
    material,
  );
  mesh.frustumCulled = false;

  return mesh;
};
