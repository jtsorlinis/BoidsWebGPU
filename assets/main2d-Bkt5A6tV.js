const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/layer.vertex-DtTr2bD5.js","assets/shaderStore-D-XQlhUT.js","assets/layer.fragment-DG-706Wv.js","assets/computeShader-jorWYsE8.js","assets/math.scalar.functions-D-i-XBaP.js","assets/index-DOd6hMox.js","assets/index-9cKm52GS.css","assets/observable.pure-B5E8yEYx.js","assets/logger-CuBYPcDK.js","assets/math.vector.pure-Df2EE7-P.js","assets/performanceConfigurator-UtxC_Odd.js","assets/engineStore-e38OvQA7.js","assets/typeStore-Cu_sj2zM.js","assets/webRequest-dqz0dHXK.js","assets/precisionDate-CfCevjl-.js","assets/tools.pure-Cy3UKK-p.js","assets/timingTools-Cl86mJBG.js","assets/halfFloat-Ce77JD5z.js","assets/thinEngine.pure-pImFf_Ed.js","assets/internalTexture-2KuvHfRu.js","assets/decorators-N_-nrzB_.js","assets/baseTexture.pure-CO2Y1nxu.js","assets/math.color.pure-DMS9V8gs.js","assets/layer.vertex-VRdlUggn.js","assets/layer.fragment-mSfnN9eU.js","assets/helperFunctions-Cz12B3WM.js"])))=>i.map(i=>d[i]);
import{r as e,u as t}from"./math.scalar.functions-D-i-XBaP.js";import{t as n}from"./index-DOd6hMox.js";import{t as r}from"./observable.pure-B5E8yEYx.js";import{Jt as i,K as a,Nt as o,Tt as s,Ut as c,W as l,at as u,it as d,n as f,nn as p,r as m,t as h,tn as g,zt as _}from"./computeShader-jorWYsE8.js";import{a as v,o as ee}from"./math.vector.pure-Df2EE7-P.js";import{t as y}from"./engineStore-e38OvQA7.js";import{n as b}from"./math.color.pure-DMS9V8gs.js";u();var x=e,te={...t,TwoPi:Math.PI*2,Sign:Math.sign,Log2:Math.log2,HCF:x},ne=class e extends p{constructor(e,t,n,r,i,a=!0,o=!1,s=3,c=0,l,u,d,f){super(null,i,!a,o,void 0,void 0,void 0,void 0,void 0,void 0,void 0,void 0,l),this.format=r,this._engine&&(!this._engine._caps.textureFloatLinearFiltering&&c===1&&(s=1),!this._engine._caps.textureHalfFloatLinearFiltering&&c===2&&(s=1),this._texture=this._engine.createRawTexture(e,t,n,r,a,o,s,null,c,l??0,u??!1,f),this.wrapU=p.CLAMP_ADDRESSMODE,this.wrapV=p.CLAMP_ADDRESSMODE,this._waitingForData=!!d&&!e)}update(e){this.updateMipLevel(e,0)}updateMipLevel(e,t){this._getEngine().updateRawTexture(this._texture,e,this._texture.format,this._texture.invertY,null,this._texture.type,this._texture._useSRGBBuffer,t),this._waitingForData=!1}clone(){if(!this._texture)return super.clone();let t=new e(null,this.getSize().width,this.getSize().height,this.format,this.getScene(),this._texture.generateMipMaps,this._invertY,this.samplingMode,this._texture.type,this._texture._creationFlags,this._useSRGBBuffer);return t._texture=this._texture,this._texture.incrementReferences(),t}isReady(){return super.isReady()&&!this._waitingForData}static CreateLuminanceTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,1,i,a,o,s)}static CreateLuminanceAlphaTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,2,i,a,o,s)}static CreateAlphaTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,0,i,a,o,s)}static CreateRGBTexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=0,u=!1){return new e(t,n,r,4,i,a,o,s,c,l,u)}static CreateRGBATexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=0,u=!1,d=!1){return new e(t,n,r,5,i,a,o,s,c,l,u,d)}static CreateRGBAStorageTexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=!1){return new e(t,n,r,5,i,a,o,s,c,1,l)}static CreateRTexture(t,n,r,i,a=!0,o=!1,s=p.TRILINEAR_SAMPLINGMODE,c=1){return new e(t,n,r,6,i,a,o,s,c)}static CreateRStorageTexture(t,n,r,i,a=!0,o=!1,s=p.TRILINEAR_SAMPLINGMODE,c=1){return new e(t,n,r,6,i,a,o,s,c,1)}};g();var S=class{constructor(e){this.name=o.NAME_LAYER,this.scene=e||y.LastCreatedScene,this.scene&&(this._engine=this.scene.getEngine())}register(){this.scene._beforeCameraDrawStage.registerStep(o.STEP_BEFORECAMERADRAW_LAYER,this,this._drawCameraBackground),this.scene._afterCameraDrawStage.registerStep(o.STEP_AFTERCAMERADRAW_LAYER,this,this._drawCameraForegroundWithPostProcessing),this.scene._afterCameraPostProcessStage.registerStep(o.STEP_AFTERCAMERAPOSTPROCESS_LAYER,this,this._drawCameraForegroundWithoutPostProcessing),this.scene._beforeRenderTargetDrawStage.registerStep(o.STEP_BEFORERENDERTARGETDRAW_LAYER,this,this._drawRenderTargetBackground),this.scene._afterRenderTargetDrawStage.registerStep(o.STEP_AFTERRENDERTARGETDRAW_LAYER,this,this._drawRenderTargetForegroundWithPostProcessing),this.scene._afterRenderTargetPostProcessStage.registerStep(o.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER,this,this._drawRenderTargetForegroundWithoutPostProcessing)}rebuild(){let e=this.scene.layers;for(let t of e)t._rebuild()}dispose(){let e=this.scene.layers;for(;e.length;)e[0].dispose()}_draw(e){let t=this.scene.layers;if(t.length){this._engine.setDepthBuffer(!1);for(let n of t)e(n)&&n.render();this._engine.setDepthBuffer(!0)}}_drawCameraPredicate(e,t,n,r){return!e.renderOnlyInRenderTargetTextures&&e.isBackground===t&&e.applyPostProcess===n&&(e.layerMask&r)!==0}_drawCameraBackground(e){this._draw(t=>this._drawCameraPredicate(t,!0,!0,e.layerMask))}_drawCameraForegroundWithPostProcessing(e){this._draw(t=>this._drawCameraPredicate(t,!1,!0,e.layerMask))}_drawCameraForegroundWithoutPostProcessing(e){this._draw(t=>this._drawCameraPredicate(t,!1,!1,e.layerMask))}_drawRenderTargetPredicate(e,t,n,r,i){return e.renderTargetTextures.length>0&&e.isBackground===t&&e.applyPostProcess===n&&e.renderTargetTextures.indexOf(i)>-1&&(e.layerMask&r)!==0}_drawRenderTargetBackground(e){this._draw(t=>this._drawRenderTargetPredicate(t,!0,!0,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}_drawRenderTargetForegroundWithPostProcessing(e){this._draw(t=>this._drawRenderTargetPredicate(t,!1,!0,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}_drawRenderTargetForegroundWithoutPostProcessing(e){this._draw(t=>this._drawRenderTargetPredicate(t,!1,!1,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}addFromContainer(e){if(e.layers)for(let t of e.layers)this.scene.layers.push(t)}removeFromContainer(e,t=!1){if(e.layers)for(let n of e.layers){let e=this.scene.layers.indexOf(n);e!==-1&&this.scene.layers.splice(e,1),t&&n.dispose()}}},C=class e{set applyPostProcess(e){this._applyPostProcess=e}get applyPostProcess(){return this.isBackground||this._applyPostProcess}set onDispose(e){this._onDisposeObserver&&this.onDisposeObservable.remove(this._onDisposeObserver),this._onDisposeObserver=this.onDisposeObservable.add(e)}set onBeforeRender(e){this._onBeforeRenderObserver&&this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver),this._onBeforeRenderObserver=this.onBeforeRenderObservable.add(e)}set onAfterRender(e){this._onAfterRenderObserver&&this.onAfterRenderObservable.remove(this._onAfterRenderObserver),this._onAfterRenderObserver=this.onAfterRenderObservable.add(e)}get shaderLanguage(){return this._shaderLanguage}constructor(t,n,a,s,c,l=!1){this.name=t,this._applyPostProcess=!0,this.scale=new v(1,1),this.offset=new v(0,0),this.alphaBlendingMode=2,this.layerMask=268435455,this.renderTargetTextures=[],this.renderOnlyInRenderTargetTextures=!1,this.convertToLinearSpace=!1,this.isEnabled=!0,this._vertexBuffers={},this.onDisposeObservable=new r,this.onBeforeRenderObservable=new r,this.onAfterRenderObservable=new r,this._shaderLanguage=0,this._shadersLoaded=!1,a||=y.LastCreatedScene,this.layerMask=a.defaultRenderableLayerMask,this.texture=n?new p(n,a,!0):null,this.isBackground=s===void 0||s,this.color=c===void 0?new b(1,1,1,1):c,this._scene=a;let u=this._scene.getEngine();u.isWebGPU&&!l&&!e.ForceGLSL&&(this._shaderLanguage=1);let d=this._scene._getComponent(o.NAME_LAYER);d||(d=new S(this._scene),this._scene._addComponent(d)),this._scene.layers.push(this),this._drawWrapper=new _(u);let f=[];f.push(1,1),f.push(-1,1),f.push(-1,-1),f.push(1,-1);let m=new i(u,f,i.PositionKind,!1,!1,2);this._vertexBuffers[i.PositionKind]=m,this._createIndexBuffer()}_createIndexBuffer(){let e=this._scene.getEngine(),t=[];t.push(0),t.push(1),t.push(2),t.push(0),t.push(2),t.push(3),this._indexBuffer=e.createIndexBuffer(t)}_rebuild(){let e=this._vertexBuffers[i.PositionKind];e&&e._rebuild(),this._createIndexBuffer()}isReady(){let e=this._scene.getEngine(),t=``;return this.alphaTest&&(t=`#define ALPHATEST`),this.texture&&(this.texture.gammaSpace?this.convertToLinearSpace&&(t+=`
#define CONVERT_TO_LINEAR`):this.convertToLinearSpace||(t+=`
#define CONVERT_TO_GAMMA`)),this._previousDefines!==t&&(this._previousDefines=t,this._drawWrapper.effect=e.createEffect(`layer`,[i.PositionKind],[`textureMatrix`,`color`,`scale`,`offset`],[`textureSampler`],t,void 0,void 0,void 0,void 0,this._shaderLanguage,this._shadersLoaded?void 0:async()=>{this._shaderLanguage===1?await Promise.all([n(()=>import(`./layer.vertex-DtTr2bD5.js`),__vite__mapDeps([0,1])),n(()=>import(`./layer.fragment-DG-706Wv.js`),__vite__mapDeps([2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,1,19,20,21,22]))]):await Promise.all([n(()=>import(`./layer.vertex-VRdlUggn.js`),__vite__mapDeps([23,1])),n(()=>import(`./layer.fragment-mSfnN9eU.js`),__vite__mapDeps([24,1,25]))]),this._shadersLoaded=!0})),!!this._drawWrapper.effect?.isReady()&&(!this.texture||this.texture.isReady())}render(){if(!this.isEnabled)return;let e=this._scene.getEngine();if(!this.isReady())return;let t=this._drawWrapper.effect;this.onBeforeRenderObservable.notifyObservers(this),e.enableEffect(this._drawWrapper),e.setState(!1),this.texture&&(t.setTexture(`textureSampler`,this.texture),t.setMatrix(`textureMatrix`,this.texture.getTextureMatrix())),t.setFloat4(`color`,this.color.r,this.color.g,this.color.b,this.color.a),t.setVector2(`offset`,this.offset),t.setVector2(`scale`,this.scale),e.bindBuffers(this._vertexBuffers,this._indexBuffer,t),this.alphaTest?e.drawElementsType(m.TriangleFillMode,0,6):(e.setAlphaMode(this.alphaBlendingMode),e.drawElementsType(m.TriangleFillMode,0,6),e.setAlphaMode(0)),this.onAfterRenderObservable.notifyObservers(this)}dispose(){let e=this._vertexBuffers[i.PositionKind];e&&(e.dispose(),this._vertexBuffers[i.PositionKind]=null),this._indexBuffer&&=(this._scene.getEngine()._releaseBuffer(this._indexBuffer),null),this.texture&&=(this.texture.dispose(),null),this.renderTargetTextures=[];let t=this._scene.layers.indexOf(this);this._scene.layers.splice(t,1),this.onDisposeObservable.notifyObservers(this),this.onDisposeObservable.clear(),this.onAfterRenderObservable.clear(),this.onBeforeRenderObservable.clear()}};C.ForceGLSL=!1;var w=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridSumsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;


@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, @builtin(workgroup_id) GroupID: vec3<u32>) {
  let globalID : u32 = GlobalInvocationID.x;
  let groupID : u32 = GroupID.x;

 if (groupID == 0u || globalID >= params.gridTotalCells) {
    return;
  }
  gridOffsetsOut[globalID] += gridSumsIn[groupID - 1];
}
`,T=`#include<boidInclude>

@binding(0) @group(0) var renderTarget : texture_storage_2d<rgba8unorm, write>;
@binding(1) @group(0) var<uniform> params : Params;

const clearBlockSize : u32 = 8u;
const backgroundColour : vec4<f32> = vec4<f32>(0.19215687, 0.3019608, 0.4745098, 1.0);

@compute @workgroup_size(clearBlockSize, clearBlockSize, 1)
fn main(@builtin(global_invocation_id) globalInvocationID : vec3<u32>) {
  let pixel = globalInvocationID.xy;
  if (pixel.x >= params.renderWidth || pixel.y >= params.renderHeight) {
    return;
  }

  textureStore(renderTarget, vec2<i32>(pixel), backgroundColour);
}
`,E=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(3) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(4) @group(0) var<storage, read_write> gridOffsetsIn : array<atomic<u32>>;
@binding(5) @group(0) var<storage, read_write> grid : array<u32>;

fn mergedBehaviours(boid: ptr<function,Boid>) {
  var center : vec2<f32> = vec2<f32>();
  var close : vec2<f32> = vec2<f32>();
  var avgVel : vec2<f32> = vec2<f32>();
  var neighbours: u32 = 0u;

  let cell = getGridID((*boid).pos);
  let visualRangeSq = params.visualRangeSq;
  let minDistanceSq = params.minDistanceSq;

  // Loop around own cell.
  for (var row: i32 = -1; row <= 1; row += 1) {
    let y = u32(i32(cell) + row * i32(params.gridDimX));
    let start = gridOffsets[y - 1u];
    let end = gridOffsets[y + 2u];

    for (var i = start; i < end; i += 1) {
      let other = boidsIn[i];
      let diff = (*boid).pos - other.pos;
      let distSq = dot(diff, diff);
      if (distSq < visualRangeSq && distSq > 0.0) {
        if(distSq < minDistanceSq) {
          let invDistSq = 1.0 / distSq;
          close += diff * invDistSq;
        }
        center += other.pos;
        avgVel += other.vel;
        neighbours += 1u;
      }
    }
  }

  if (neighbours > 0u) {
    center /= f32(neighbours);
    avgVel /= f32(neighbours);
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

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  var boid = boidsIn[index];

  mergedBehaviours(&boid);
  limitSpeed(&boid);
  keepInBounds(&boid);
  if (params.avoidMouse > 0) {
    avoidPredators(&boid);
  }

  boid.pos += boid.vel * params.dt;

  boids[index] = boid;

  // Bin the boid into next frame's grid, saving a separate update grid pass
  grid[index] = atomicAdd(&gridOffsetsIn[getGridID(boid.pos)], 1u);
}
`,D=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read_write> gridOffsets : array<atomic<u32>>;
@binding(3) @group(0) var<storage, read_write> grid : array<u32>;

// Stateless random generation
fn pcg_hash(input: u32) -> u32 {
  let state = input * 747796405u + 2891336453u;
  let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  return (word >> 22u) ^ word;
}

fn rand_pcg(input: u32, min: f32, max: f32) -> f32 {
  let float = f32(pcg_hash(input)) / 4294967296.0;
  return float * (max - min) + min;
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

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
  grid[index] = atomicAdd(&gridOffsets[getGridID(boid.pos)], 1u);
}
`,O=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> gridOffsetsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridOffsetsOut : array<u32>;
@binding(3) @group(0) var<storage, read_write> gridSums : array<u32>;

var<workgroup> temp : array<u32, 2 * blockSize>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>, 
        @builtin(local_invocation_id) LocalInvocationID: vec3<u32>,
        @builtin(workgroup_id) GroupID: vec3<u32>) {
  let globalID = GlobalInvocationID.x;
  let localID = LocalInvocationID.x;
  let groupID = GroupID.x;
  var pout: u32 = 0;
  var pin: u32 = 1;

  if (globalID < params.gridTotalCells) {
    temp[localID] = gridOffsetsIn[globalID];
    // Reset the counts so the boids kernel can fill them in for next frame
    gridOffsetsIn[globalID] = 0u;
  } else {
    temp[localID] = 0u;
  }
  workgroupBarrier();

  for (var offset: u32 = 1; offset < blockSize; offset *= 2) {
    pout = 1 - pout; // swap double buffer indices
    pin = 1 - pout;
    if (localID >= offset) {
        temp[pout * blockSize + localID] = temp[pin * blockSize + localID] + temp[pin * blockSize + localID - offset];
    } else {
        temp[pout * blockSize + localID] = temp[pin * blockSize + localID];
    }
    workgroupBarrier();
  }

  // Don't write out of bounds
  if (globalID >= params.gridTotalCells) {
      return;
  }

  let writeIdx = pout * blockSize + localID;
  var exclusiveVal = 0u;
  if (localID > 0u) {
    exclusiveVal = temp[writeIdx - 1u];
  }

  gridOffsetsOut[globalID] = exclusiveVal;
  if (localID == 0) {
      gridSums[groupID] = temp[pout * blockSize + blockSize - 1];
  } 
}
`,k=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> grid : array<u32>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(4) @group(0) var<storage, read_write> boidsOut : array<Boid>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  let boid = boidsIn[index];
  let newIndex = gridOffsets[getGridID(boid.pos)] + grid[index];
  boidsOut[newIndex] = boid;
}
`,A=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> boids : array<Boid>;
@binding(2) @group(0) var renderTarget : texture_storage_2d<rgba8unorm, write>;

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
  let screenOffset = vec2<f32>(
    rasterSize.x * 0.5 - params.cameraPos.x * screenScale.x,
    rasterSize.y * 0.5 - params.cameraPos.y * screenScale.y
  );

  return vec2<f32>(
    worldPos.x * screenScale.x + screenOffset.x,
    worldPos.y * screenScale.y + screenOffset.y
  );
}

fn getBoidColour(boid: Boid) -> vec4<f32> {
  var d = 1.0;
  if (params.avoidMouse > 0u) {
    d = distance(boid.pos, params.mousePos) / params.zoom;
  }
  return vec4<f32>(1.0, d, d, 1.0);
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) globalInvocationID : vec3<u32>) {
  let index = globalInvocationID.x;
  if (index >= params.numBoids) {
    return;
  }

  let boid = boids[index];
  let v0 = worldToScreen(rotateLocalVertex(boidTriangle0, boid.vel) + boid.pos);
  let v1 = worldToScreen(rotateLocalVertex(boidTriangle1, boid.vel) + boid.pos);
  let v2 = worldToScreen(rotateLocalVertex(boidTriangle2, boid.vel) + boid.pos);

  let minBounds = floor(min(v0, min(v1, v2)));
  let maxBounds = ceil(max(v0, max(v1, v2)));
  if (
    maxBounds.x < 0.0 ||
    maxBounds.y < 0.0 ||
    minBounds.x >= f32(params.renderWidth) ||
    minBounds.y >= f32(params.renderHeight)
  ) {
    return;
  }

  let minX = max(0, i32(minBounds.x));
  let minY = max(0, i32(minBounds.y));
  let maxX = min(i32(params.renderWidth) - 1, i32(maxBounds.x));
  let maxY = min(i32(params.renderHeight) - 1, i32(maxBounds.y));
  if (minX > maxX || minY > maxY) {
    return;
  }

  let area = edge(v0, v1, v2);
  if (abs(area) <= 1e-5) {
    return;
  }

  let pixelStart = vec2<f32>(f32(minX) + 0.5, f32(minY) + 0.5);
  let sign = select(-1.0, 1.0, area > 0.0);
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

    for (var x = minX; x <= maxX; x += 1) {
      if (sign * w0 >= 0.0 && sign * w1 >= 0.0 && sign * w2 >= 0.0) {
        textureStore(renderTarget, vec2<i32>(x, y), colour);
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
`,j=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridSumsIn : array<u32>;
@binding(2) @group(0) var<storage, read_write> gridSumsOut : array<u32>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.blocks) {
    return;
  }

  if(index < params.divider) {
    gridSumsOut[index] = gridSumsIn[index];
  } else {
    gridSumsOut[index] = gridSumsIn[index] + gridSumsIn[index - params.divider];
  }
}`,M=e=>({clearRasterComputeShader:new h(`clearRaster`,e,{computeSource:T},{bindingsMapping:{renderTarget:{group:0,binding:0},params:{group:0,binding:1}}}),generateBoidsComputeShader:new h(`generateBoids`,e,{computeSource:D},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},gridOffsets:{group:0,binding:2},grid:{group:0,binding:3}}}),boidComputeShader:new h(`boids`,e,{computeSource:E},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},boidsIn:{group:0,binding:2},gridOffsets:{group:0,binding:3},gridOffsetsIn:{group:0,binding:4},grid:{group:0,binding:5}}}),prefixSumComputeShader:new h(`prefixSum`,e,{computeSource:O},{bindingsMapping:{params:{group:0,binding:0},gridOffsetsIn:{group:0,binding:1},gridOffsetsOut:{group:0,binding:2},gridSums:{group:0,binding:3}}}),sumBucketsComputeShader:new h(`sumBuckets`,e,{computeSource:j},{bindingsMapping:{params:{group:0,binding:0},gridSumsIn:{group:0,binding:1},gridSumsOut:{group:0,binding:2}}}),addSumsComputeShader:new h(`addSums`,e,{computeSource:w},{bindingsMapping:{params:{group:0,binding:0},gridSumsIn:{group:0,binding:1},gridOffsetsOut:{group:0,binding:2}}}),rearrangeBoidsComputeShader:new h(`rearrangeBoids`,e,{computeSource:k},{bindingsMapping:{params:{group:0,binding:0},grid:{group:0,binding:1},gridOffsets:{group:0,binding:2},boidsIn:{group:0,binding:3},boidsOut:{group:0,binding:4}}}),renderBoidsComputeShader:new h(`renderBoids`,e,{computeSource:A},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},renderTarget:{group:0,binding:2}}})}),N=async()=>{let e=32,t=.5,n=.5,r=.15,i=document.getElementById(`renderCanvas`),o=document.getElementById(`boidText`),u=document.getElementById(`boidSlider`),m=document.getElementById(`avoidToggle`);m.checked=!1;let h=document.getElementById(`fpsText`),g=new a(i,{setMaximumLimits:!0,enableAllFeatures:!0});await g.initAsync(),document.getElementById(`loader`)?.remove();let _=g.currentLimits.maxComputeWorkgroupSizeX;f(_);let v=_*g.currentLimits.maxComputeWorkgroupsPerDimension;u.max=Math.ceil(Math.log2(v)).toString();let y,x,S,w,T,E=M(g),{clearRasterComputeShader:D,generateBoidsComputeShader:O,boidComputeShader:k,prefixSumComputeShader:A,sumBucketsComputeShader:j,addSumsComputeShader:N,rearrangeBoidsComputeShader:P,renderBoidsComputeShader:F}=E;await Promise.all(Object.values(E).map(e=>new Promise(t=>{let n=()=>e.isReady()?t():setTimeout(n,10);n()})));let I,L,R,z,B,V,H,U,W,G,K=null,q=0,J=0,Y=new c(g,void 0,!1,`params`);Y.addUniform(`numBoids`,1),Y.addUniform(`xBound`,1),Y.addUniform(`yBound`,1),Y.addUniform(`maxSpeed`,1),Y.addUniform(`minSpeed`,1),Y.addUniform(`turnSpeed`,1),Y.addUniform(`visualRangeSq`,1),Y.addUniform(`minDistanceSq`,1),Y.addUniform(`cohesionFactor`,1),Y.addUniform(`alignmentFactor`,1),Y.addUniform(`separationFactor`,1),Y.addUniform(`dt`,1),Y.addUniform(`gridDimX`,1),Y.addUniform(`gridDimY`,1),Y.addUniform(`gridInverseCellSize`,1),Y.addUniform(`gridTotalCells`,1),Y.addUniform(`divider`,1),Y.addUniform(`rngSeed`,1),Y.addUniform(`blocks`,1),Y.addUniform(`avoidMouse`,1),Y.addUniform(`zoom`,1),Y.addFloat2(`mousePos`,0,0),Y.addUniform(`renderWidth`,1),Y.addUniform(`renderHeight`,1),Y.addFloat2(`viewportHalfSize`,0,0),Y.addFloat2(`cameraPos`,0,0);let X=()=>{w=g.getRenderWidth()/g.getRenderHeight(),Y.updateUInt(`renderWidth`,g.getRenderWidth()),Y.updateUInt(`renderHeight`,g.getRenderHeight()),Y.updateFloat2(`viewportHalfSize`,S*w,S),Y.updateFloat2(`cameraPos`,T.position.x,T.position.y)},Z=()=>{let e=g.getRenderWidth(),t=g.getRenderHeight();if(K&&q===e&&J===t)return;let n=ne.CreateRGBAStorageTexture(null,e,t,y,!1,!1,p.NEAREST_NEAREST);n.wrapU=p.CLAMP_ADDRESSMODE,n.wrapV=p.CLAMP_ADDRESSMODE;let r=K;K=n,q=e,J=t,G.texture=K,D.setStorageTexture(`renderTarget`,K),F.setStorageTexture(`renderTarget`,K),r?.dispose()},Q=()=>{o.innerHTML=`Boids: ${e}`,y=new s(g),y.clearColor.fromHexString(`#314D79`),T=new d(`camera1`,new ee(0,0,-5),y),T.mode=1,w=g.getRenderWidth()/g.getRenderHeight(),S=Math.max(2,Math.sqrt(e)/10+t),x=S,T.orthoBottom=-S,T.orthoTop=S,T.orthoLeft=-S*w,T.orthoRight=S*w;let i=S*w-t,a=S-t,c=Math.floor(i*2/n)+30,u=Math.floor(a*2/n)+30;U=c*u,W=Math.ceil(U/_),I=new l(g,e*16),L=new l(g,e*16),G=new C(`rasterLayer`,null,y,!1,new b(1,1,1,1)),G.texture=null,Y.updateUInt(`numBoids`,e),Y.updateFloat(`xBound`,i),Y.updateFloat(`yBound`,a),Y.updateFloat(`maxSpeed`,2),Y.updateFloat(`minSpeed`,1.5),Y.updateFloat(`turnSpeed`,6),Y.updateFloat(`visualRangeSq`,n*n),Y.updateFloat(`minDistanceSq`,r*r),Y.updateFloat(`cohesionFactor`,2),Y.updateFloat(`alignmentFactor`,5),Y.updateFloat(`separationFactor`,1),Y.updateUInt(`gridDimX`,c),Y.updateUInt(`gridDimY`,u),Y.updateFloat(`gridInverseCellSize`,1/n),Y.updateUInt(`gridTotalCells`,U),Y.updateUInt(`rngSeed`,Math.floor(Math.random()*1e7)),Y.updateUInt(`blocks`,W),X(),Y.update(),R=new l(g,e*4),z=new l(g,U*4),B=new l(g,U*4),V=new l(g,W*4),H=new l(g,W*4),D.setUniformBuffer(`params`,Y),A.setUniformBuffer(`params`,Y),A.setStorageBuffer(`gridOffsetsOut`,B),A.setStorageBuffer(`gridOffsetsIn`,z),A.setStorageBuffer(`gridSums`,V),j.setUniformBuffer(`params`,Y),N.setUniformBuffer(`params`,Y),N.setStorageBuffer(`gridOffsetsOut`,B),P.setUniformBuffer(`params`,Y),P.setStorageBuffer(`grid`,R),P.setStorageBuffer(`gridOffsets`,B),P.setStorageBuffer(`boidsIn`,I),P.setStorageBuffer(`boidsOut`,L),k.setUniformBuffer(`params`,Y),k.setStorageBuffer(`boidsIn`,L),k.setStorageBuffer(`boids`,I),k.setStorageBuffer(`gridOffsets`,B),k.setStorageBuffer(`gridOffsetsIn`,z),k.setStorageBuffer(`grid`,R),F.setUniformBuffer(`params`,Y),F.setStorageBuffer(`boids`,I),Z(),O.setUniformBuffer(`params`,Y),O.setStorageBuffer(`boids`,I),O.setStorageBuffer(`gridOffsets`,z),O.setStorageBuffer(`grid`,R),O.dispatch(Math.ceil(e/_),1,1)},re=()=>{K?.dispose(),y.dispose(),I.dispose(),L.dispose(),R.dispose(),z.dispose(),B.dispose(),V.dispose(),H.dispose(),K=null,q=0,J=0};Q(),i.onwheel=e=>{let t=e.deltaY*S*.001;x+t>1&&(x+=t)},i.onpointermove=e=>{let t=i.getBoundingClientRect(),n=((e.clientX-t.left)/t.width-.5)*S*2*w+T.position.x,r=-((e.clientY-t.top)/t.height-.5)*S*2+T.position.y;Y.updateFloat2(`mousePos`,n,r),Y.update(),e.buttons&&(T.position.x-=e.movementX*.002*S,T.position.y+=e.movementY*.002*S)},u.oninput=()=>{e=Math.round(2**u.valueAsNumber),e>v&&(e=v),re(),Q()};let $;window.onresize=()=>{clearTimeout($),$=setTimeout(function(){g.resize(),w=g.getRenderWidth()/g.getRenderHeight(),T.orthoBottom=-S,T.orthoTop=S,T.orthoLeft=-S*w,T.orthoRight=S*w},100)},m.onclick=()=>{Y.updateUInt(`avoidMouse`,+!!m.checked),Y.update()};let ie=()=>{if(Math.abs(S-x)>.01){let e=g.getAspectRatio(T);S=te.Lerp(S,x,.1),T.orthoBottom=-S,T.orthoTop=S,T.orthoLeft=-S*e,T.orthoRight=S*e}};return g.runRenderLoop(()=>{let t=g.getFps();h.innerHTML=`FPS: ${t.toFixed(2)}`,ie(),Z(),Y.updateFloat(`dt`,Math.min(g.getDeltaTime()/1e3,1/3)),Y.updateFloat(`zoom`,S/3),X(),Y.update(),A.dispatch(W,1,1);let n=!1;for(let e=1;e<W;e*=2)j.setStorageBuffer(`gridSumsIn`,n?H:V),j.setStorageBuffer(`gridSumsOut`,n?V:H),Y.updateUInt(`divider`,e),Y.update(),j.dispatch(Math.ceil(W/_),1,1),n=!n;N.setStorageBuffer(`gridSumsIn`,n?H:V),N.dispatch(W,1,1),P.dispatch(Math.ceil(e/_),1,1),k.dispatch(Math.ceil(e/_),1,1),D.dispatch(Math.ceil(q/8),Math.ceil(J/8),1),F.dispatch(Math.ceil(e/_),1,1),y.render()}),g};export{N as boids2d};