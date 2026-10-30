// Shared by every 3D kernel

struct Boid3d {
  pos : vec3<f32>,
  vel : vec3<f32>,
};

// vec3s are 16 byte aligned in storage, so boids are stored as 3 vec2s
// (24 bytes instead of 32) and unpacked into Boid3d
struct PackedBoid3d {
  posXY : vec2<f32>,
  posZVelX : vec2<f32>,
  velYZ : vec2<f32>,
};

fn unpackBoid(boid: PackedBoid3d) -> Boid3d {
  return Boid3d(
    vec3<f32>(boid.posXY, boid.posZVelX.x),
    vec3<f32>(boid.posZVelX.y, boid.velYZ),
  );
}

fn packBoid(boid: Boid3d) -> PackedBoid3d {
  return PackedBoid3d(boid.pos.xy, vec2<f32>(boid.pos.z, boid.vel.x), boid.vel.yz);
}

// Shared so every kernel that bins a boid gets the exact same cell
fn getGridID(pos: vec3<f32>) -> u32 {
  let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);
  let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);
  let z = i32(floor(pos.z * params.gridInverseCellSize)) + i32(params.gridDimZ / 2u);
  return params.gridDimX * params.gridDimY * u32(z) + params.gridDimX * u32(y) + u32(x);
}
