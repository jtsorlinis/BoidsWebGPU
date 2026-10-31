import{C as e,D as t,E as n,S as r,T as i,_ as a,a as o,b as s,d as c,f as l,h as u,l as d,m as f,o as p,p as m,v as h,w as ee,x as g,y as _}from"./gpu-nS4QaLAx.js";import{A as te,D as v,E as y,M as b,O as x,P as ne,T as S,_ as C,a as w,c as T,d as E,f as D,i as O,j as k,k as A,l as j,m as re,n as M,o as N,p as P,r as ie,s as F,t as I,u as L,v as R,w as z,x as B,y as V}from"./three.tsl-UqgDTard.js";var H=new h,U=class e{constructor(e){e||={},this.zNear=e.webGL===!0?-1:0,this.zFar=1,this.vertices={near:[new n,new n,new n,new n],far:[new n,new n,new n,new n]},e.projectionMatrix!==void 0&&this.setFromProjectionMatrix(e.projectionMatrix,e.maxFar||1e4),e.reversedDepth===!0&&(this.zNear=1,this.zFar=0)}setFromProjectionMatrix(e,t){let n=this.zNear,r=this.zFar,i=e.elements[11]===0;return H.copy(e).invert(),this.vertices.near[0].set(1,1,n),this.vertices.near[1].set(1,-1,n),this.vertices.near[2].set(-1,-1,n),this.vertices.near[3].set(-1,1,n),this.vertices.near.forEach(function(e){e.applyMatrix4(H)}),this.vertices.far[0].set(1,1,r),this.vertices.far[1].set(1,-1,r),this.vertices.far[2].set(-1,-1,r),this.vertices.far[3].set(-1,1,r),this.vertices.far.forEach(function(e){e.applyMatrix4(H);let n=Math.abs(e.z);i?e.z*=Math.min(t/n,1):e.multiplyScalar(Math.min(t/n,1))}),this.vertices}split(t,n){for(;t.length>n.length;)n.push(new e);n.length=t.length;let r=this.vertices.near[0].z,i=this.vertices.far[0].z;for(let e=0;e<t.length;e++){let a=n[e];if(e===0)for(let e=0;e<4;e++)a.vertices.near[e].copy(this.vertices.near[e]);else{let n=(t[e-1]*i-r)/(i-r);for(let e=0;e<4;e++)a.vertices.near[e].lerpVectors(this.vertices.near[e],this.vertices.far[e],n)}if(e===t.length-1)for(let e=0;e<4;e++)a.vertices.far[e].copy(this.vertices.far[e]);else{let n=(t[e]*i-r)/(i-r);for(let e=0;e<4;e++)a.vertices.far[e].lerpVectors(this.vertices.near[e],this.vertices.far[e],n)}}}toSpace(e,t){for(let n=0;n<4;n++)t.vertices.near[n].copy(this.vertices.near[n]).applyMatrix4(e),t.vertices.far[n].copy(this.vertices.far[n]).applyMatrix4(e)}},W=new h,G=new U,K=new n,q=new c,J=[],Y=[],X=new n,Z=new h,Q=new h,ae=new n(0,1,0),oe=class extends s{constructor(){super(),this.target=new s}},se=class extends d{constructor(e,t={}){super(e),this.camera=null,this.cascades=t.cascades||3,this.maxFar=t.maxFar||1e5,this.mode=t.mode||`practical`,this.lightMargin=t.lightMargin||200,this.customSplitsCallback=t.customSplitsCallback,this.fade=!1,this.breaks=[],this._cascades=[],this.mainFrustum=null,this.frustums=[],this.lights=[],this._shadowNodes=[]}_init({camera:e,renderer:n}){this.camera=e;let r={webGL:n.coordinateSystem===t,reversedDepth:n.reversedDepthBuffer};this.mainFrustum=new U(r);let a=this.light;for(let e=0;e<this.cascades;e++){let t=new oe;t.castShadow=!0;let n=a.shadow.clone();n.bias*=e+1,this.lights.push(t),t.shadow=n,this._shadowNodes.push(C(t,n)),this._cascades.push(new i)}this.updateFrustums()}_initCascades(){let e=this.camera;e.updateProjectionMatrix(),this.mainFrustum.setFromProjectionMatrix(e.projectionMatrix,this.maxFar),this.mainFrustum.split(this.breaks,this.frustums)}_getBreaks(){let e=this.camera,t=Math.min(e.far,this.maxFar);switch(this.breaks.length=0,this.mode){case`uniform`:n(this.cascades,e.near,t,this.breaks);break;case`logarithmic`:r(this.cascades,e.near,t,this.breaks);break;case`practical`:i(this.cascades,e.near,t,.5,this.breaks);break;case`custom`:this.customSplitsCallback===void 0&&console.error(`CSM: Custom split scheme callback not defined.`),this.customSplitsCallback(this.cascades,e.near,t,this.breaks)}function n(e,t,n,r){for(let i=1;i<e;i++)r.push((t+(n-t)*i/e)/n);r.push(1)}function r(e,t,n,r){for(let i=1;i<e;i++)r.push(t*(n/t)**(i/e)/n);r.push(1)}function i(e,t,i,o,s){J.length=0,Y.length=0,r(e,t,i,Y),n(e,t,i,J);for(let t=1;t<e;t++)s.push(a.lerp(J[t-1],Y[t-1],o));s.push(1)}}_setLightBreaks(){for(let e=0,t=this.cascades;e<t;e++){let t=this.breaks[e],n=this.breaks[e-1]||0;this._cascades[e].set(n,t)}}_updateShadowBounds(){let e=this.frustums;for(let t=0;t<e.length;t++){let e=this.lights[t].shadow.camera,n=this.frustums[t],r=n.vertices.near,i=n.vertices.far,a=i[0],o;o=a.distanceTo(i[2])>a.distanceTo(r[2])?i[2]:r[2];let s=a.distanceTo(o);if(this.fade){let e=this.camera,t=Math.max(e.far,this.maxFar),r=.25*(n.vertices.far[0].z/(t-e.near))**2*(t-e.near);s+=r}e.left=-s/2,e.right=s/2,e.top=s/2,e.bottom=-s/2,e.updateProjectionMatrix()}}updateFrustums(){this._getBreaks(),this._initCascades(),this._updateShadowBounds(),this._setLightBreaks()}_setupFade(){let e=E(`camera.near`,`float`,this).setGroup(D),t=E(`_cascades`,`vec2`,this).setGroup(D).setName(`cascades`),n=B(`float`).setGroup(D).setName(`shadowFar`).onRenderUpdate(()=>Math.min(this.maxFar,this.camera.far)),r=x(T.z,e,n).toVar(`linearDepth`),i=this.cascades-1;return I(e=>{this.setupShadowPosition(e);let n=y(1,1,1,1).toVar(`shadowValue`),a=z().toVar(`cascade`),o=O().toVar(`cascadeCenter`),s=O().toVar(`margin`),c=O().toVar(`csmX`),l=O().toVar(`csmY`);for(let e=0;e<this.cascades;e++){let u=e===i;a.assign(t.element(e)),o.assign(a.x.add(a.y).div(2));let d=r.lessThan(o).select(a.x,a.y);s.assign(O(.25).mul(d.pow(2))),c.assign(a.x.sub(s.div(2))),u?l.assign(a.y):l.assign(a.y.add(s.div(2)));let f=r.greaterThanEqual(c).and(r.lessThanEqual(l));M(f,()=>{let t=w(r.sub(c),l.sub(r)).toVar().div(s).clamp(0,1);e===0&&(t=r.greaterThan(o).select(t,1)),n.subAssign(this._shadowNodes[e].oneMinus().mul(t))})}return n})()}_setupStandard(){let e=E(`camera.near`,`float`,this).setGroup(D),t=E(`_cascades`,`vec2`,this).setGroup(D).setName(`cascades`),n=B(`float`).setGroup(D).setName(`shadowFar`).onRenderUpdate(()=>Math.min(this.maxFar,this.camera.far)),r=x(T.z,e,n).toVar(`linearDepth`);return I(e=>{this.setupShadowPosition(e);let n=y(1,1,1,1).toVar(`shadowValue`),i=z().toVar(`cascade`);for(let e=0;e<this.cascades;e++)i.assign(t.element(e)),M(r.greaterThanEqual(i.x).and(r.lessThanEqual(i.y)),()=>{n.assign(this._shadowNodes[e])});return n})()}build(e){return e.addSequentialNode(this),super.build(e)}setup(e){return this.camera===null&&this._init(e),this.fade===!0?this._setupFade():this._setupStandard()}updateBefore(){let e=this.light,t=e.parent,n=this.camera,r=this.frustums;for(let e=0;e<this.lights.length;e++){let n=this.lights[e];n.parent===null&&(t.add(n.target),t.add(n))}X.subVectors(e.target.position,e.position).normalize(),Z.lookAt(e.position,e.target.position,ae),Q.copy(Z).invert();for(let e=0;e<r.length;e++){let t=this.lights[e],i=t.shadow,a=i.camera,o=(a.right-a.left)/i.mapSize.width,s=(a.top-a.bottom)/i.mapSize.height;W.multiplyMatrices(Q,n.matrixWorld),r[e].toSpace(W,G);let c=G.vertices.near,l=G.vertices.far;q.makeEmpty();for(let e=0;e<4;e++)q.expandByPoint(c[e]),q.expandByPoint(l[e]);q.getCenter(K),K.z=q.max.z+this.lightMargin,K.x=Math.floor(K.x/o)*o,K.y=Math.floor(K.y/s)*s,K.applyMatrix4(Z),t.position.copy(K),t.target.position.copy(K),t.target.position.add(X),t.updateMatrixWorld(),t.target.updateMatrixWorld()}}dispose(){for(let e=0;e<this.lights.length;e++){let t=this.lights[e],n=t.parent;n!==null&&(n.remove(t.target),n.remove(t))}super.dispose()}},ce={label:`3d`,include:`// Shared by every 3D kernel\r
\r
struct Boid3d {\r
  pos : vec3<f32>,\r
  vel : vec3<f32>,\r
};\r
\r
// vec3s are 16 byte aligned in storage, so boids are stored as 3 vec2s\r
// (24 bytes instead of 32) and unpacked into Boid3d\r
struct PackedBoid3d {\r
  posXY : vec2<f32>,\r
  posZVelX : vec2<f32>,\r
  velYZ : vec2<f32>,\r
};\r
\r
fn unpackBoid(boid: PackedBoid3d) -> Boid3d {\r
  return Boid3d(\r
    vec3<f32>(boid.posXY, boid.posZVelX.x),\r
    vec3<f32>(boid.posZVelX.y, boid.velYZ),\r
  );\r
}\r
\r
fn packBoid(boid: Boid3d) -> PackedBoid3d {\r
  return PackedBoid3d(boid.pos.xy, vec2<f32>(boid.pos.z, boid.vel.x), boid.vel.yz);\r
}\r
\r
// Shared so every kernel that bins a boid gets the exact same cell\r
fn getGridID(pos: vec3<f32>) -> u32 {\r
  let x = i32(floor(pos.x * params.gridInverseCellSize)) + i32(params.gridDimX / 2u);\r
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
      let invDistSq = 1.0 / distSq;\r
      *close += diff * invDistSq;\r
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
      let start = gridOffsets[cell + row - 1u];\r
      let end = gridOffsets[cell + row + 2u];\r
      let tileStart = gridOffsets[firstCell + row - 1u];\r
      let tileCount = gridOffsets[lastCell + row + 2u] - tileStart;\r
      let tiled = tileCount <= tileSize;\r
\r
      workgroupBarrier();\r
      if (tiled) {\r
        for (var s = 0u; s < stagePasses; s += 1u) {\r
          let k = localID + s * searchBlockSize;\r
          if (k < tileCount) {\r
            let other = boidsIn[sortedIndices[tileStart + k]];\r
            tilePosVelX[k] = vec4<f32>(other.posXY, other.posZVelX);\r
            tileVelYZ[k] = other.velYZ;\r
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
        for (; j < tileEnd; j += 1u) {\r
          let other = tilePosVelX[j];\r
          addNeighbour(pos, other.xyz, vec3<f32>(other.w, tileVelYZ[j]), &center, &close, &avgVel, &neighbours);\r
        }\r
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
  if (abs((*boid).pos.x) > params.xBound) {\r
    (*boid).vel.x -= sign((*boid).pos.x) * params.turnSpeed * params.dt;\r
  }\r
  if (abs((*boid).pos.y) > params.yBound) {\r
    (*boid).vel.y -= sign((*boid).pos.y) * params.turnSpeed * params.dt;\r
  }\r
  if (abs((*boid).pos.z) > params.zBound) {\r
    (*boid).vel.z -= sign((*boid).pos.z) * params.turnSpeed * params.dt;\r
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
`,viewBindings:[],boidBytes:24,searchBlockSize:64,tileSize:160,boidLimitPerGroup:256},le=A(`
fn boidVertex(posXY: vec2<f32>, posZVelX: vec2<f32>, velYZ: vec2<f32>, corner: u32) -> vec3<f32> {
  const halfPi = 1.57079632679;
  const boidScale = 0.1;
  let pos = vec3<f32>(posXY, posZVelX.x);
  let vel = vec3<f32>(posZVelX.y, velYZ);

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
`),ue=(e,t)=>{let n=V(e,`vec2`,t*3).toReadOnly(),r=v.div(3).mul(3),i=new p({color:new m(1,.02,0),roughness:.5,metalness:0,side:2,flatShading:!0});return i.positionNode=le({posXY:n.element(r),posZVelX:n.element(r.add(1)),velYZ:n.element(r.add(2)),corner:v.mod(3)}),i},de=S(.45,.55,.71),$=S(.65,.76,.88),fe=S(.84,.92,.94),pe=S(.44,.42,.4),me=I(()=>{let e=F.y,t=R(0,.95,e.mul(.5).add(.5)),n=R(-.08,.02,e),r=L(t,.8),i=R(-.01,.05,e).mul(R(.08,.22,e).oneMinus()),a=N($,de,r),o=N(pe,a,n);return P(N(o,fe,i.mul(.7)))})(),he=new n(-.3213937660622072,-.7660444011712928,-.5566704252156701),ge=new m().setRGB(1,.95686275,.8392157,e),_e=Math.PI,ve=new m().setRGB(.36,.45,.62,e),ye=new m().setRGB(.3,.28,.26,e),be=Math.PI,xe=8192,Se=async({device:t,renderer:n},i,a)=>{n.outputColorSpace=e,n.shadowMap.enabled=!0,n.shadowMap.type=1;let s=await te(t,ce,{zBound:`f32`,gridDimZ:`u32`}),c=new ee;c.backgroundNode=me;let d=new g(60,i.width/i.height,.3,1e3),m=new AbortController,h=ne(d,i,m.signal),v=new f(ge,_e);v.position.copy(he).negate(),v.castShadow=!0;let x=Math.min(xe,t.limits.maxTextureDimension2D);v.shadow.mapSize.set(x,x),v.shadow.bias=-1e-4,v.shadow.normalBias=.01,v.shadow.radius=2;let S=new se(v,{cascades:2,mode:`custom`,customSplitsCallback:(e,t,n,r)=>{r.push(.2,1)}}),C=B(0),w=B(0),T=j.sub(ie),E=re(T.dot(T).mul(C).add(w)),D=S;v.shadow.shadowNode=N(D,y(1,1,1,1),E),c.add(v,v.target),c.add(new u(ve,ye,be));let O=new r(1,1).rotateX(-Math.PI/2),A=new p({color:16777215,roughness:.5,metalness:0}),M=new _(O,A);M.receiveShadow=!0,c.add(M);let P=new l,F=new _(P);F.frustumCulled=!1,F.castShadow=!0,F.receiveShadow=!0,F.onBeforeShadow=(e,t,n,r,i,a)=>{a.colorWrite=!1},c.add(F);let I=a,L=0,R=0,z=0,V=[],H=e=>{let t=e*6.5;S.maxFar=t,S.lightMargin=e*4;let n=S.lightMargin+t*2;for(let{shadow:e}of[v,...S.lights])e.camera.far=n,e.camera.updateProjectionMatrix();let r=(.95*t)**2;C.value=1/(t**2-r),w.value=-r*C.value,S.camera&&S.updateFrustums()},U=()=>{let e=Math.max(1,I**(1/3)/7.5+k);h.resetView(e*3.8),M.scale.set(e*4,1,e*4),M.position.y=-e-1,H(e);let t=2*e-k,r=e-k,i=2*e-k,a=Math.floor(t*2/b)+20,c=Math.floor(r*2/b)+20,l=Math.floor(i*2/b)+20;for(let e of V)e.dispose();s.setup(I,a*c*l,{xBound:t,yBound:r,zBound:i,gridDimX:a,gridDimY:c,gridDimZ:l}),V=s.boidBuffers.map(e=>ue(o(n,e,2),I)),F.material=V[s.current],P.setDrawRange(0,I*3)};return U(),{boidLimit:s.boidLimit,frame:e=>{L>0&&(I=L,L=0,U()),(i.width!==R||i.height!==z)&&(R=i.width,z=i.height,d.aspect=R/z,d.updateProjectionMatrix(),S.camera&&S.updateFrustums()),h.update(e);let r=t.createCommandEncoder();s.encode(r,e),t.queue.submit([r.finish()]),F.material=V[s.current],n.render(c,d)},setNumBoids:e=>{L=Math.min(e,s.boidLimit)},setAvoidMouse:()=>{},dispose:()=>{m.abort();for(let e of V)e.dispose();s.dispose(),S.dispose(),v.shadow.dispose(),O.dispose(),A.dispose(),P.dispose()}}};export{Se as createSim};