// Single sided, rearrangeBoids3d faces it towards the light and the
// material lights both sides
// prettier-ignore
const vertices = new Float32Array([
  0, 0.5, 0, 0,
  -0.4, -0.5, 0, 0, 
  0.4, -0.5, 0, 0, 
]);

// prettier-ignore
const normals = new Float32Array([
  0, 0, -1, 0,
]);

export const triangleMesh = { normals, vertices };
