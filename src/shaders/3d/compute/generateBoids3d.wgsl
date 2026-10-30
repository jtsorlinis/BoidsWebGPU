@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<PackedBoid3d>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(3) @group(0) var<storage, read_write> grid : array<u32>;

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  let base = params.rngSeed + index * 6u;
  let boid = Boid3d(
    vec3<f32>(
      rand_pcg(base, -params.xBound, params.xBound),
      rand_pcg(base + 1u, -params.yBound, params.yBound),
      rand_pcg(base + 2u, -params.zBound, params.zBound),
    ),
    vec3<f32>(
      rand_pcg(base + 3u, -params.maxSpeed, params.maxSpeed),
      rand_pcg(base + 4u, -params.maxSpeed, params.maxSpeed),
      rand_pcg(base + 5u, -params.maxSpeed, params.maxSpeed),
    ),
  );
  boids[index] = packBoid(boid);

  // Bin into the first frame's grid, after that the boids kernel keeps it up to date
  grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);
}
