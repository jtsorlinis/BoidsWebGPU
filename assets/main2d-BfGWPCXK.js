import{a as e,c as t,g as n,r,s as i}from"./gpu-5JyGwGJJ.js";import{A as a,C as o,E as s,M as c,N as l,S as u,b as d,g as f,h as p,j as m,t as h,y as g}from"./three.tsl-Dps69N2D.js";var _={label:`2d`,include:`// Shared by every 2D kernel\r
\r
struct Boid {\r
  pos : vec2<f32>,\r
  vel : vec2<f32>,\r
};\r
\r
fn unpackBoid(boid: vec4<f32>) -> Boid {\r
  return Boid(boid.xy, boid.zw);\r
}\r
\r
fn packBoid(boid: Boid) -> vec4<f32> {\r
  return vec4<f32>(boid.pos, boid.vel);\r
}\r
\r
// Shared so every kernel that bins a boid gets the exact same cell\r
fn getGridID(pos: vec2<f32>) -> u32 {\r
  let x = i32(floor(pos.x * params.gridInverseCellSize * 2.0)) + i32(params.gridDimX / 2u);\r
  let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);\r
  return params.gridDimX * u32(y) + u32(x);\r
}\r
`,generateBoids:`@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> boids : array<vec4<f32>>;\r
@binding(2) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;\r
@binding(3) @group(0) var<storage, read_write> grid : array<vec2<u32>>;\r
\r
@compute @workgroup_size(boidBlockSize)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r
  let index = getBoidIndex(GlobalInvocationID);\r
\r
  if (index >= params.numBoids) {\r
    return;\r
  }\r
\r
  let base = params.rngSeed + index * 4u;\r
  let boid = Boid(\r
    vec2<f32>(rand_pcg(base, -params.xBound, params.xBound), rand_pcg(base + 1u, -params.yBound, params.yBound)),\r
    vec2<f32>(rand_pcg(base + 2u, -params.maxSpeed, params.maxSpeed), rand_pcg(base + 3u, -params.maxSpeed, params.maxSpeed)),\r
  );\r
  boids[index] = packBoid(boid);\r
\r
  // Bin into the first frame's grid, after that the boids kernel keeps it up to date\r
  let cell = getGridID(boid.pos);\r
  grid[index] = vec2<u32>(cell, atomicAdd(&gridOffsetsIn[cell], 1u));\r
}\r
`,boids:`@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read> boidsIn : array<vec4<f32>>;\r
@binding(2) @group(0) var<storage, read_write> boidsOut : array<vec4<f32>>;\r
@binding(3) @group(0) var<storage, read> sortedIndices : array<u32>;\r
@binding(4) @group(0) var<storage, read> gridOffsets : array<u32>;\r
@binding(5) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;\r
@binding(6) @group(0) var<storage, read_write> grid : array<vec2<u32>>;\r
// One packed rgba8 colour per pixel, rows from the bottom of the screen up.\r
// Cleared to 0 each frame, which the display draws as the background.\r
@binding(7) @group(0) var<storage, read_write> raster : array<u32>;\r
\r
// Neighbour rows staged once per group, as (pos, vel)\r
var<workgroup> tile : array<vec4<f32>, tileSize>;\r
\r
fn addNeighbour(pos: vec2<f32>, otherPos: vec2<f32>, otherVel: vec2<f32>, center: ptr<function, vec2<f32>>, close: ptr<function, vec2<f32>>, avgVel: ptr<function, vec2<f32>>, neighbours: ptr<function, u32>) {\r
  let diff = pos - otherPos;\r
  let distSq = dot(diff, diff);\r
  if (distSq < params.visualRangeSq && distSq > 0.0) {\r
    if (distSq < params.minDistanceSq) {\r
      *close += diff * (1.0 / distSq - params.invMinDistanceSq);\r
    }\r
    *center += otherPos;\r
    *avgVel += otherVel;\r
    *neighbours += 1u;\r
  }\r
}\r
\r
fn mergedBehaviours(boid: ptr<function, Boid>, localID: u32, firstCell: u32, lastCell: u32) {\r
  var center : vec2<f32> = vec2<f32>();\r
  var close : vec2<f32> = vec2<f32>();\r
  var avgVel : vec2<f32> = vec2<f32>();\r
  var neighbours: u32 = 0u;\r
\r
  let pos = (*boid).pos;\r
  let cell = getGridID(pos);\r
\r
  // Loop around own cell. The group's boids are sorted by cell, so each row\r
  // they search together is one run of sorted indices, whose boids are staged\r
  // into the tile when they fit\r
  for (var i: i32 = -1; i <= 1; i += 1) {\r
    let row = u32(i * i32(params.gridDimX));\r
    let start = gridOffsets[cell + row - 2u];\r
    let end = gridOffsets[cell + row + 3u];\r
    let tileStart = gridOffsets[firstCell + row - 2u];\r
    let tileCount = gridOffsets[lastCell + row + 3u] - tileStart;\r
    let tiled = tileCount <= tileSize;\r
\r
    workgroupBarrier();\r
    if (tiled) {\r
      for (var s = 0u; s < stagePasses; s += 1u) {\r
        let k = localID + s * searchBlockSize;\r
        if (k < tileCount) {\r
          tile[k] = boidsIn[sortedIndices[tileStart + k]];\r
        }\r
      }\r
    }\r
    workgroupBarrier();\r
\r
    if (tiled) {\r
      var j = start - tileStart;\r
      let tileEnd = end - tileStart;\r
      for (; j + 3u < tileEnd; j += 4u) {\r
        let o0 = tile[j];\r
        let o1 = tile[j + 1u];\r
        let o2 = tile[j + 2u];\r
        let o3 = tile[j + 3u];\r
        addNeighbour(pos, o0.xy, o0.zw, &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, o1.xy, o1.zw, &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, o2.xy, o2.zw, &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, o3.xy, o3.zw, &center, &close, &avgVel, &neighbours);\r
      }\r
      // Up to 3 are left. Reading all 3 slots and testing the ones past the\r
      // end as the boid itself, which is never a neighbour, avoids a branch\r
      let last = tileEnd - 1u;\r
      let j0 = min(j, last);\r
      let j1 = min(j + 1u, last);\r
      let j2 = min(j + 2u, last);\r
      let o0 = tile[j0];\r
      let o1 = tile[j1];\r
      let o2 = tile[j2];\r
      addNeighbour(pos, select(pos, o0.xy, j < tileEnd), o0.zw, &center, &close, &avgVel, &neighbours);\r
      addNeighbour(pos, select(pos, o1.xy, j + 1u < tileEnd), o1.zw, &center, &close, &avgVel, &neighbours);\r
      addNeighbour(pos, select(pos, o2.xy, j + 2u < tileEnd), o2.zw, &center, &close, &avgVel, &neighbours);\r
    } else {\r
      var j = start;\r
      for (; j + 3u < end; j += 4u) {\r
        let o0 = boidsIn[sortedIndices[j]];\r
        let o1 = boidsIn[sortedIndices[j + 1u]];\r
        let o2 = boidsIn[sortedIndices[j + 2u]];\r
        let o3 = boidsIn[sortedIndices[j + 3u]];\r
        addNeighbour(pos, o0.xy, o0.zw, &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, o1.xy, o1.zw, &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, o2.xy, o2.zw, &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, o3.xy, o3.zw, &center, &close, &avgVel, &neighbours);\r
      }\r
      for (; j < end; j += 1u) {\r
        let other = boidsIn[sortedIndices[j]];\r
        addNeighbour(pos, other.xy, other.zw, &center, &close, &avgVel, &neighbours);\r
      }\r
    }\r
  }\r
\r
  if (neighbours > 0u) {\r
    let invNeighbours = 1.0 / f32(neighbours);\r
    center *= invNeighbours;\r
    avgVel *= invNeighbours;\r
    (*boid).vel += (center - (*boid).pos) * (params.cohesionFactor * params.dt);\r
    (*boid).vel += (avgVel - (*boid).vel) * (params.alignmentFactor * params.dt);\r
  }\r
\r
  (*boid).vel += close * (params.separationFactor * params.dt);\r
}\r
\r
fn limitSpeed(boid: ptr<function, Boid>) {\r
  let speed = length((*boid).vel);\r
  let clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);\r
  (*boid).vel *= clampedSpeed / speed;\r
}\r
\r
fn keepInBounds(boid: ptr<function, Boid>) {\r
  let bounds = vec2<f32>(params.xBound, params.yBound);\r
  let outside = step(bounds, abs((*boid).pos));\r
  (*boid).vel -= sign((*boid).pos) * outside * (params.turnSpeed * params.dt);\r
}\r
\r
fn avoidPredators(boid: ptr<function, Boid>) {\r
  let diff = (*boid).pos - params.mousePos;\r
  let zoomedDist = length(diff) / params.zoom;\r
  if (zoomedDist < 1.0\r
      && abs((*boid).pos.y) < params.yBound\r
      && abs((*boid).pos.x) < params.xBound) {\r
    let dist = max(sqrt(params.minDistanceSq), zoomedDist);\r
    let strength = max(1.0, 2.0 / params.zoom);\r
    (*boid).vel += normalize(diff) / (dist * dist) * strength * params.dt;\r
  }\r
}\r
\r
@compute @workgroup_size(searchBlockSize)\r
fn main(@builtin(workgroup_id) GroupID : vec3<u32>, @builtin(local_invocation_index) localID : u32) {\r
  let first = (GroupID.y * params.updateGroupsX + GroupID.x) * searchBlockSize;\r
  if (first >= params.numBoids) {\r
    return;\r
  }\r
\r
  // Threads past the last boid still take part in the staging, as copies of the last boid\r
  let last = min(first + searchBlockSize, params.numBoids) - 1u;\r
  let index = first + localID;\r
  var boid = unpackBoid(boidsIn[sortedIndices[min(index, last)]]);\r
  let firstCell = getGridID(boidsIn[sortedIndices[first]].xy);\r
  let lastCell = getGridID(boidsIn[sortedIndices[last]].xy);\r
\r
  mergedBehaviours(&boid, localID, firstCell, lastCell);\r
  limitSpeed(&boid);\r
  keepInBounds(&boid);\r
  if (params.mousePredator > 0) {\r
    avoidPredators(&boid);\r
  }\r
\r
  boid.pos += boid.vel * params.dt;\r
\r
  // Written in cell order, so next frame's neighbour reads stay close together\r
  if (index < params.numBoids) {\r
    boidsOut[index] = packBoid(boid);\r
\r
    // Bin the boid into next frame's grid, saving a separate update grid pass\r
    let cell = getGridID(boid.pos);\r
    grid[index] = vec2<u32>(cell, atomicAdd(&gridOffsetsIn[cell], 1u));\r
\r
    // Drawing here saves a separate pass over every boid\r
    rasterizeBoid(boid);\r
  }\r
}\r

// Draws boids into the raster, for the 2D boids kernel

const boidScale : f32 = 0.1;
// Covers the triangle's furthest corner from the boid's position, 0.64 away
const boidReach : f32 = boidScale * 0.65;

fn getBoidColour(boid: Boid) -> u32 {
  var d = 1.0;
  if (params.mousePredator > 0u) {
    d = distance(boid.pos, params.mousePos) / params.zoom;
  }
  return pack4x8unorm(vec4<f32>(1.0, d, d, 1.0));
}

fn rasterizeBoid(boid: Boid) {
  let rasterSize = vec2<f32>(f32(params.renderWidth), f32(params.renderHeight));
  let screenScale = rasterSize / (params.viewportHalfSize * 2.0);
  let center = boid.pos * screenScale + rasterSize * 0.5 - params.cameraPos * screenScale;

  // Only the on screen pixels whose centres are within the boid's reach
  let reach = boidReach * screenScale;
  let first = max(vec2<i32>(ceil(center - reach - 0.5)), vec2<i32>(0));
  let last = min(vec2<i32>(floor(center + reach - 0.5)), vec2<i32>(i32(params.renderWidth), i32(params.renderHeight)) - 1);
  if (first.x > last.x || first.y > last.y) {
    return;
  }

  // Each pixel centre is tested in the boid's own axes against the triangle
  // (-0.4, -0.5), (0, 0.5), (0.4, -0.5), pointing along its velocity
  let dir = normalize(boid.vel);
  let toMesh = 1.0 / (screenScale * boidScale);
  let colour = getBoidColour(boid);

  for (var y = first.y; y <= last.y; y += 1) {
    let row = u32(y) * params.renderWidth;
    for (var x = first.x; x <= last.x; x += 1) {
      let offset = (vec2<f32>(f32(x), f32(y)) + 0.5 - center) * toMesh;
      let along = dot(offset, dir);
      let across = offset.x * dir.y - offset.y * dir.x;
      if (along >= -0.5 && abs(across) <= 0.4 * (0.5 - along)) {
        raster[row + u32(x)] = colour;
      }
    }
  }
}
`,viewBindings:[`raster`],boidBytes:16,searchBlockSize:128,tileSize:256,boidLimitPerGroup:1024},v=(e,t,n,r)=>{let a=g(e,`uint`,t*n).toReadOnly(),c=new i;return c.fragmentNode=h(()=>{let e=o(p),i=d(n-1).sub(e.y),c=a.element(i.mul(t).add(e.x));return f(c.equal(d(0)),s(...r,1),u(c))})(),c},y=[.19215687,.3019608,.4745098],b=async({device:i,renderer:o},s,u)=>{o.outputColorSpace=n;let d=await a(i,_,{mousePredator:`u32`,zoom:`f32`,mousePos:`vec2<f32>`,renderWidth:`u32`,renderHeight:`u32`,viewportHalfSize:`vec2<f32>`,cameraPos:`vec2<f32>`}),{params:f}=d,p=new AbortController,h=l(s,p.signal),g={x:0,y:0};s.addEventListener(`pointermove`,e=>{g.x=e.offsetX,g.y=e.offsetY},{signal:p.signal});let b=u,x=0,S=null,C=null,w=null,T=0,E=0,D=()=>{let n=Math.max(1,s.width),a=Math.max(1,s.height);(n!==T||a!==E)&&(C?.destroy(),w?.dispose(),C=r(i,n*a*4),T=n,E=a,w=v(e(o,C,1),n,a,y),S?S.material=w:S=new t(w),d.setViewBuffers({raster:C}))},O=()=>{h.resetView(Math.max(2,Math.sqrt(b)/10+m));let e=T/E,t=h.orthoSize*e-m,n=h.orthoSize-m,r=(Math.floor(t*2/c)+30)*2,i=Math.floor(n*2/c)+30;d.setup(b,r*i,{xBound:t,yBound:n,gridDimX:r,gridDimY:i})};return D(),O(),{boidLimit:d.boidLimit,frame:e=>{x>0&&(b=x,x=0,O()),D(),h.update(e);let t=T/E,n=(g.x/s.clientWidth-.5)*h.orthoSize*2*t+h.x,r=-(g.y/s.clientHeight-.5)*h.orthoSize*2+h.y;f.set(`zoom`,h.orthoSize/3),f.set(`mousePos`,[n,r]),f.set(`renderWidth`,T),f.set(`renderHeight`,E),f.set(`viewportHalfSize`,[h.orthoSize*t,h.orthoSize]),f.set(`cameraPos`,[h.x,h.y]);let a=i.createCommandEncoder();a.clearBuffer(C),d.encode(a,e),i.queue.submit([a.finish()]),S.render(o)},setNumBoids:e=>{x=Math.min(e,d.boidLimit)},setPredator:e=>{f.set(`mousePredator`,+!!e)},dispose:()=>{p.abort(),d.dispose(),C?.destroy(),w?.dispose()}}};export{b as createSim};