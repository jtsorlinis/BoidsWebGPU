// Shared by every 2D kernel

struct Boid {
  pos : vec2<f32>,
  vel : vec2<f32>,
};

// Shared so every kernel that bins a boid gets the exact same cell
fn getGridID(pos: vec2<f32>) -> u32 {
  let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);
  let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);
  return params.gridDimX * u32(y) + u32(x);
}
