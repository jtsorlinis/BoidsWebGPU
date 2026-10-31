@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> boidsIn : array<PackedBoid3d>;
@binding(2) @group(0) var<storage, read_write> boidsOut : array<PackedBoid3d>;
@binding(3) @group(0) var<storage, read> sortedIndices : array<u32>;
@binding(4) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(5) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(6) @group(0) var<storage, read_write> grid : array<vec2<u32>>;

// Neighbour rows staged once per group, as (pos, vel.x) and vel.yz
var<workgroup> tilePosVelX : array<vec4<f32>, tileSize>;
var<workgroup> tileVelYZ : array<vec2<f32>, tileSize>;

fn addNeighbour(pos: vec3<f32>, otherPos: vec3<f32>, otherVel: vec3<f32>, center: ptr<function, vec3<f32>>, close: ptr<function, vec3<f32>>, avgVel: ptr<function, vec3<f32>>, neighbours: ptr<function, u32>) {
  let diff = pos - otherPos;
  let distSq = dot(diff, diff);
  if (distSq < params.visualRangeSq && distSq > 0.0) {
    if (distSq < params.minDistanceSq) {
      let invDistSq = 1.0 / distSq;
      *close += diff * invDistSq;
    }
    *center += otherPos;
    *avgVel += otherVel;
    *neighbours += 1u;
  }
}

fn mergedBehaviours(boid: ptr<function, Boid3d>, localID: u32, firstCell: u32, lastCell: u32) {
  var center : vec3<f32> = vec3<f32>();
  var close : vec3<f32> = vec3<f32>();
  var avgVel : vec3<f32> = vec3<f32>();
  var neighbours: u32 = 0u;

  let pos = (*boid).pos;
  let cell = getGridID(pos);
  let zStep = i32(params.gridDimX * params.gridDimY);

  // Loop around own cell (3x3x3 neighborhood). The group's boids are sorted
  // by cell, so each row they search together is one run of sorted indices,
  // whose boids are staged into the tile when they fit
  for (var z: i32 = -1; z <= 1; z += 1) {
    for (var y: i32 = -1; y <= 1; y += 1) {
      let row = u32(z * zStep + y * i32(params.gridDimX));
      let start = gridOffsets[cell + row - 1u];
      let end = gridOffsets[cell + row + 2u];
      let tileStart = gridOffsets[firstCell + row - 1u];
      let tileCount = gridOffsets[lastCell + row + 2u] - tileStart;
      let tiled = tileCount <= tileSize;

      workgroupBarrier();
      if (tiled) {
        for (var s = 0u; s < stagePasses; s += 1u) {
          let k = localID + s * searchBlockSize;
          if (k < tileCount) {
            let other = boidsIn[sortedIndices[tileStart + k]];
            tilePosVelX[k] = vec4<f32>(other.posXY, other.posZVelX);
            tileVelYZ[k] = other.velYZ;
          }
        }
      }
      workgroupBarrier();

      if (tiled) {
        var j = start - tileStart;
        let tileEnd = end - tileStart;
        for (; j + 3u < tileEnd; j += 4u) {
          let o0 = tilePosVelX[j];
          let o1 = tilePosVelX[j + 1u];
          let o2 = tilePosVelX[j + 2u];
          let o3 = tilePosVelX[j + 3u];
          let v0 = tileVelYZ[j];
          let v1 = tileVelYZ[j + 1u];
          let v2 = tileVelYZ[j + 2u];
          let v3 = tileVelYZ[j + 3u];
          addNeighbour(pos, o0.xyz, vec3<f32>(o0.w, v0), &center, &close, &avgVel, &neighbours);
          addNeighbour(pos, o1.xyz, vec3<f32>(o1.w, v1), &center, &close, &avgVel, &neighbours);
          addNeighbour(pos, o2.xyz, vec3<f32>(o2.w, v2), &center, &close, &avgVel, &neighbours);
          addNeighbour(pos, o3.xyz, vec3<f32>(o3.w, v3), &center, &close, &avgVel, &neighbours);
        }
        for (; j < tileEnd; j += 1u) {
          let other = tilePosVelX[j];
          addNeighbour(pos, other.xyz, vec3<f32>(other.w, tileVelYZ[j]), &center, &close, &avgVel, &neighbours);
        }
      } else {
        var j = start;
        for (; j + 3u < end; j += 4u) {
          let o0 = unpackBoid(boidsIn[sortedIndices[j]]);
          let o1 = unpackBoid(boidsIn[sortedIndices[j + 1u]]);
          let o2 = unpackBoid(boidsIn[sortedIndices[j + 2u]]);
          let o3 = unpackBoid(boidsIn[sortedIndices[j + 3u]]);
          addNeighbour(pos, o0.pos, o0.vel, &center, &close, &avgVel, &neighbours);
          addNeighbour(pos, o1.pos, o1.vel, &center, &close, &avgVel, &neighbours);
          addNeighbour(pos, o2.pos, o2.vel, &center, &close, &avgVel, &neighbours);
          addNeighbour(pos, o3.pos, o3.vel, &center, &close, &avgVel, &neighbours);
        }
        for (; j < end; j += 1u) {
          let other = unpackBoid(boidsIn[sortedIndices[j]]);
          addNeighbour(pos, other.pos, other.vel, &center, &close, &avgVel, &neighbours);
        }
      }
    }
  }

  if (neighbours > 0u) {
    let invNeighbours = 1.0 / f32(neighbours);
    center *= invNeighbours;
    avgVel *= invNeighbours;
    (*boid).vel += (center - (*boid).pos) * (params.cohesionFactor * params.dt);
    (*boid).vel += (avgVel - (*boid).vel) * (params.alignmentFactor * params.dt);
  }

  (*boid).vel += close * (params.separationFactor * params.dt);
}

fn limitSpeed(boid: ptr<function, Boid3d>) {
  let speed = length((*boid).vel);
  let clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);
  (*boid).vel *= clampedSpeed / speed;
}

fn keepInBounds(boid: ptr<function, Boid3d>) {
  if (abs((*boid).pos.x) > params.xBound) {
    (*boid).vel.x -= sign((*boid).pos.x) * params.turnSpeed * params.dt;
  }
  if (abs((*boid).pos.y) > params.yBound) {
    (*boid).vel.y -= sign((*boid).pos.y) * params.turnSpeed * params.dt;
  }
  if (abs((*boid).pos.z) > params.zBound) {
    (*boid).vel.z -= sign((*boid).pos.z) * params.turnSpeed * params.dt;
  }
}

@compute @workgroup_size(searchBlockSize)
fn main(@builtin(workgroup_id) GroupID : vec3<u32>, @builtin(local_invocation_index) localID : u32) {
  let first = (GroupID.y * params.updateGroupsX + GroupID.x) * searchBlockSize;
  if (first >= params.numBoids) {
    return;
  }

  // Threads past the last boid still take part in the staging, as copies of the last boid
  let last = min(first + searchBlockSize, params.numBoids) - 1u;
  let index = first + localID;
  var boid = unpackBoid(boidsIn[sortedIndices[min(index, last)]]);
  let firstCell = getGridID(unpackBoid(boidsIn[sortedIndices[first]]).pos);
  let lastCell = getGridID(unpackBoid(boidsIn[sortedIndices[last]]).pos);

  mergedBehaviours(&boid, localID, firstCell, lastCell);
  limitSpeed(&boid);
  keepInBounds(&boid);

  boid.pos += boid.vel * params.dt;

  // Written in cell order, so next frame's neighbour reads stay close together
  if (index < params.numBoids) {
    boidsOut[index] = packBoid(boid);

    // Bin the boid into next frame's grid, saving a separate update grid pass
    let cell = getGridID(boid.pos);
    grid[index] = vec2<u32>(cell, atomicAdd(&gridOffsetsIn[cell], 1u));
  }
}
