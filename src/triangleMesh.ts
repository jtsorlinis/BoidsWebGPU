// prettier-ignore
const vertices = new Float32Array([
  // Front face
  0, 0.5, 0, 0,
  -0.4, -0.5, 0, 0, 
  0.4, -0.5, 0, 0, 

  // Back face
  0.4, -0.5, 0, 0, 
  -0.4, -0.5, 0, 0, 
  0, 0.5, 0, 0,
]);

// prettier-ignore
const normals = new Float32Array([
  0, 0, -1, 0,  // front face
  0, 0, 1, 0    // back face
]);

export const triangleMesh = { normals, vertices };
