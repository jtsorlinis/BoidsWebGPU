#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(3) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(4) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(5) @group(0) var<storage, read_write> grid : array<u32>;

// Neighbour rows staged once per group, as (pos, vel)
var<workgroup> tile : array<vec4<f32>, tileSize>;

fn addNeighbour(pos: vec2<f32>, otherPos: vec2<f32>, otherVel: vec2<f32>, center: ptr<function, vec2<f32>>, close: ptr<function, vec2<f32>>, avgVel: ptr<function, vec2<f32>>, neighbours: ptr<function, u32>) {
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

fn mergedBehaviours(boid: ptr<function, Boid>, localID: u32, firstCell: u32, lastCell: u32) {
  var center : vec2<f32> = vec2<f32>();
  var close : vec2<f32> = vec2<f32>();
  var avgVel : vec2<f32> = vec2<f32>();
  var neighbours: u32 = 0u;

  let pos = (*boid).pos;
  let cell = getGridID(pos);

  // Loop around own cell. The group's boids are sorted by cell, so each row
  // they search together is one run of boids, which is staged into the tile
  // when it fits
  for (var i: i32 = -1; i <= 1; i += 1) {
    let row = u32(i * i32(params.gridDimX));
    let start = gridOffsets[cell + row - 1u];
    let end = gridOffsets[cell + row + 2u];
    let tileStart = gridOffsets[firstCell + row - 1u];
    let tileCount = gridOffsets[lastCell + row + 2u] - tileStart;
    let tiled = tileCount <= tileSize;

    workgroupBarrier();
    if (tiled) {
      for (var k = localID; k < tileCount; k += searchBlockSize) {
        let other = boidsIn[tileStart + k];
        tile[k] = vec4<f32>(other.pos, other.vel);
      }
    }
    workgroupBarrier();

    if (tiled) {
      var j = start - tileStart;
      let tileEnd = end - tileStart;
      for (; j + 3u < tileEnd; j += 4u) {
        let o0 = tile[j];
        let o1 = tile[j + 1u];
        let o2 = tile[j + 2u];
        let o3 = tile[j + 3u];
        addNeighbour(pos, o0.xy, o0.zw, &center, &close, &avgVel, &neighbours);
        addNeighbour(pos, o1.xy, o1.zw, &center, &close, &avgVel, &neighbours);
        addNeighbour(pos, o2.xy, o2.zw, &center, &close, &avgVel, &neighbours);
        addNeighbour(pos, o3.xy, o3.zw, &center, &close, &avgVel, &neighbours);
      }
      for (; j < tileEnd; j += 1u) {
        let other = tile[j];
        addNeighbour(pos, other.xy, other.zw, &center, &close, &avgVel, &neighbours);
      }
    } else {
      for (var j = start; j < end; j += 1u) {
        let other = boidsIn[j];
        addNeighbour(pos, other.pos, other.vel, &center, &close, &avgVel, &neighbours);
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

fn limitSpeed(boid: ptr<function, Boid>) {
  let speed = length((*boid).vel);
  let clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);
  (*boid).vel *= clampedSpeed / speed;
}

fn keepInBounds(boid: ptr<function, Boid>) {
  if (abs((*boid).pos.x) > params.xBound) {
    (*boid).vel.x -= sign((*boid).pos.x) * params.turnSpeed * params.dt;
  }
  if (abs((*boid).pos.y) > params.yBound) {
    (*boid).vel.y -= sign((*boid).pos.y) * params.turnSpeed * params.dt;
  }
}

fn avoidPredators(boid: ptr<function, Boid>) {
  if(distance((*boid).pos, params.mousePos) < params.zoom
      && abs((*boid).pos.y) < params.yBound
      && abs((*boid).pos.x) < params.xBound) {
      let dist = max(sqrt(params.minDistanceSq), distance((*boid).pos, params.mousePos) / params.zoom);
      let force = normalize((*boid).pos - params.mousePos) / pow(dist,2);
      (*boid).vel += force * params.dt;
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
  var boid = boidsIn[min(index, last)];
  let firstCell = getGridID(boidsIn[first].pos);
  let lastCell = getGridID(boidsIn[last].pos);

  mergedBehaviours(&boid, localID, firstCell, lastCell);
  limitSpeed(&boid);
  keepInBounds(&boid);
  if (params.avoidMouse > 0) {
    avoidPredators(&boid);
  }

  boid.pos += boid.vel * params.dt;

  if (index < params.numBoids) {
    boids[index] = boid;

    // Bin the boid into next frame's grid, saving a separate update grid pass
    grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);
  }
}
