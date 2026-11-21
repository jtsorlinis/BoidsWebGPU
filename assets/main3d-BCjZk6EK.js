import{C as e,D as t,E as n,S as r,T as i,_ as a,a as o,b as s,d as c,f as l,h as u,l as d,m as f,o as p,p as m,v as h,w as ee,x as te,y as g}from"./gpu-nS4QaLAx.js";import{A as ne,D as _,E as v,M as y,O as b,P as re,T as x,_ as S,a as C,c as w,d as T,f as E,i as D,j as O,k,l as ie,m as ae,n as A,o as j,p as M,r as oe,s as N,t as P,u as F,v as I,w as L,x as R,y as z}from"./three.tsl-CYqVDLmD.js";var B=new h,V=class e{constructor(e){e||={},this.zNear=e.webGL===!0?-1:0,this.zFar=1,this.vertices={near:[new n,new n,new n,new n],far:[new n,new n,new n,new n]},e.projectionMatrix!==void 0&&this.setFromProjectionMatrix(e.projectionMatrix,e.maxFar||1e4),e.reversedDepth===!0&&(this.zNear=1,this.zFar=0)}setFromProjectionMatrix(e,t){let n=this.zNear,r=this.zFar,i=e.elements[11]===0;return B.copy(e).invert(),this.vertices.near[0].set(1,1,n),this.vertices.near[1].set(1,-1,n),this.vertices.near[2].set(-1,-1,n),this.vertices.near[3].set(-1,1,n),this.vertices.near.forEach(function(e){e.applyMatrix4(B)}),this.vertices.far[0].set(1,1,r),this.vertices.far[1].set(1,-1,r),this.vertices.far[2].set(-1,-1,r),this.vertices.far[3].set(-1,1,r),this.vertices.far.forEach(function(e){e.applyMatrix4(B);let n=Math.abs(e.z);i?e.z*=Math.min(t/n,1):e.multiplyScalar(Math.min(t/n,1))}),this.vertices}split(t,n){for(;t.length>n.length;)n.push(new e);n.length=t.length;let r=this.vertices.near[0].z,i=this.vertices.far[0].z;for(let e=0;e<t.length;e++){let a=n[e];if(e===0)for(let e=0;e<4;e++)a.vertices.near[e].copy(this.vertices.near[e]);else{let n=(t[e-1]*i-r)/(i-r);for(let e=0;e<4;e++)a.vertices.near[e].lerpVectors(this.vertices.near[e],this.vertices.far[e],n)}if(e===t.length-1)for(let e=0;e<4;e++)a.vertices.far[e].copy(this.vertices.far[e]);else{let n=(t[e]*i-r)/(i-r);for(let e=0;e<4;e++)a.vertices.far[e].lerpVectors(this.vertices.near[e],this.vertices.far[e],n)}}}toSpace(e,t){for(let n=0;n<4;n++)t.vertices.near[n].copy(this.vertices.near[n]).applyMatrix4(e),t.vertices.far[n].copy(this.vertices.far[n]).applyMatrix4(e)}},H=new h,U=new V,W=new n,G=new c,K=[],q=[],J=new n,Y=new h,X=new h,se=new n(0,1,0),ce=class extends s{constructor(){super(),this.target=new s}},le=class extends d{constructor(e,t={}){super(e),this.camera=null,this.cascades=t.cascades||3,this.maxFar=t.maxFar||1e5,this.mode=t.mode||`practical`,this.lightMargin=t.lightMargin||200,this.customSplitsCallback=t.customSplitsCallback,this.fade=!1,this.breaks=[],this._cascades=[],this.mainFrustum=null,this.frustums=[],this.lights=[],this._shadowNodes=[]}_init({camera:e,renderer:n}){this.camera=e;let r={webGL:n.coordinateSystem===t,reversedDepth:n.reversedDepthBuffer};this.mainFrustum=new V(r);let a=this.light;for(let e=0;e<this.cascades;e++){let t=new ce;t.castShadow=!0;let n=a.shadow.clone();n.bias*=e+1,this.lights.push(t),t.shadow=n,this._shadowNodes.push(S(t,n)),this._cascades.push(new i)}this.updateFrustums()}_initCascades(){let e=this.camera;e.updateProjectionMatrix(),this.mainFrustum.setFromProjectionMatrix(e.projectionMatrix,this.maxFar),this.mainFrustum.split(this.breaks,this.frustums)}_getBreaks(){let e=this.camera,t=Math.min(e.far,this.maxFar);switch(this.breaks.length=0,this.mode){case`uniform`:n(this.cascades,e.near,t,this.breaks);break;case`logarithmic`:r(this.cascades,e.near,t,this.breaks);break;case`practical`:i(this.cascades,e.near,t,.5,this.breaks);break;case`custom`:this.customSplitsCallback===void 0&&console.error(`CSM: Custom split scheme callback not defined.`),this.customSplitsCallback(this.cascades,e.near,t,this.breaks)}function n(e,t,n,r){for(let i=1;i<e;i++)r.push((t+(n-t)*i/e)/n);r.push(1)}function r(e,t,n,r){for(let i=1;i<e;i++)r.push(t*(n/t)**(i/e)/n);r.push(1)}function i(e,t,i,o,s){K.length=0,q.length=0,r(e,t,i,q),n(e,t,i,K);for(let t=1;t<e;t++)s.push(a.lerp(K[t-1],q[t-1],o));s.push(1)}}_setLightBreaks(){for(let e=0,t=this.cascades;e<t;e++){let t=this.breaks[e],n=this.breaks[e-1]||0;this._cascades[e].set(n,t)}}_updateShadowBounds(){let e=this.frustums;for(let t=0;t<e.length;t++){let e=this.lights[t].shadow.camera,n=this.frustums[t],r=n.vertices.near,i=n.vertices.far,a=i[0],o;o=a.distanceTo(i[2])>a.distanceTo(r[2])?i[2]:r[2];let s=a.distanceTo(o);if(this.fade){let e=this.camera,t=Math.max(e.far,this.maxFar),r=.25*(n.vertices.far[0].z/(t-e.near))**2*(t-e.near);s+=r}e.left=-s/2,e.right=s/2,e.top=s/2,e.bottom=-s/2,e.updateProjectionMatrix()}}updateFrustums(){this._getBreaks(),this._initCascades(),this._updateShadowBounds(),this._setLightBreaks()}_setupFade(){let e=T(`camera.near`,`float`,this).setGroup(E),t=T(`_cascades`,`vec2`,this).setGroup(E).setName(`cascades`),n=R(`float`).setGroup(E).setName(`shadowFar`).onRenderUpdate(()=>Math.min(this.maxFar,this.camera.far)),r=b(w.z,e,n).toVar(`linearDepth`),i=this.cascades-1;return P(e=>{this.setupShadowPosition(e);let n=v(1,1,1,1).toVar(`shadowValue`),a=L().toVar(`cascade`),o=D().toVar(`cascadeCenter`),s=D().toVar(`margin`),c=D().toVar(`csmX`),l=D().toVar(`csmY`);for(let e=0;e<this.cascades;e++){let u=e===i;a.assign(t.element(e)),o.assign(a.x.add(a.y).div(2));let d=r.lessThan(o).select(a.x,a.y);s.assign(D(.25).mul(d.pow(2))),c.assign(a.x.sub(s.div(2))),u?l.assign(a.y):l.assign(a.y.add(s.div(2)));let f=r.greaterThanEqual(c).and(r.lessThanEqual(l));A(f,()=>{let t=C(r.sub(c),l.sub(r)).toVar().div(s).clamp(0,1);e===0&&(t=r.greaterThan(o).select(t,1)),n.subAssign(this._shadowNodes[e].oneMinus().mul(t))})}return n})()}_setupStandard(){let e=T(`camera.near`,`float`,this).setGroup(E),t=T(`_cascades`,`vec2`,this).setGroup(E).setName(`cascades`),n=R(`float`).setGroup(E).setName(`shadowFar`).onRenderUpdate(()=>Math.min(this.maxFar,this.camera.far)),r=b(w.z,e,n).toVar(`linearDepth`);return P(e=>{this.setupShadowPosition(e);let n=v(1,1,1,1).toVar(`shadowValue`),i=L().toVar(`cascade`);for(let e=0;e<this.cascades;e++)i.assign(t.element(e)),A(r.greaterThanEqual(i.x).and(r.lessThanEqual(i.y)),()=>{n.assign(this._shadowNodes[e])});return n})()}build(e){return e.addSequentialNode(this),super.build(e)}setup(e){return this.camera===null&&this._init(e),this.fade===!0?this._setupFade():this._setupStandard()}updateBefore(){let e=this.light,t=e.parent,n=this.camera,r=this.frustums;for(let e=0;e<this.lights.length;e++){let n=this.lights[e];n.parent===null&&(t.add(n.target),t.add(n))}J.subVectors(e.target.position,e.position).normalize(),Y.lookAt(e.position,e.target.position,se),X.copy(Y).invert();for(let e=0;e<r.length;e++){let t=this.lights[e],i=t.shadow,a=i.camera,o=(a.right-a.left)/i.mapSize.width,s=(a.top-a.bottom)/i.mapSize.height;H.multiplyMatrices(X,n.matrixWorld),r[e].toSpace(H,U);let c=U.vertices.near,l=U.vertices.far;G.makeEmpty();for(let e=0;e<4;e++)G.expandByPoint(c[e]),G.expandByPoint(l[e]);G.getCenter(W),W.z=G.max.z+this.lightMargin,W.x=Math.floor(W.x/o)*o,W.y=Math.floor(W.y/s)*s,W.applyMatrix4(Y),t.position.copy(W),t.target.position.copy(W),t.target.position.add(J),t.updateMatrixWorld(),t.target.updateMatrixWorld()}}dispose(){for(let e=0;e<this.lights.length;e++){let t=this.lights[e],n=t.parent;n!==null&&(n.remove(t.target),n.remove(t))}super.dispose()}},ue={label:`3d`,include:`// Shared by every 3D kernel\r
\r
struct Boid3d {\r
  pos : vec3<f32>,\r
  vel : vec3<f32>,\r
};\r
\r
// vec3s are 16 byte aligned in storage, so boids are stored as 6 floats\r
// (24 bytes instead of 32) and unpacked into Boid3d\r
struct PackedBoid3d {\r
  posX : f32,\r
  posY : f32,\r
  posZ : f32,\r
  velX : f32,\r
  velY : f32,\r
  velZ : f32,\r
};\r
\r
fn unpackBoid(boid: PackedBoid3d) -> Boid3d {\r
  return Boid3d(\r
    vec3<f32>(boid.posX, boid.posY, boid.posZ),\r
    vec3<f32>(boid.velX, boid.velY, boid.velZ),\r
  );\r
}\r
\r
fn packBoid(boid: Boid3d) -> PackedBoid3d {\r
  return PackedBoid3d(boid.pos.x, boid.pos.y, boid.pos.z, boid.vel.x, boid.vel.y, boid.vel.z);\r
}\r
\r
// Shared so every kernel that bins a boid gets the exact same cell\r
fn getGridID(pos: vec3<f32>) -> u32 {\r
  let x = i32(floor(pos.x * params.gridInverseCellSize * 2.0)) + i32(params.gridDimX / 2u);\r
  let y = i32(floor(pos.y * params.gridInverseCellSize)) + i32(params.gridDimY / 2u);\r
  let z = i32(floor(pos.z * params.gridInverseCellSize)) + i32(params.gridDimZ / 2u);\r
  return params.gridDimX * params.gridDimY * u32(z) + params.gridDimX * u32(y) + u32(x);\r
}\r
`,generateBoids:`@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> boids : array<PackedBoid3d>;\r
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
  let base = params.rngSeed + index * 6u;\r
  let boid = Boid3d(\r
    vec3<f32>(\r
      rand_pcg(base, -params.xBound, params.xBound),\r
      rand_pcg(base + 1u, -params.yBound, params.yBound),\r
      rand_pcg(base + 2u, -params.zBound, params.zBound),\r
    ),\r
    vec3<f32>(\r
      rand_pcg(base + 3u, -params.maxSpeed, params.maxSpeed),\r
      rand_pcg(base + 4u, -params.maxSpeed, params.maxSpeed),\r
      rand_pcg(base + 5u, -params.maxSpeed, params.maxSpeed),\r
    ),\r
  );\r
  boids[index] = packBoid(boid);\r
\r
  // Bin into the first frame's grid, after that the boids kernel keeps it up to date\r
  let cell = getGridID(boid.pos);\r
  grid[index] = vec2<u32>(cell, atomicAdd(&gridOffsetsIn[cell], 1u));\r
}\r
`,boids:`@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read> boidsIn : array<PackedBoid3d>;\r
@binding(2) @group(0) var<storage, read_write> boidsOut : array<PackedBoid3d>;\r
@binding(3) @group(0) var<storage, read> sortedIndices : array<u32>;\r
@binding(4) @group(0) var<storage, read> gridOffsets : array<u32>;\r
@binding(5) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;\r
@binding(6) @group(0) var<storage, read_write> grid : array<vec2<u32>>;\r
\r
// Neighbour rows staged once per group, as (pos, vel.x) and vel.yz\r
var<workgroup> tilePosVelX : array<vec4<f32>, tileSize>;\r
var<workgroup> tileVelYZ : array<vec2<f32>, tileSize>;\r
\r
fn addNeighbour(pos: vec3<f32>, otherPos: vec3<f32>, otherVel: vec3<f32>, center: ptr<function, vec3<f32>>, close: ptr<function, vec3<f32>>, avgVel: ptr<function, vec3<f32>>, neighbours: ptr<function, u32>) {\r
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
fn mergedBehaviours(boid: ptr<function, Boid3d>, localID: u32, firstCell: u32, lastCell: u32) {\r
  var center : vec3<f32> = vec3<f32>();\r
  var close : vec3<f32> = vec3<f32>();\r
  var avgVel : vec3<f32> = vec3<f32>();\r
  var neighbours: u32 = 0u;\r
\r
  let pos = (*boid).pos;\r
  let cell = getGridID(pos);\r
  let zStep = i32(params.gridDimX * params.gridDimY);\r
\r
  // Loop around own cell (3x3x3 neighborhood). The group's boids are sorted\r
  // by cell, so each row they search together is one run of sorted indices,\r
  // whose boids are staged into the tile when they fit\r
  for (var z: i32 = -1; z <= 1; z += 1) {\r
    for (var y: i32 = -1; y <= 1; y += 1) {\r
      let row = u32(z * zStep + y * i32(params.gridDimX));\r
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
            let other = unpackBoid(boidsIn[sortedIndices[tileStart + k]]);\r
            tilePosVelX[k] = vec4<f32>(other.pos, other.vel.x);\r
            tileVelYZ[k] = other.vel.yz;\r
          }\r
        }\r
      }\r
      workgroupBarrier();\r
\r
      if (tiled) {\r
        var j = start - tileStart;\r
        let tileEnd = end - tileStart;\r
        for (; j + 3u < tileEnd; j += 4u) {\r
          let o0 = tilePosVelX[j];\r
          let o1 = tilePosVelX[j + 1u];\r
          let o2 = tilePosVelX[j + 2u];\r
          let o3 = tilePosVelX[j + 3u];\r
          let v0 = tileVelYZ[j];\r
          let v1 = tileVelYZ[j + 1u];\r
          let v2 = tileVelYZ[j + 2u];\r
          let v3 = tileVelYZ[j + 3u];\r
          addNeighbour(pos, o0.xyz, vec3<f32>(o0.w, v0), &center, &close, &avgVel, &neighbours);\r
          addNeighbour(pos, o1.xyz, vec3<f32>(o1.w, v1), &center, &close, &avgVel, &neighbours);\r
          addNeighbour(pos, o2.xyz, vec3<f32>(o2.w, v2), &center, &close, &avgVel, &neighbours);\r
          addNeighbour(pos, o3.xyz, vec3<f32>(o3.w, v3), &center, &close, &avgVel, &neighbours);\r
        }\r
        // Up to 3 are left. Reading all 3 slots and testing the ones past the\r
        // end as the boid itself, which is never a neighbour, avoids a branch\r
        let last = tileEnd - 1u;\r
        let j0 = min(j, last);\r
        let j1 = min(j + 1u, last);\r
        let j2 = min(j + 2u, last);\r
        let o0 = tilePosVelX[j0];\r
        let o1 = tilePosVelX[j1];\r
        let o2 = tilePosVelX[j2];\r
        addNeighbour(pos, select(pos, o0.xyz, j < tileEnd), vec3<f32>(o0.w, tileVelYZ[j0]), &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, select(pos, o1.xyz, j + 1u < tileEnd), vec3<f32>(o1.w, tileVelYZ[j1]), &center, &close, &avgVel, &neighbours);\r
        addNeighbour(pos, select(pos, o2.xyz, j + 2u < tileEnd), vec3<f32>(o2.w, tileVelYZ[j2]), &center, &close, &avgVel, &neighbours);\r
      } else {\r
        var j = start;\r
        for (; j + 3u < end; j += 4u) {\r
          let o0 = unpackBoid(boidsIn[sortedIndices[j]]);\r
          let o1 = unpackBoid(boidsIn[sortedIndices[j + 1u]]);\r
          let o2 = unpackBoid(boidsIn[sortedIndices[j + 2u]]);\r
          let o3 = unpackBoid(boidsIn[sortedIndices[j + 3u]]);\r
          addNeighbour(pos, o0.pos, o0.vel, &center, &close, &avgVel, &neighbours);\r
          addNeighbour(pos, o1.pos, o1.vel, &center, &close, &avgVel, &neighbours);\r
          addNeighbour(pos, o2.pos, o2.vel, &center, &close, &avgVel, &neighbours);\r
          addNeighbour(pos, o3.pos, o3.vel, &center, &close, &avgVel, &neighbours);\r
        }\r
        for (; j < end; j += 1u) {\r
          let other = unpackBoid(boidsIn[sortedIndices[j]]);\r
          addNeighbour(pos, other.pos, other.vel, &center, &close, &avgVel, &neighbours);\r
        }\r
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
fn limitSpeed(boid: ptr<function, Boid3d>) {\r
  let speed = length((*boid).vel);\r
  let clampedSpeed = clamp(speed, params.minSpeed, params.maxSpeed);\r
  (*boid).vel *= clampedSpeed / speed;\r
}\r
\r
fn keepInBounds(boid: ptr<function, Boid3d>) {\r
  let bounds = vec3<f32>(params.xBound, params.yBound, params.zBound);\r
  let outside = step(bounds, abs((*boid).pos));\r
  (*boid).vel -= sign((*boid).pos) * outside * (params.turnSpeed * params.dt);\r
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
  let firstCell = getGridID(unpackBoid(boidsIn[sortedIndices[first]]).pos);\r
  let lastCell = getGridID(unpackBoid(boidsIn[sortedIndices[last]]).pos);\r
\r
  mergedBehaviours(&boid, localID, firstCell, lastCell);\r
  limitSpeed(&boid);\r
  keepInBounds(&boid);\r
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
  }\r
}\r
`,viewBindings:[],boidBytes:24,searchBlockSize:64,tileSize:224,boidLimitPerGroup:256},Z=e=>e?9:3,de=k(`
fn triangleVertex(pos: vec3<f32>, vel: vec3<f32>, corner: u32) -> vec3<f32> {
  const halfPi = 1.57079632679;
  const boidScale = 0.1;

  // The triangle's corners: (-0.4, -0.5), (0, 0.5), (0.4, -0.5)
  let local = vec3<f32>((f32(corner) - 1.0) * 0.4, select(-0.5, 0.5, corner == 1u), 0.0);
  var v = local * boidScale;

  let pitch = atan2(vel.y, length(vel.xz)) - halfPi;
  v = vec3<f32>(-v.y * sin(pitch) + v.x * cos(pitch), v.y * cos(pitch) + v.x * sin(pitch), v.z);
  let yaw = atan2(vel.x, vel.z) - halfPi;
  v = vec3<f32>(v.x * cos(yaw) + v.z * sin(yaw), v.y, v.z * cos(yaw) - v.x * sin(yaw));

  let world = v + pos;
  return vec3<f32>(world.xy, -world.z);
}
`),fe=k(`
fn birdVertex(pos: vec3<f32>, vel: vec3<f32>, corner: u32) -> vec3<f32> {
  const boidScale = 0.1;
  // How far the wingtips swing above and below where they rest in level flight, as a
  // share of the wing
  const wingSwing = 0.7;
  // How far above level the wingtips rest, so they lift higher than they drop
  const wingRest = 0.15;
  // How far above level the wingtips are held in a glide
  const wingGlide = 0.3;
  // The slope it glides down, and the climb it flaps hardest on, as the sine of the angle
  const glideSlope = 0.4;
  // How much further the wingtips swing on that climb
  const climbSwing = 0.15;
  // How far a dive straight down tucks the wingtips back, in body lengths, and in
  // towards the spine, as a share of the way
  const tuckBack = 0.3;
  const tuckIn = 0.55;
  // Radians of wave per unit flown along it
  const waveNumber = 16.0;
  // Three directions at right angles to each other, and none along the bounds
  const waveAxes = mat3x3<f32>(2.0, 3.0, 6.0, 3.0, -6.0, 2.0, 6.0, 2.0, -3.0) * (1.0 / 7.0);

  // Each corner's (distance back from the beak, distance out to the side, 1 if a wingtip),
  // in body lengths. The body widens from the beak to a fanned tail, and each wing sweeps
  // back from the spine to its tip, so lifting the two tips folds the bird along its spine.
  const shape = array<vec3<f32>, 9>(
    vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 0.14, 0.0), vec3<f32>(1.0, -0.14, 0.0),
    vec3<f32>(0.2, 0.0, 0.0), vec3<f32>(0.55, 0.0, 0.0), vec3<f32>(0.62, 0.7, 1.0),
    vec3<f32>(0.2, 0.0, 0.0), vec3<f32>(0.55, 0.0, 0.0), vec3<f32>(0.62, -0.7, 1.0),
  );
  let tip = shape[corner].z;

  // Level across the wings, however steeply the boid climbs
  let forward = normalize(vel);
  let level = vec3<f32>(forward.z, 0.0, -forward.x);
  let side = level * inverseSqrt(max(dot(level, level), 1e-12));
  let up = cross(forward, side);

  // Diving steeper than it glides, the wingtips tuck back and in
  let tuck = smoothstep(glideSlope, 1.0, -forward.y) * tip;
  let back = shape[corner].x + tuck * tuckBack;
  let out = shape[corner].y * (1.0 - tuck * tuckIn);

  // The wings follow waves that stay where they are, so they beat as the boid flies
  // through them: faster boids beat faster, and neighbours are out of step. That needs
  // nothing stored per boid, which there's nowhere to keep as the boids are re-sorted
  // each frame. Each wave counts by how much of the boid's heading is along it.
  let heading = waveAxes * forward;
  let beat = dot(heading * heading, sin(waveAxes * pos * waveNumber));

  // How hard it flaps: not at all down the glide slope, 1 in level flight, and hardest up
  // a climb that steep
  let steep = clamp(forward.y / glideSlope, -1.0, 1.0);
  let effort = 1.0 + steep * select(climbSwing, 1.0, steep < 0.0);

  // A wingtip turns about the spine, so the wing keeps its length as it lifts
  let rest = mix(wingGlide, wingRest, min(effort, 1.0));
  let lift = (beat * wingSwing * effort + rest) * tip;
  let reach = sqrt(1.0 - lift * lift);

  let local = forward * (0.5 - back) + side * (out * reach) + up * (abs(out) * lift);
  let world = pos + local * boidScale;
  return vec3<f32>(world.xy, -world.z);
}
`),Q=(e,t,n)=>{let r=Z(n),i=n?fe:de,a=z(e,`float`,t*6).toReadOnly(),o=_.div(r).mul(6),s=new p({color:new m(1,.02,0),roughness:.5,metalness:0,side:2,flatShading:!0});return s.positionNode=i({pos:x(a.element(o),a.element(o.add(1)),a.element(o.add(2))),vel:x(a.element(o.add(3)),a.element(o.add(4)),a.element(o.add(5))),corner:_.mod(r)}),s},pe=x(.45,.55,.71),me=x(.65,.76,.88),he=x(.84,.92,.94),$=x(.44,.42,.4),ge=P(()=>{let e=N.y,t=I(0,.95,e.mul(.5).add(.5)),n=I(-.08,.02,e),r=F(t,.8),i=I(-.01,.05,e).mul(I(.08,.22,e).oneMinus()),a=j(me,pe,r),o=j($,a,n);return M(j(o,he,i.mul(.7)))})(),_e=new n(-.3213937660622072,-.7660444011712928,-.5566704252156701),ve=new m().setRGB(1,.95686275,.8392157,e),ye=Math.PI,be=new m().setRGB(.36,.45,.62,e),xe=new m().setRGB(.3,.28,.26,e),Se=Math.PI,Ce=8192,we=async({device:t,renderer:n},i,a)=>{n.outputColorSpace=e,n.shadowMap.enabled=!0,n.shadowMap.type=1;let s=await ne(t,ue,{zBound:`f32`,gridDimZ:`u32`}),c=new ee;c.backgroundNode=ge;let d=new te(60,i.width/i.height,.3,1e3),m=new AbortController,h=re(d,i,m.signal),_=new f(ve,ye);_.position.copy(_e).negate(),_.castShadow=!0;let b=Math.min(Ce,t.limits.maxTextureDimension2D);_.shadow.mapSize.set(b,b),_.shadow.bias=-1e-4,_.shadow.normalBias=.01,_.shadow.radius=2;let x=new le(_,{cascades:2,mode:`custom`,customSplitsCallback:(e,t,n,r)=>{r.push(.2,1)}}),S=R(0),C=R(0),w=ie.sub(oe),T=ae(w.dot(w).mul(S).add(C)),E=x;_.shadow.shadowNode=j(E,v(1,1,1,1),T),c.add(_,_.target),c.add(new u(be,xe,Se));let D=new r(1,1).rotateX(-Math.PI/2),k=new p({color:16777215,roughness:.5,metalness:0}),A=new g(D,k);A.receiveShadow=!0,c.add(A);let M=new l,N=new g(M);N.frustumCulled=!1,N.castShadow=!0,N.receiveShadow=!0,N.onBeforeShadow=(e,t,n,r,i,a)=>{a.colorWrite=!1},c.add(N);let P=a,F=0,I=0,L=0,z=[],B=[],V=!0,H=()=>{N.material=(V?B:z)[s.current],M.setDrawRange(0,P*Z(V))},U=()=>{for(let e of[...z,...B])e.dispose()},W=e=>{let t=e*6.5;x.maxFar=t,x.lightMargin=e*4;let n=x.lightMargin+t*2;for(let{shadow:e}of[_,...x.lights])e.camera.far=n,e.camera.updateProjectionMatrix();let r=(.95*t)**2;S.value=1/(t**2-r),C.value=-r*S.value,x.camera&&x.updateFrustums()},G=()=>{let e=Math.max(1,P**(1/3)/7.5+O);h.resetView(e*3.8),A.scale.set(e*4,1,e*4),A.position.y=-e-1,W(e);let t=2*e-O,r=e-O,i=2*e-O,a=(Math.floor(t*2/y)+20)*2,c=Math.floor(r*2/y)+20,l=Math.floor(i*2/y)+20;U(),s.setup(P,a*c*l,{xBound:t,yBound:r,zBound:i,gridDimX:a,gridDimY:c,gridDimZ:l});let u=s.boidBuffers.map(e=>o(n,e,1));z=u.map(e=>Q(e,P,!1)),B=u.map(e=>Q(e,P,!0)),H()};return G(),{boidLimit:s.boidLimit,frame:e=>{F>0&&(P=F,F=0,G()),(i.width!==I||i.height!==L)&&(I=i.width,L=i.height,d.aspect=I/L,d.updateProjectionMatrix(),x.camera&&x.updateFrustums()),h.update(e);let r=t.createCommandEncoder();s.encode(r,e),t.queue.submit([r.finish()]),H(),n.render(c,d)},setNumBoids:e=>{F=Math.min(e,s.boidLimit)},setBirds:e=>{V=e},dispose:()=>{m.abort(),U(),s.dispose(),x.dispose(),_.shadow.dispose(),D.dispose(),k.dispose(),M.dispose()}}};export{we as createSim};