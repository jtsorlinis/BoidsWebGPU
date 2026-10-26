const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/layer.vertex-DtTr2bD5.js","assets/shaderStore-D-XQlhUT.js","assets/layer.fragment-DHpflEIp.js","assets/computeShader-BqU1fTyk.js","assets/math.scalar.functions-D-i-XBaP.js","assets/index-C9rRbr8X.js","assets/index-9cKm52GS.css","assets/observable.pure-B5E8yEYx.js","assets/logger-CuBYPcDK.js","assets/math.vector.pure-Df2EE7-P.js","assets/performanceConfigurator-UtxC_Odd.js","assets/engineStore-e38OvQA7.js","assets/typeStore-Cu_sj2zM.js","assets/webRequest-dqz0dHXK.js","assets/precisionDate-CfCevjl-.js","assets/tools.pure-Cy3UKK-p.js","assets/timingTools-Cl86mJBG.js","assets/halfFloat-Ce77JD5z.js","assets/thinEngine.pure-pImFf_Ed.js","assets/internalTexture-2KuvHfRu.js","assets/decorators-N_-nrzB_.js","assets/baseTexture.pure-CO2Y1nxu.js","assets/math.color.pure-DMS9V8gs.js","assets/layer.vertex-VRdlUggn.js","assets/layer.fragment-mSfnN9eU.js","assets/helperFunctions-Cz12B3WM.js"])))=>i.map(i=>d[i]);
import{r as e,u as t}from"./math.scalar.functions-D-i-XBaP.js";import{t as n}from"./index-C9rRbr8X.js";import{t as r}from"./observable.pure-B5E8yEYx.js";import{Dt as i,Ft as a,Gt as o,J as s,K as c,Vt as l,Xt as u,a as d,i as f,in as p,n as m,ot as h,r as g,rn as _,st as v,t as y}from"./computeShader-BqU1fTyk.js";import{a as b,o as ee}from"./math.vector.pure-Df2EE7-P.js";import{t as x}from"./engineStore-e38OvQA7.js";import{n as S}from"./math.color.pure-DMS9V8gs.js";v();var C=e,te={...t,TwoPi:Math.PI*2,Sign:Math.sign,Log2:Math.log2,HCF:C},ne=class e extends p{constructor(e,t,n,r,i,a=!0,o=!1,s=3,c=0,l,u,d,f){super(null,i,!a,o,void 0,void 0,void 0,void 0,void 0,void 0,void 0,void 0,l),this.format=r,this._engine&&(!this._engine._caps.textureFloatLinearFiltering&&c===1&&(s=1),!this._engine._caps.textureHalfFloatLinearFiltering&&c===2&&(s=1),this._texture=this._engine.createRawTexture(e,t,n,r,a,o,s,null,c,l??0,u??!1,f),this.wrapU=p.CLAMP_ADDRESSMODE,this.wrapV=p.CLAMP_ADDRESSMODE,this._waitingForData=!!d&&!e)}update(e){this.updateMipLevel(e,0)}updateMipLevel(e,t){this._getEngine().updateRawTexture(this._texture,e,this._texture.format,this._texture.invertY,null,this._texture.type,this._texture._useSRGBBuffer,t),this._waitingForData=!1}clone(){if(!this._texture)return super.clone();let t=new e(null,this.getSize().width,this.getSize().height,this.format,this.getScene(),this._texture.generateMipMaps,this._invertY,this.samplingMode,this._texture.type,this._texture._creationFlags,this._useSRGBBuffer);return t._texture=this._texture,this._texture.incrementReferences(),t}isReady(){return super.isReady()&&!this._waitingForData}static CreateLuminanceTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,1,i,a,o,s)}static CreateLuminanceAlphaTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,2,i,a,o,s)}static CreateAlphaTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,0,i,a,o,s)}static CreateRGBTexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=0,u=!1){return new e(t,n,r,4,i,a,o,s,c,l,u)}static CreateRGBATexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=0,u=!1,d=!1){return new e(t,n,r,5,i,a,o,s,c,l,u,d)}static CreateRGBAStorageTexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=!1){return new e(t,n,r,5,i,a,o,s,c,1,l)}static CreateRTexture(t,n,r,i,a=!0,o=!1,s=p.TRILINEAR_SAMPLINGMODE,c=1){return new e(t,n,r,6,i,a,o,s,c)}static CreateRStorageTexture(t,n,r,i,a=!0,o=!1,s=p.TRILINEAR_SAMPLINGMODE,c=1){return new e(t,n,r,6,i,a,o,s,c,1)}};_();var w=class{constructor(e){this.name=a.NAME_LAYER,this.scene=e||x.LastCreatedScene,this.scene&&(this._engine=this.scene.getEngine())}register(){this.scene._beforeCameraDrawStage.registerStep(a.STEP_BEFORECAMERADRAW_LAYER,this,this._drawCameraBackground),this.scene._afterCameraDrawStage.registerStep(a.STEP_AFTERCAMERADRAW_LAYER,this,this._drawCameraForegroundWithPostProcessing),this.scene._afterCameraPostProcessStage.registerStep(a.STEP_AFTERCAMERAPOSTPROCESS_LAYER,this,this._drawCameraForegroundWithoutPostProcessing),this.scene._beforeRenderTargetDrawStage.registerStep(a.STEP_BEFORERENDERTARGETDRAW_LAYER,this,this._drawRenderTargetBackground),this.scene._afterRenderTargetDrawStage.registerStep(a.STEP_AFTERRENDERTARGETDRAW_LAYER,this,this._drawRenderTargetForegroundWithPostProcessing),this.scene._afterRenderTargetPostProcessStage.registerStep(a.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER,this,this._drawRenderTargetForegroundWithoutPostProcessing)}rebuild(){let e=this.scene.layers;for(let t of e)t._rebuild()}dispose(){let e=this.scene.layers;for(;e.length;)e[0].dispose()}_draw(e){let t=this.scene.layers;if(t.length){this._engine.setDepthBuffer(!1);for(let n of t)e(n)&&n.render();this._engine.setDepthBuffer(!0)}}_drawCameraPredicate(e,t,n,r){return!e.renderOnlyInRenderTargetTextures&&e.isBackground===t&&e.applyPostProcess===n&&(e.layerMask&r)!==0}_drawCameraBackground(e){this._draw(t=>this._drawCameraPredicate(t,!0,!0,e.layerMask))}_drawCameraForegroundWithPostProcessing(e){this._draw(t=>this._drawCameraPredicate(t,!1,!0,e.layerMask))}_drawCameraForegroundWithoutPostProcessing(e){this._draw(t=>this._drawCameraPredicate(t,!1,!1,e.layerMask))}_drawRenderTargetPredicate(e,t,n,r,i){return e.renderTargetTextures.length>0&&e.isBackground===t&&e.applyPostProcess===n&&e.renderTargetTextures.indexOf(i)>-1&&(e.layerMask&r)!==0}_drawRenderTargetBackground(e){this._draw(t=>this._drawRenderTargetPredicate(t,!0,!0,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}_drawRenderTargetForegroundWithPostProcessing(e){this._draw(t=>this._drawRenderTargetPredicate(t,!1,!0,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}_drawRenderTargetForegroundWithoutPostProcessing(e){this._draw(t=>this._drawRenderTargetPredicate(t,!1,!1,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}addFromContainer(e){if(e.layers)for(let t of e.layers)this.scene.layers.push(t)}removeFromContainer(e,t=!1){if(e.layers)for(let n of e.layers){let e=this.scene.layers.indexOf(n);e!==-1&&this.scene.layers.splice(e,1),t&&n.dispose()}}},T=class e{set applyPostProcess(e){this._applyPostProcess=e}get applyPostProcess(){return this.isBackground||this._applyPostProcess}set onDispose(e){this._onDisposeObserver&&this.onDisposeObservable.remove(this._onDisposeObserver),this._onDisposeObserver=this.onDisposeObservable.add(e)}set onBeforeRender(e){this._onBeforeRenderObserver&&this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver),this._onBeforeRenderObserver=this.onBeforeRenderObservable.add(e)}set onAfterRender(e){this._onAfterRenderObserver&&this.onAfterRenderObservable.remove(this._onAfterRenderObserver),this._onAfterRenderObserver=this.onAfterRenderObservable.add(e)}get shaderLanguage(){return this._shaderLanguage}constructor(t,n,i,o,s,c=!1){this.name=t,this._applyPostProcess=!0,this.scale=new b(1,1),this.offset=new b(0,0),this.alphaBlendingMode=2,this.layerMask=268435455,this.renderTargetTextures=[],this.renderOnlyInRenderTargetTextures=!1,this.convertToLinearSpace=!1,this.isEnabled=!0,this._vertexBuffers={},this.onDisposeObservable=new r,this.onBeforeRenderObservable=new r,this.onAfterRenderObservable=new r,this._shaderLanguage=0,this._shadersLoaded=!1,i||=x.LastCreatedScene,this.layerMask=i.defaultRenderableLayerMask,this.texture=n?new p(n,i,!0):null,this.isBackground=o===void 0||o,this.color=s===void 0?new S(1,1,1,1):s,this._scene=i;let d=this._scene.getEngine();d.isWebGPU&&!c&&!e.ForceGLSL&&(this._shaderLanguage=1);let f=this._scene._getComponent(a.NAME_LAYER);f||(f=new w(this._scene),this._scene._addComponent(f)),this._scene.layers.push(this),this._drawWrapper=new l(d);let m=[];m.push(1,1),m.push(-1,1),m.push(-1,-1),m.push(1,-1);let h=new u(d,m,u.PositionKind,!1,!1,2);this._vertexBuffers[u.PositionKind]=h,this._createIndexBuffer()}_createIndexBuffer(){let e=this._scene.getEngine(),t=[];t.push(0),t.push(1),t.push(2),t.push(0),t.push(2),t.push(3),this._indexBuffer=e.createIndexBuffer(t)}_rebuild(){let e=this._vertexBuffers[u.PositionKind];e&&e._rebuild(),this._createIndexBuffer()}isReady(){let e=this._scene.getEngine(),t=``;return this.alphaTest&&(t=`#define ALPHATEST`),this.texture&&(this.texture.gammaSpace?this.convertToLinearSpace&&(t+=`
#define CONVERT_TO_LINEAR`):this.convertToLinearSpace||(t+=`
#define CONVERT_TO_GAMMA`)),this._previousDefines!==t&&(this._previousDefines=t,this._drawWrapper.effect=e.createEffect(`layer`,[u.PositionKind],[`textureMatrix`,`color`,`scale`,`offset`],[`textureSampler`],t,void 0,void 0,void 0,void 0,this._shaderLanguage,this._shadersLoaded?void 0:async()=>{this._shaderLanguage===1?await Promise.all([n(()=>import(`./layer.vertex-DtTr2bD5.js`),__vite__mapDeps([0,1])),n(()=>import(`./layer.fragment-DHpflEIp.js`),__vite__mapDeps([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,1,19,20,21,22]))]):await Promise.all([n(()=>import(`./layer.vertex-VRdlUggn.js`),__vite__mapDeps([23,1])),n(()=>import(`./layer.fragment-mSfnN9eU.js`),__vite__mapDeps([24,1,25]))]),this._shadersLoaded=!0})),!!this._drawWrapper.effect?.isReady()&&(!this.texture||this.texture.isReady())}render(){if(!this.isEnabled)return;let e=this._scene.getEngine();if(!this.isReady())return;let t=this._drawWrapper.effect;this.onBeforeRenderObservable.notifyObservers(this),e.enableEffect(this._drawWrapper),e.setState(!1),this.texture&&(t.setTexture(`textureSampler`,this.texture),t.setMatrix(`textureMatrix`,this.texture.getTextureMatrix())),t.setFloat4(`color`,this.color.r,this.color.g,this.color.b,this.color.a),t.setVector2(`offset`,this.offset),t.setVector2(`scale`,this.scale),e.bindBuffers(this._vertexBuffers,this._indexBuffer,t),this.alphaTest?e.drawElementsType(d.TriangleFillMode,0,6):(e.setAlphaMode(this.alphaBlendingMode),e.drawElementsType(d.TriangleFillMode,0,6),e.setAlphaMode(0)),this.onAfterRenderObservable.notifyObservers(this)}dispose(){let e=this._vertexBuffers[u.PositionKind];e&&(e.dispose(),this._vertexBuffers[u.PositionKind]=null),this._indexBuffer&&=(this._scene.getEngine()._releaseBuffer(this._indexBuffer),null),this.texture&&=(this.texture.dispose(),null),this.renderTargetTextures=[];let t=this._scene.layers.indexOf(this);this._scene.layers.splice(t,1),this.onDisposeObservable.notifyObservers(this),this.onDisposeObservable.clear(),this.onAfterRenderObservable.clear(),this.onBeforeRenderObservable.clear()}};T.ForceGLSL=!1;var E=`#include<boidInclude>\r
\r
@binding(0) @group(0) var renderTarget : texture_storage_2d<rgba8unorm, write>;\r
@binding(1) @group(0) var<uniform> params : Params;\r
\r
const clearBlockSize : u32 = 8u;\r
const backgroundColour : vec4<f32> = vec4<f32>(0.19215687, 0.3019608, 0.4745098, 1.0);\r
\r
@compute @workgroup_size(clearBlockSize, clearBlockSize, 1)\r
fn main(@builtin(global_invocation_id) globalInvocationID : vec3<u32>) {\r
  let pixel = globalInvocationID.xy;\r
  if (pixel.x >= params.renderWidth || pixel.y >= params.renderHeight) {\r
    return;\r
  }\r
\r
  textureStore(renderTarget, vec2<i32>(pixel), backgroundColour);\r
}\r
`,D=`#include<boidInclude>\r
\r
@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;\r
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid>;\r
@binding(3) @group(0) var<storage, read> gridOffsets : array<u32>;\r
@binding(4) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;\r
@binding(5) @group(0) var<storage, read_write> grid : array<u32>;\r
\r
// Neighbour rows staged once per group, as (pos, vel)\r
var<workgroup> tile : array<vec4<f32>, tileSize>;\r
\r
fn addNeighbour(pos: vec2<f32>, otherPos: vec2<f32>, otherVel: vec2<f32>, center: ptr<function, vec2<f32>>, close: ptr<function, vec2<f32>>, avgVel: ptr<function, vec2<f32>>, neighbours: ptr<function, u32>) {\r
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
  // they search together is one run of boids, which is staged into the tile\r
  // when it fits\r
  for (var i: i32 = -1; i <= 1; i += 1) {\r
    let row = u32(i * i32(params.gridDimX));\r
    let start = gridOffsets[cell + row - 1u];\r
    let end = gridOffsets[cell + row + 2u];\r
    let tileStart = gridOffsets[firstCell + row - 1u];\r
    let tileCount = gridOffsets[lastCell + row + 2u] - tileStart;\r
    let tiled = tileCount <= tileSize;\r
\r
    workgroupBarrier();\r
    if (tiled) {\r
      for (var k = localID; k < tileCount; k += searchBlockSize) {\r
        let other = boidsIn[tileStart + k];\r
        tile[k] = vec4<f32>(other.pos, other.vel);\r
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
      for (; j < tileEnd; j += 1u) {\r
        let other = tile[j];\r
        addNeighbour(pos, other.xy, other.zw, &center, &close, &avgVel, &neighbours);\r
      }\r
    } else {\r
      for (var j = start; j < end; j += 1u) {\r
        let other = boidsIn[j];\r
        addNeighbour(pos, other.pos, other.vel, &center, &close, &avgVel, &neighbours);\r
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
  if (abs((*boid).pos.x) > params.xBound) {\r
    (*boid).vel.x -= sign((*boid).pos.x) * params.turnSpeed * params.dt;\r
  }\r
  if (abs((*boid).pos.y) > params.yBound) {\r
    (*boid).vel.y -= sign((*boid).pos.y) * params.turnSpeed * params.dt;\r
  }\r
}\r
\r
fn avoidPredators(boid: ptr<function, Boid>) {\r
  if(distance((*boid).pos, params.mousePos) < params.zoom\r
      && abs((*boid).pos.y) < params.yBound\r
      && abs((*boid).pos.x) < params.xBound) {\r
      let dist = max(sqrt(params.minDistanceSq), distance((*boid).pos, params.mousePos) / params.zoom);\r
      let force = normalize((*boid).pos - params.mousePos) / pow(dist,2);\r
      (*boid).vel += force * params.dt;\r
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
  var boid = boidsIn[min(index, last)];\r
  let firstCell = getGridID(boidsIn[first].pos);\r
  let lastCell = getGridID(boidsIn[last].pos);\r
\r
  mergedBehaviours(&boid, localID, firstCell, lastCell);\r
  limitSpeed(&boid);\r
  keepInBounds(&boid);\r
  if (params.avoidMouse > 0) {\r
    avoidPredators(&boid);\r
  }\r
\r
  boid.pos += boid.vel * params.dt;\r
\r
  if (index < params.numBoids) {\r
    boids[index] = boid;\r
\r
    // Bin the boid into next frame's grid, saving a separate update grid pass\r
    grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);\r
  }\r
}\r
`,O=`#include<boidInclude>\r
\r
@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;\r
@binding(2) @group(0) var<storage, read_write> gridOffsets : array<atomic<u32>>;\r
@binding(3) @group(0) var<storage, read_write> grid : array<u32>;\r
\r
// Stateless random generation\r
fn pcg_hash(input: u32) -> u32 {\r
  let state = input * 747796405u + 2891336453u;\r
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;\r
  return (word >> 22u) ^ word;\r
}\r
\r
fn rand_pcg(input: u32, min: f32, max: f32) -> f32 {\r
  let float = f32(pcg_hash(input)) / 4294967296.0;\r
  return float * (max - min) + min;\r
}\r
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
  boids[index] = boid;\r
\r
  // Bin into the first frame's grid, after that the boids kernel keeps it up to date\r
  grid[index] = atomicAdd(&gridOffsets[getGridID(boid.pos)], 1u);\r
}\r
`,k=`#include<boidInclude>\r
#include<scanInclude>\r
\r
@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> gridOffsetsIn : array<u32>;\r
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;\r
@binding(3) @group(0) var<storage, read> gridSums : array<u32>;\r
\r
// Scans each block of cells, starting from the block's offset from scanSums\r
@compute @workgroup_size(blockSize)\r
fn main(@builtin(local_invocation_index) localID : u32, @builtin(workgroup_id) GroupID : vec3<u32>) {\r
  let groupID = GroupID.x;\r
\r
  var counts = vec4<u32>();\r
  for (var row = 0u; row < 4u; row += 1u) {\r
    let cell = getCell(groupID, localID, row);\r
    if (cell < params.gridTotalCells) {\r
      counts[row] = gridOffsetsIn[cell];\r
    }\r
  }\r
\r
  var total = 0u;\r
  let offsets = groupScan(counts, localID, &total) + gridSums[groupID];\r
  for (var row = 0u; row < 4u; row += 1u) {\r
    let cell = getCell(groupID, localID, row);\r
    if (cell < params.gridTotalCells) {\r
      gridOffsetsOut[cell] = offsets[row];\r
      // Reset the counts so the boids kernel can fill them in for next frame\r
      gridOffsetsIn[cell] = 0u;\r
    }\r
  }\r
}\r
`,A=`#include<boidInclude>\r
\r
@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read> grid : array<u32>;\r
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;\r
@binding(3) @group(0) var<storage, read> boidsIn : array<Boid>;\r
@binding(4) @group(0) var<storage, read_write> boidsOut : array<Boid>;\r
@binding(5) @group(0) var renderTarget : texture_storage_2d<rgba8unorm, write>;\r
\r
const boidScale : f32 = 0.1;\r
const boidTriangle0 : vec2<f32> = vec2<f32>(-0.4, -0.5) * boidScale;\r
const boidTriangle1 : vec2<f32> = vec2<f32>(0.0, 0.5) * boidScale;\r
const boidTriangle2 : vec2<f32> = vec2<f32>(0.4, -0.5) * boidScale;\r
\r
fn edge(a: vec2<f32>, b: vec2<f32>, p: vec2<f32>) -> f32 {\r
  let ab = b - a;\r
  let ap = p - a;\r
  return ap.x * ab.y - ap.y * ab.x;\r
}\r
\r
fn rotateLocalVertex(vertex: vec2<f32>, velocity: vec2<f32>) -> vec2<f32> {\r
  let speedSq = dot(velocity, velocity);\r
  if (speedSq <= 1e-8) {\r
    return vertex;\r
  }\r
\r
  let dir = velocity * inverseSqrt(speedSq);\r
  return vec2<f32>(\r
    vertex.x * dir.y + vertex.y * dir.x,\r
    vertex.y * dir.y - vertex.x * dir.x\r
  );\r
}\r
\r
fn worldToScreen(worldPos: vec2<f32>) -> vec2<f32> {\r
  let rasterSize = vec2<f32>(f32(params.renderWidth), f32(params.renderHeight));\r
  let screenScale = rasterSize / (params.viewportHalfSize * 2.0);\r
  let screenOffset = rasterSize * 0.5 - params.cameraPos * screenScale;\r
  return worldPos * screenScale + screenOffset;\r
}\r
\r
fn getBoidColour(boid: Boid) -> vec4<f32> {\r
  var d = 1.0;\r
  if (params.avoidMouse > 0u) {\r
    d = distance(boid.pos, params.mousePos) / params.zoom;\r
  }\r
  return vec4<f32>(1.0, d, d, 1.0);\r
}\r
\r
fn rasterizeBoid(boid: Boid) {\r
  let v0 = worldToScreen(rotateLocalVertex(boidTriangle0, boid.vel) + boid.pos);\r
  let v1 = worldToScreen(rotateLocalVertex(boidTriangle1, boid.vel) + boid.pos);\r
  let v2 = worldToScreen(rotateLocalVertex(boidTriangle2, boid.vel) + boid.pos);\r
\r
  let minBounds = floor(min(v0, min(v1, v2)));\r
  let maxBounds = ceil(max(v0, max(v1, v2)));\r
  if (\r
    maxBounds.x < 0.0 ||\r
    maxBounds.y < 0.0 ||\r
    minBounds.x >= f32(params.renderWidth) ||\r
    minBounds.y >= f32(params.renderHeight)\r
  ) {\r
    return;\r
  }\r
\r
  let minX = max(0, i32(minBounds.x));\r
  let minY = max(0, i32(minBounds.y));\r
  let maxX = min(i32(params.renderWidth) - 1, i32(maxBounds.x));\r
  let maxY = min(i32(params.renderHeight) - 1, i32(maxBounds.y));\r
  if (minX > maxX || minY > maxY) {\r
    return;\r
  }\r
\r
  // Rotating and scaling to the screen keep the winding, so the area is\r
  // always positive unless the triangle is too small to cover a pixel\r
  let area = edge(v0, v1, v2);\r
  if (area <= 1e-5) {\r
    return;\r
  }\r
\r
  let pixelStart = vec2<f32>(f32(minX) + 0.5, f32(minY) + 0.5);\r
  var w0Row = edge(v1, v2, pixelStart);\r
  var w1Row = edge(v2, v0, pixelStart);\r
  var w2Row = edge(v0, v1, pixelStart);\r
\r
  let w0StepX = v2.y - v1.y;\r
  let w1StepX = v0.y - v2.y;\r
  let w2StepX = v1.y - v0.y;\r
  let w0StepY = v1.x - v2.x;\r
  let w1StepY = v2.x - v0.x;\r
  let w2StepY = v0.x - v1.x;\r
  let colour = getBoidColour(boid);\r
\r
  for (var y = minY; y <= maxY; y += 1) {\r
    var w0 = w0Row;\r
    var w1 = w1Row;\r
    var w2 = w2Row;\r
\r
    for (var x = minX; x <= maxX; x += 1) {\r
      if (w0 >= 0.0 && w1 >= 0.0 && w2 >= 0.0) {\r
        textureStore(renderTarget, vec2<i32>(x, y), colour);\r
      }\r
\r
      w0 += w0StepX;\r
      w1 += w1StepX;\r
      w2 += w2StepX;\r
    }\r
\r
    w0Row += w0StepY;\r
    w1Row += w1StepY;\r
    w2Row += w2StepY;\r
  }\r
}\r
\r
@compute @workgroup_size(boidBlockSize)\r
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {\r
  let index = getBoidIndex(GlobalInvocationID);\r
\r
  if (index >= params.numBoids) {\r
    return;\r
  }\r
\r
  let boid = boidsIn[index];\r
  let newIndex = gridOffsets[getGridID(boid.pos)] + grid[index];\r
  boidsOut[newIndex] = boid;\r
\r
  // Drawing here saves a separate pass over every boid\r
  rasterizeBoid(boid);\r
}\r
`,j=`#include<boidInclude>\r
#include<scanInclude>\r
\r
@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> gridSums : array<u32>;\r
\r
// Single group, turns the block totals into block offsets in place\r
@compute @workgroup_size(blockSize)\r
fn main(@builtin(local_invocation_index) localID : u32) {\r
  var carry = 0u;\r
  for (var first = 0u; first < params.blocks; first += blockCells) {\r
    var sums = vec4<u32>();\r
    for (var row = 0u; row < 4u; row += 1u) {\r
      let i = first + row * blockSize + localID;\r
      if (i < params.blocks) {\r
        sums[row] = gridSums[i];\r
      }\r
    }\r
\r
    var total = 0u;\r
    let offsets = groupScan(sums, localID, &total) + carry;\r
    for (var row = 0u; row < 4u; row += 1u) {\r
      let i = first + row * blockSize + localID;\r
      if (i < params.blocks) {\r
        gridSums[i] = offsets[row];\r
      }\r
    }\r
    carry += total;\r
  }\r
}\r
`,M=`#include<boidInclude>\r
#include<scanInclude>\r
\r
@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;\r
@binding(2) @group(0) var<storage, read_write> gridSums : array<u32>;\r
\r
var<workgroup> sumTemp : array<u32, blockSize>;\r
\r
@compute @workgroup_size(blockSize)\r
fn main(@builtin(local_invocation_index) localID : u32, @builtin(workgroup_id) GroupID : vec3<u32>) {\r
  let groupID = GroupID.x;\r
\r
  var sum = 0u;\r
  for (var row = 0u; row < 4u; row += 1u) {\r
    let cell = getCell(groupID, localID, row);\r
    if (cell < params.gridTotalCells) {\r
      sum += gridOffsetsIn[cell];\r
    }\r
  }\r
  sumTemp[localID] = sum;\r
  workgroupBarrier();\r
\r
  for (var stride = blockSize / 2u; stride > 0u; stride /= 2u) {\r
    if (localID < stride) {\r
      sumTemp[localID] += sumTemp[localID + stride];\r
    }\r
    workgroupBarrier();\r
  }\r
\r
  if (localID == 0u) {\r
    gridSums[groupID] = sumTemp[0];\r
  }\r
}\r
`,re=e=>({clearRasterComputeShader:new y(`clearRaster`,e,{computeSource:E},{bindingsMapping:{renderTarget:{group:0,binding:0},params:{group:0,binding:1}}}),generateBoidsComputeShader:new y(`generateBoids`,e,{computeSource:O},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},gridOffsets:{group:0,binding:2},grid:{group:0,binding:3}}}),boidComputeShader:new y(`boids`,e,{computeSource:D},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},boidsIn:{group:0,binding:2},gridOffsets:{group:0,binding:3},gridOffsetsIn:{group:0,binding:4},grid:{group:0,binding:5}}}),sumBlocksComputeShader:new y(`sumBlocks`,e,{computeSource:M},{bindingsMapping:{params:{group:0,binding:0},gridOffsetsIn:{group:0,binding:1},gridSums:{group:0,binding:2}}}),scanSumsComputeShader:new y(`scanSums`,e,{computeSource:j},{bindingsMapping:{params:{group:0,binding:0},gridSums:{group:0,binding:1}}}),prefixSumComputeShader:new y(`prefixSum`,e,{computeSource:k},{bindingsMapping:{params:{group:0,binding:0},gridOffsetsIn:{group:0,binding:1},gridOffsetsOut:{group:0,binding:2},gridSums:{group:0,binding:3}}}),rearrangeBoidsComputeShader:new y(`rearrangeBoids`,e,{computeSource:A},{bindingsMapping:{params:{group:0,binding:0},grid:{group:0,binding:1},gridOffsets:{group:0,binding:2},boidsIn:{group:0,binding:3},boidsOut:{group:0,binding:4},renderTarget:{group:0,binding:5}}})}),N=async()=>{let e=32,t=.5,n=.5,r=.15,a=document.getElementById(`renderCanvas`),l=document.getElementById(`boidText`),u=document.getElementById(`boidSlider`),d=document.getElementById(`avoidToggle`);d.checked=!1;let _=document.getElementById(`fpsText`),v=new s(a,{setMaximumLimits:!0,enableAllFeatures:!0});await v.initAsync(),document.getElementById(`loader`)?.remove(),f();let y=v.currentLimits.maxComputeWorkgroupsPerDimension,b=Math.min(v.currentLimits.maxStorageBufferBindingSize,v.currentLimits.maxBufferSize),x=Math.min(1024*y,Math.floor(b/16));u.max=Math.ceil(Math.log2(x)).toString();let C,w,E,D,O,k=re(v),{clearRasterComputeShader:A,generateBoidsComputeShader:j,boidComputeShader:M,sumBlocksComputeShader:N,scanSumsComputeShader:P,prefixSumComputeShader:F,rearrangeBoidsComputeShader:I}=k;await Promise.all(Object.values(k).map(e=>new Promise(t=>{let n=()=>e.isReady()?t():setTimeout(n,10);n()})));let L,R,z,B,V,H,U,W,G,K,q,J,Y,X=null,Z=0,Q=0,$=new o(v,void 0,!1,`params`);$.addUniform(`numBoids`,1),$.addUniform(`xBound`,1),$.addUniform(`yBound`,1),$.addUniform(`maxSpeed`,1),$.addUniform(`minSpeed`,1),$.addUniform(`turnSpeed`,1),$.addUniform(`visualRangeSq`,1),$.addUniform(`minDistanceSq`,1),$.addUniform(`cohesionFactor`,1),$.addUniform(`alignmentFactor`,1),$.addUniform(`separationFactor`,1),$.addUniform(`dt`,1),$.addUniform(`gridDimX`,1),$.addUniform(`gridDimY`,1),$.addUniform(`gridInverseCellSize`,1),$.addUniform(`gridTotalCells`,1),$.addUniform(`boidStride`,1),$.addUniform(`updateGroupsX`,1),$.addUniform(`rngSeed`,1),$.addUniform(`blocks`,1),$.addUniform(`avoidMouse`,1),$.addUniform(`zoom`,1),$.addFloat2(`mousePos`,0,0),$.addUniform(`renderWidth`,1),$.addUniform(`renderHeight`,1),$.addFloat2(`viewportHalfSize`,0,0),$.addFloat2(`cameraPos`,0,0);let ie=()=>{D=v.getRenderWidth()/v.getRenderHeight(),$.updateUInt(`renderWidth`,v.getRenderWidth()),$.updateUInt(`renderHeight`,v.getRenderHeight()),$.updateFloat2(`viewportHalfSize`,E*D,E),$.updateFloat2(`cameraPos`,O.position.x,O.position.y)},ae=()=>{let e=v.getRenderWidth(),t=v.getRenderHeight();if(X&&Z===e&&Q===t)return;let n=ne.CreateRGBAStorageTexture(null,e,t,C,!1,!1,p.NEAREST_NEAREST);n.wrapU=p.CLAMP_ADDRESSMODE,n.wrapV=p.CLAMP_ADDRESSMODE;let r=X;X=n,Z=e,Q=t,Y.texture=X,A.setStorageTexture(`renderTarget`,X),I.setStorageTexture(`renderTarget`,X),r?.dispose()},oe=()=>{l.innerHTML=`Boids: ${e}`,C=new i(v),C.clearColor.fromHexString(`#314D79`),O=new h(`camera1`,new ee(0,0,-5),C),O.mode=1,D=v.getRenderWidth()/v.getRenderHeight(),E=Math.max(2,Math.sqrt(e)/10+t),w=E,O.orthoBottom=-E,O.orthoTop=E,O.orthoLeft=-E*D,O.orthoRight=E*D;let a=E*D-t,o=E-t,s=Math.floor(a*2/n)+30,u=Math.floor(o*2/n)+30;U=s*u,W=Math.ceil(U/m),[G,K]=g(e,256,y),[q,J]=g(e,128,y),L=new c(v,e*16),R=new c(v,e*16),Y=new T(`rasterLayer`,null,C,!1,new S(1,1,1,1)),Y.texture=null,$.updateUInt(`numBoids`,e),$.updateFloat(`xBound`,a),$.updateFloat(`yBound`,o),$.updateFloat(`maxSpeed`,2),$.updateFloat(`minSpeed`,1.5),$.updateFloat(`turnSpeed`,6),$.updateFloat(`visualRangeSq`,n*n),$.updateFloat(`minDistanceSq`,r*r),$.updateFloat(`cohesionFactor`,2),$.updateFloat(`alignmentFactor`,5),$.updateFloat(`separationFactor`,1),$.updateUInt(`gridDimX`,s),$.updateUInt(`gridDimY`,u),$.updateFloat(`gridInverseCellSize`,1/n),$.updateUInt(`gridTotalCells`,U),$.updateUInt(`boidStride`,G*256),$.updateUInt(`updateGroupsX`,q),$.updateUInt(`rngSeed`,Math.floor(Math.random()*1e7)),$.updateUInt(`blocks`,W),ie(),$.update(),z=new c(v,e*4),B=new c(v,U*4),V=new c(v,U*4),H=new c(v,W*4),A.setUniformBuffer(`params`,$),N.setUniformBuffer(`params`,$),N.setStorageBuffer(`gridOffsetsIn`,B),N.setStorageBuffer(`gridSums`,H),P.setUniformBuffer(`params`,$),P.setStorageBuffer(`gridSums`,H),F.setUniformBuffer(`params`,$),F.setStorageBuffer(`gridOffsetsOut`,V),F.setStorageBuffer(`gridOffsetsIn`,B),F.setStorageBuffer(`gridSums`,H),I.setUniformBuffer(`params`,$),I.setStorageBuffer(`grid`,z),I.setStorageBuffer(`gridOffsets`,V),I.setStorageBuffer(`boidsIn`,L),I.setStorageBuffer(`boidsOut`,R),M.setUniformBuffer(`params`,$),M.setStorageBuffer(`boidsIn`,R),M.setStorageBuffer(`boids`,L),M.setStorageBuffer(`gridOffsets`,V),M.setStorageBuffer(`gridOffsetsIn`,B),M.setStorageBuffer(`grid`,z),ae(),j.setUniformBuffer(`params`,$),j.setStorageBuffer(`boids`,L),j.setStorageBuffer(`gridOffsets`,B),j.setStorageBuffer(`grid`,z),j.dispatch(G,K,1)},se=()=>{X?.dispose(),C.dispose(),L.dispose(),R.dispose(),z.dispose(),B.dispose(),V.dispose(),H.dispose(),X=null,Z=0,Q=0};oe(),a.onwheel=e=>{let t=e.deltaY*E*.001;w+t>1&&(w+=t)},a.onpointermove=e=>{let t=a.getBoundingClientRect(),n=((e.clientX-t.left)/t.width-.5)*E*2*D+O.position.x,r=-((e.clientY-t.top)/t.height-.5)*E*2+O.position.y;$.updateFloat2(`mousePos`,n,r),$.update(),e.buttons&&(O.position.x-=e.movementX*.002*E,O.position.y+=e.movementY*.002*E)},u.oninput=()=>{e=Math.round(2**u.valueAsNumber),e>x&&(e=x),se(),oe()};let ce;window.onresize=()=>{clearTimeout(ce),ce=setTimeout(function(){v.resize(),D=v.getRenderWidth()/v.getRenderHeight(),O.orthoBottom=-E,O.orthoTop=E,O.orthoLeft=-E*D,O.orthoRight=E*D},100)},d.onclick=()=>{$.updateUInt(`avoidMouse`,+!!d.checked),$.update()};let le=()=>{if(Math.abs(E-w)>.01){let e=v.getAspectRatio(O);E=te.Lerp(E,w,.1),O.orthoBottom=-E,O.orthoTop=E,O.orthoLeft=-E*e,O.orthoRight=E*e}};return v.runRenderLoop(()=>{let e=v.getFps();_.innerHTML=`FPS: ${e.toFixed(2)}`,le(),ae(),$.updateFloat(`dt`,Math.min(v.getDeltaTime()/1e3,1/3)),$.updateFloat(`zoom`,E/3),ie(),$.update(),A.dispatch(Math.ceil(Z/8),Math.ceil(Q/8),1),N.dispatch(W,1,1),P.dispatch(1,1,1),F.dispatch(W,1,1),I.dispatch(G,K,1),M.dispatch(q,J,1),C.render()}),v};export{N as boids2d};