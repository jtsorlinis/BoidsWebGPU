import{a as e,c as t,g as n,r,s as i}from"./gpu-nS4QaLAx.js";import{A as a,C as o,E as s,M as c,N as l,S as u,b as d,g as f,h as p,j as m,t as h,y as g}from"./three.tsl-N_Rkw4nk.js";var _={label:`2d`,include:`// Shared by every 2D kernel

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
`,generateBoids:`@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(3) @group(0) var<storage, read_write> grid : array<u32>;

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  let base = params.rngSeed + index * 4u;
  let boid = Boid(
    vec2<f32>(rand_pcg(base, -params.xBound, params.xBound), rand_pcg(base + 1u, -params.yBound, params.yBound)),
    vec2<f32>(rand_pcg(base + 2u, -params.maxSpeed, params.maxSpeed), rand_pcg(base + 3u, -params.maxSpeed, params.maxSpeed)),
  );
  boids[index] = boid;

  // Bin into the first frame's grid, after that the boids kernel keeps it up to date
  grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);
}
`,rearrangeBoids:`@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<u32>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boids : array<Boid>;
@binding(4) @group(0) var<storage, read_write> sortedIndices : array<u32>;
// One packed rgba8 colour per pixel, rows from the bottom of the screen up.
// Cleared to 0 each frame, which the display draws as the background.
@binding(5) @group(0) var<storage, read_write> raster : array<u32>;

const boidScale : f32 = 0.1;
const boidTriangle0 : vec2<f32> = vec2<f32>(-0.4, -0.5) * boidScale;
const boidTriangle1 : vec2<f32> = vec2<f32>(0.0, 0.5) * boidScale;
const boidTriangle2 : vec2<f32> = vec2<f32>(0.4, -0.5) * boidScale;

fn edge(a: vec2<f32>, b: vec2<f32>, p: vec2<f32>) -> f32 {
  let ab = b - a;
  let ap = p - a;
  return ap.x * ab.y - ap.y * ab.x;
}

fn rotateLocalVertex(vertex: vec2<f32>, velocity: vec2<f32>) -> vec2<f32> {
  let speedSq = dot(velocity, velocity);
  if (speedSq <= 1e-8) {
    return vertex;
  }

  let dir = velocity * inverseSqrt(speedSq);
  return vec2<f32>(
    vertex.x * dir.y + vertex.y * dir.x,
    vertex.y * dir.y - vertex.x * dir.x
  );
}

fn worldToScreen(worldPos: vec2<f32>) -> vec2<f32> {
  let rasterSize = vec2<f32>(f32(params.renderWidth), f32(params.renderHeight));
  let screenScale = rasterSize / (params.viewportHalfSize * 2.0);
  let screenOffset = rasterSize * 0.5 - params.cameraPos * screenScale;
  return worldPos * screenScale + screenOffset;
}

fn getBoidColour(boid: Boid) -> u32 {
  var d = 1.0;
  if (params.avoidMouse > 0u) {
    d = distance(boid.pos, params.mousePos) / params.zoom;
  }
  return pack4x8unorm(vec4<f32>(1.0, d, d, 1.0));
}

fn rasterizeBoid(boid: Boid) {
  let v0 = worldToScreen(rotateLocalVertex(boidTriangle0, boid.vel) + boid.pos);
  let v1 = worldToScreen(rotateLocalVertex(boidTriangle1, boid.vel) + boid.pos);
  let v2 = worldToScreen(rotateLocalVertex(boidTriangle2, boid.vel) + boid.pos);

  // Only the on screen pixels whose centres could be inside the triangle
  let minBounds = ceil(min(v0, min(v1, v2)) - 0.5);
  let maxBounds = floor(max(v0, max(v1, v2)) - 0.5);
  let minX = max(0, i32(minBounds.x));
  let minY = max(0, i32(minBounds.y));
  let maxX = min(i32(params.renderWidth) - 1, i32(maxBounds.x));
  let maxY = min(i32(params.renderHeight) - 1, i32(maxBounds.y));
  if (minX > maxX || minY > maxY) {
    return;
  }

  // Rotating and scaling to the screen keep the winding, so the area is
  // always positive unless the triangle is too small to cover a pixel
  let area = edge(v0, v1, v2);
  if (area <= 1e-5) {
    return;
  }

  let pixelStart = vec2<f32>(f32(minX) + 0.5, f32(minY) + 0.5);
  var w0Row = edge(v1, v2, pixelStart);
  var w1Row = edge(v2, v0, pixelStart);
  var w2Row = edge(v0, v1, pixelStart);

  let w0StepX = v2.y - v1.y;
  let w1StepX = v0.y - v2.y;
  let w2StepX = v1.y - v0.y;
  let w0StepY = v1.x - v2.x;
  let w1StepY = v2.x - v0.x;
  let w2StepY = v0.x - v1.x;
  let colour = getBoidColour(boid);

  for (var y = minY; y <= maxY; y += 1) {
    var w0 = w0Row;
    var w1 = w1Row;
    var w2 = w2Row;
    let row = u32(y) * params.renderWidth;

    for (var x = minX; x <= maxX; x += 1) {
      if (w0 >= 0.0 && w1 >= 0.0 && w2 >= 0.0) {
        raster[row + u32(x)] = colour;
      }

      w0 += w0StepX;
      w1 += w1StepX;
      w2 += w2StepX;
    }

    w0Row += w0StepY;
    w1Row += w1StepY;
    w2Row += w2StepY;
  }
}

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  // Only the index moves, the boids kernel reads the boid through it
  let boid = boids[index];
  let sortedIndex = gridOffsets[getGridID(boid.pos)] + grid[index];
  sortedIndices[sortedIndex] = index;

  // Drawing here saves a separate pass over every boid
  rasterizeBoid(boid);
}
`,boids:`@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(2) @group(0) var<storage, read_write> boidsOut : array<Boid>;
@binding(3) @group(0) var<storage, read> sortedIndices : array<u32>;
@binding(4) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(5) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(6) @group(0) var<storage, read_write> grid : array<u32>;

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
  // they search together is one run of sorted indices, whose boids are staged
  // into the tile when they fit
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
        let other = boidsIn[sortedIndices[tileStart + k]];
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
      var j = start;
      for (; j + 3u < end; j += 4u) {
        let o0 = boidsIn[sortedIndices[j]];
        let o1 = boidsIn[sortedIndices[j + 1u]];
        let o2 = boidsIn[sortedIndices[j + 2u]];
        let o3 = boidsIn[sortedIndices[j + 3u]];
        addNeighbour(pos, o0.pos, o0.vel, &center, &close, &avgVel, &neighbours);
        addNeighbour(pos, o1.pos, o1.vel, &center, &close, &avgVel, &neighbours);
        addNeighbour(pos, o2.pos, o2.vel, &center, &close, &avgVel, &neighbours);
        addNeighbour(pos, o3.pos, o3.vel, &center, &close, &avgVel, &neighbours);
      }
      for (; j < end; j += 1u) {
        let other = boidsIn[sortedIndices[j]];
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
  let diff = (*boid).pos - params.mousePos;
  let zoomedDist = length(diff) / params.zoom;
  if (zoomedDist < 1.0
      && abs((*boid).pos.y) < params.yBound
      && abs((*boid).pos.x) < params.xBound) {
    let dist = max(sqrt(params.minDistanceSq), zoomedDist);
    (*boid).vel += normalize(diff) / (dist * dist) * params.dt;
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
  var boid = boidsIn[sortedIndices[min(index, last)]];
  let firstCell = getGridID(boidsIn[sortedIndices[first]].pos);
  let lastCell = getGridID(boidsIn[sortedIndices[last]].pos);

  mergedBehaviours(&boid, localID, firstCell, lastCell);
  limitSpeed(&boid);
  keepInBounds(&boid);
  if (params.avoidMouse > 0) {
    avoidPredators(&boid);
  }

  boid.pos += boid.vel * params.dt;

  // Written in cell order, so next frame's neighbour reads stay close together
  if (index < params.numBoids) {
    boidsOut[index] = boid;

    // Bin the boid into next frame's grid, saving a separate update grid pass
    grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);
  }
}
`,rearrangeBindings:[`params`,`grid`,`gridOffsets`,`boids`,`sortedIndices`,`raster`],boidBytes:16,searchBlockSize:128,tileSize:256,boidLimitPerGroup:1024},v=(e,t,n,r)=>{let a=g(e,`uint`,t*n).toReadOnly(),c=new i;return c.fragmentNode=h(()=>{let e=o(p),i=d(n-1).sub(e.y),c=a.element(i.mul(t).add(e.x));return f(c.equal(d(0)),s(...r,1),u(c))})(),c},y=[.19215687,.3019608,.4745098],b=async({device:i,renderer:o},s,u)=>{o.outputColorSpace=n;let d=await a(i,_,{avoidMouse:`u32`,zoom:`f32`,mousePos:`vec2<f32>`,renderWidth:`u32`,renderHeight:`u32`,viewportHalfSize:`vec2<f32>`,cameraPos:`vec2<f32>`}),{params:f}=d,p=new AbortController,h=l(s,p.signal),g={x:0,y:0};s.addEventListener(`pointermove`,e=>{g.x=e.offsetX,g.y=e.offsetY},{signal:p.signal});let b=u,x=0,S=null,C=null,w=null,T=0,E=0,D=()=>{let n=Math.max(1,s.width),a=Math.max(1,s.height);(n!==T||a!==E)&&(C?.destroy(),w?.dispose(),C=r(i,n*a*4),T=n,E=a,w=v(e(o,C,1),n,a,y),S?S.material=w:S=new t(w),d.setViewBuffers({raster:C}))},O=()=>{h.resetView(Math.max(2,Math.sqrt(b)/10+m));let e=T/E,t=h.orthoSize*e-m,n=h.orthoSize-m,r=Math.floor(t*2/c)+30,i=Math.floor(n*2/c)+30;d.setup(b,r*i,{xBound:t,yBound:n,gridDimX:r,gridDimY:i})};return D(),O(),{boidLimit:d.boidLimit,frame:e=>{x>0&&(b=x,x=0,O()),D(),h.update(e);let t=T/E,n=(g.x/s.clientWidth-.5)*h.orthoSize*2*t+h.x,r=-(g.y/s.clientHeight-.5)*h.orthoSize*2+h.y;f.set(`zoom`,h.orthoSize/3),f.set(`mousePos`,[n,r]),f.set(`renderWidth`,T),f.set(`renderHeight`,E),f.set(`viewportHalfSize`,[h.orthoSize*t,h.orthoSize]),f.set(`cameraPos`,[h.x,h.y]);let a=i.createCommandEncoder();a.clearBuffer(C),d.encode(a,e),i.queue.submit([a.finish()]),S.render(o)},setNumBoids:e=>{x=Math.min(e,d.boidLimit)},setAvoidMouse:e=>{f.set(`avoidMouse`,+!!e)},dispose:()=>{p.abort(),d.dispose(),C?.destroy(),w?.dispose()}}};export{b as createSim};