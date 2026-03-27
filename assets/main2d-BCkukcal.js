const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/layer.vertex-Z7W4qe3X.js","assets/shaderStore-B3CsX8Dt.js","assets/layer.fragment-CilmI6Ka.js","assets/helperFunctions-BvNOocrJ.js","assets/layer.vertex-D8ypVwiY.js","assets/layer.fragment-BBP4gcil.js","assets/helperFunctions-C6fJxhG4.js"])))=>i.map(i=>d[i]);
import{r as e,u as t}from"./math.scalar.functions-wVG2V0LJ.js";import{t as n}from"./index-BIyvvMJS.js";import{t as r}from"./observable-BA881JtH.js";import{a as i,i as a}from"./math.vector-C0czaNHB.js";import{t as o}from"./engineStore-xvk4bPCs.js";import{s,t as c}from"./texture-DasXz68p.js";import{w as l}from"./textureTools-C-yGCP-w.js";import{a as u,r as d}from"./effectRenderer-CXrf12bs.js";import{c as f,t as p}from"./scene-uAS0ok_D.js";import{L as m,R as h,Z as g,n as _,r as v,t as y}from"./computeShader-vVGAt8Mj.js";var b=e,ee={...t,TwoPi:Math.PI*2,Sign:Math.sign,Log2:Math.log2,HCF:b},te=class e extends c{constructor(e,t,n,r,i,a=!0,o=!1,s=3,l=0,u,d,f,p){super(null,i,!a,o,void 0,void 0,void 0,void 0,void 0,void 0,void 0,void 0,u),this.format=r,this._engine&&(!this._engine._caps.textureFloatLinearFiltering&&l===1&&(s=1),!this._engine._caps.textureHalfFloatLinearFiltering&&l===2&&(s=1),this._texture=this._engine.createRawTexture(e,t,n,r,a,o,s,null,l,u??0,d??!1,p),this.wrapU=c.CLAMP_ADDRESSMODE,this.wrapV=c.CLAMP_ADDRESSMODE,this._waitingForData=!!f&&!e)}update(e){this.updateMipLevel(e,0)}updateMipLevel(e,t){this._getEngine().updateRawTexture(this._texture,e,this._texture.format,this._texture.invertY,null,this._texture.type,this._texture._useSRGBBuffer,t),this._waitingForData=!1}clone(){if(!this._texture)return super.clone();let t=new e(null,this.getSize().width,this.getSize().height,this.format,this.getScene(),this._texture.generateMipMaps,this._invertY,this.samplingMode,this._texture.type,this._texture._creationFlags,this._useSRGBBuffer);return t._texture=this._texture,this._texture.incrementReferences(),t}isReady(){return super.isReady()&&!this._waitingForData}static CreateLuminanceTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,1,i,a,o,s)}static CreateLuminanceAlphaTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,2,i,a,o,s)}static CreateAlphaTexture(t,n,r,i,a=!0,o=!1,s=3){return new e(t,n,r,0,i,a,o,s)}static CreateRGBTexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=0,u=!1){return new e(t,n,r,4,i,a,o,s,c,l,u)}static CreateRGBATexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=0,u=!1,d=!1){return new e(t,n,r,5,i,a,o,s,c,l,u,d)}static CreateRGBAStorageTexture(t,n,r,i,a=!0,o=!1,s=3,c=0,l=!1){return new e(t,n,r,5,i,a,o,s,c,1,l)}static CreateRTexture(t,n,r,i,a=!0,o=!1,s=c.TRILINEAR_SAMPLINGMODE,l=1){return new e(t,n,r,6,i,a,o,s,l)}static CreateRStorageTexture(t,n,r,i,a=!0,o=!1,s=c.TRILINEAR_SAMPLINGMODE,l=1){return new e(t,n,r,6,i,a,o,s,l,1)}},x=class{constructor(e){this.name=f.NAME_LAYER,this.scene=e||o.LastCreatedScene,this.scene&&(this._engine=this.scene.getEngine())}register(){this.scene._beforeCameraDrawStage.registerStep(f.STEP_BEFORECAMERADRAW_LAYER,this,this._drawCameraBackground),this.scene._afterCameraDrawStage.registerStep(f.STEP_AFTERCAMERADRAW_LAYER,this,this._drawCameraForegroundWithPostProcessing),this.scene._afterCameraPostProcessStage.registerStep(f.STEP_AFTERCAMERAPOSTPROCESS_LAYER,this,this._drawCameraForegroundWithoutPostProcessing),this.scene._beforeRenderTargetDrawStage.registerStep(f.STEP_BEFORERENDERTARGETDRAW_LAYER,this,this._drawRenderTargetBackground),this.scene._afterRenderTargetDrawStage.registerStep(f.STEP_AFTERRENDERTARGETDRAW_LAYER,this,this._drawRenderTargetForegroundWithPostProcessing),this.scene._afterRenderTargetPostProcessStage.registerStep(f.STEP_AFTERRENDERTARGETPOSTPROCESS_LAYER,this,this._drawRenderTargetForegroundWithoutPostProcessing)}rebuild(){let e=this.scene.layers;for(let t of e)t._rebuild()}dispose(){let e=this.scene.layers;for(;e.length;)e[0].dispose()}_draw(e){let t=this.scene.layers;if(t.length){this._engine.setDepthBuffer(!1);for(let n of t)e(n)&&n.render();this._engine.setDepthBuffer(!0)}}_drawCameraPredicate(e,t,n,r){return!e.renderOnlyInRenderTargetTextures&&e.isBackground===t&&e.applyPostProcess===n&&(e.layerMask&r)!==0}_drawCameraBackground(e){this._draw(t=>this._drawCameraPredicate(t,!0,!0,e.layerMask))}_drawCameraForegroundWithPostProcessing(e){this._draw(t=>this._drawCameraPredicate(t,!1,!0,e.layerMask))}_drawCameraForegroundWithoutPostProcessing(e){this._draw(t=>this._drawCameraPredicate(t,!1,!1,e.layerMask))}_drawRenderTargetPredicate(e,t,n,r,i){return e.renderTargetTextures.length>0&&e.isBackground===t&&e.applyPostProcess===n&&e.renderTargetTextures.indexOf(i)>-1&&(e.layerMask&r)!==0}_drawRenderTargetBackground(e){this._draw(t=>this._drawRenderTargetPredicate(t,!0,!0,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}_drawRenderTargetForegroundWithPostProcessing(e){this._draw(t=>this._drawRenderTargetPredicate(t,!1,!0,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}_drawRenderTargetForegroundWithoutPostProcessing(e){this._draw(t=>this._drawRenderTargetPredicate(t,!1,!1,this.scene.activeCamera?this.scene.activeCamera.layerMask:0,e))}addFromContainer(e){if(e.layers)for(let t of e.layers)this.scene.layers.push(t)}removeFromContainer(e,t=!1){if(e.layers)for(let n of e.layers){let e=this.scene.layers.indexOf(n);e!==-1&&this.scene.layers.splice(e,1),t&&n.dispose()}}},S=class e{set applyPostProcess(e){this._applyPostProcess=e}get applyPostProcess(){return this.isBackground||this._applyPostProcess}set onDispose(e){this._onDisposeObserver&&this.onDisposeObservable.remove(this._onDisposeObserver),this._onDisposeObserver=this.onDisposeObservable.add(e)}set onBeforeRender(e){this._onBeforeRenderObserver&&this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver),this._onBeforeRenderObserver=this.onBeforeRenderObservable.add(e)}set onAfterRender(e){this._onAfterRenderObserver&&this.onAfterRenderObservable.remove(this._onAfterRenderObserver),this._onAfterRenderObserver=this.onAfterRenderObservable.add(e)}get shaderLanguage(){return this._shaderLanguage}constructor(t,n,i,l,p,m=!1){this.name=t,this._applyPostProcess=!0,this.scale=new a(1,1),this.offset=new a(0,0),this.alphaBlendingMode=2,this.layerMask=268435455,this.renderTargetTextures=[],this.renderOnlyInRenderTargetTextures=!1,this.convertToLinearSpace=!1,this.isEnabled=!0,this._vertexBuffers={},this.onDisposeObservable=new r,this.onBeforeRenderObservable=new r,this.onAfterRenderObservable=new r,this._shaderLanguage=0,this._shadersLoaded=!1,this.texture=n?new c(n,i,!0):null,this.isBackground=l===void 0?!0:l,this.color=p===void 0?new s(1,1,1,1):p,this._scene=i||o.LastCreatedScene;let h=this._scene.getEngine();h.isWebGPU&&!m&&!e.ForceGLSL&&(this._shaderLanguage=1);let g=this._scene._getComponent(f.NAME_LAYER);g||(g=new x(this._scene),this._scene._addComponent(g)),this._scene.layers.push(this),this._drawWrapper=new d(h);let _=[];_.push(1,1),_.push(-1,1),_.push(-1,-1),_.push(1,-1);let v=new u(h,_,u.PositionKind,!1,!1,2);this._vertexBuffers[u.PositionKind]=v,this._createIndexBuffer()}_createIndexBuffer(){let e=this._scene.getEngine(),t=[];t.push(0),t.push(1),t.push(2),t.push(0),t.push(2),t.push(3),this._indexBuffer=e.createIndexBuffer(t)}_rebuild(){let e=this._vertexBuffers[u.PositionKind];e&&e._rebuild(),this._createIndexBuffer()}isReady(){let e=this._scene.getEngine(),t=``;return this.alphaTest&&(t=`#define ALPHATEST`),this.texture&&(this.texture.gammaSpace?this.convertToLinearSpace&&(t+=`
#define CONVERT_TO_LINEAR`):this.convertToLinearSpace||(t+=`
#define CONVERT_TO_GAMMA`)),this._previousDefines!==t&&(this._previousDefines=t,this._drawWrapper.effect=e.createEffect(`layer`,[u.PositionKind],[`textureMatrix`,`color`,`scale`,`offset`],[`textureSampler`],t,void 0,void 0,void 0,void 0,this._shaderLanguage,this._shadersLoaded?void 0:async()=>{this._shaderLanguage===1?await Promise.all([n(()=>import(`./layer.vertex-Z7W4qe3X.js`),__vite__mapDeps([0,1])),n(()=>import(`./layer.fragment-CilmI6Ka.js`),__vite__mapDeps([2,1,3]))]):await Promise.all([n(()=>import(`./layer.vertex-D8ypVwiY.js`),__vite__mapDeps([4,1])),n(()=>import(`./layer.fragment-BBP4gcil.js`),__vite__mapDeps([5,1,6]))]),this._shadersLoaded=!0})),!!this._drawWrapper.effect?.isReady()&&(!this.texture||this.texture.isReady())}render(){if(!this.isEnabled)return;let e=this._scene.getEngine();if(!this.isReady())return;let t=this._drawWrapper.effect;this.onBeforeRenderObservable.notifyObservers(this),e.enableEffect(this._drawWrapper),e.setState(!1),this.texture&&(t.setTexture(`textureSampler`,this.texture),t.setMatrix(`textureMatrix`,this.texture.getTextureMatrix())),t.setFloat4(`color`,this.color.r,this.color.g,this.color.b,this.color.a),t.setVector2(`offset`,this.offset),t.setVector2(`scale`,this.scale),e.bindBuffers(this._vertexBuffers,this._indexBuffer,t),this.alphaTest?e.drawElementsType(v.TriangleFillMode,0,6):(e.setAlphaMode(this.alphaBlendingMode),e.drawElementsType(v.TriangleFillMode,0,6),e.setAlphaMode(0)),this.onAfterRenderObservable.notifyObservers(this)}dispose(){let e=this._vertexBuffers[u.PositionKind];e&&(e.dispose(),this._vertexBuffers[u.PositionKind]=null),this._indexBuffer&&=(this._scene.getEngine()._releaseBuffer(this._indexBuffer),null),this.texture&&=(this.texture.dispose(),null),this.renderTargetTextures=[];let t=this._scene.layers.indexOf(this);this._scene.layers.splice(t,1),this.onDisposeObservable.notifyObservers(this),this.onDisposeObservable.clear(),this.onAfterRenderObservable.clear(),this.onBeforeRenderObservable.clear()}};S.ForceGLSL=!1;var C=`#include<boidInclude>

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
`,w=`#include<boidInclude>

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
`,T=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> gridOffsets : array<u32>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.gridTotalCells) {
    return;
  }

  gridOffsets[index] = 0u;
}`,E=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;
@binding(2) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(3) @group(0) var<storage, read> gridOffsets : array<u32>;

fn getGridLocation(boid: Boid) -> vec2<u32> {
  let x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  let y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  return vec2<u32>(x, y);
}

fn getGridID(pos: vec2<u32>) -> u32 {
  return (params.gridDimX * pos.y) + pos.x;
}

fn mergedBehaviours(boid: ptr<function,Boid>) {
  var center : vec2<f32> = vec2<f32>();
  var close : vec2<f32> = vec2<f32>();
  var avgVel : vec2<f32> = vec2<f32>();
  var neighbours: u32 = 0u;

  let gridXY = getGridLocation(*boid);
  let cell = getGridID(gridXY);
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
}
`,D=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> boids : array<Boid>;

var<private> rngState : u32;

fn rand_pcg(min: f32, max: f32) -> f32 {
  rngState = rngState * 747796405u + 2891336453u;
  let state = rngState;
  let word: u32 = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
  let float = f32((word >> 22u) ^ word) / 4294967296.0;
  return float * (max - min) + min;
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  rngState = params.rngSeed + index;

  boids[index].pos = vec2<f32>(rand_pcg(-params.xBound,params.xBound), rand_pcg(-params.yBound,params.yBound));
  boids[index].vel = vec2<f32>(
    rand_pcg(-params.maxSpeed, params.maxSpeed),
    rand_pcg(-params.maxSpeed, params.maxSpeed),
  );
}
`,O=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read> gridOffsetsIn : array<u32>;
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
@binding(1) @group(0) var<storage, read> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read> boidsIn : array<Boid>;
@binding(4) @group(0) var<storage, read_write> boidsOut : array<Boid>;

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  let gridID = grid[index].x;
  let cellOffset = grid[index].y;
  let newIndex = gridOffsets[gridID] + cellOffset;
  boidsOut[newIndex] = boidsIn[index];
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
}`,M=`#include<boidInclude>

@binding(0) @group(0) var<uniform> params : Params;
@binding(1) @group(0) var<storage, read_write> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read_write> gridOffsets : array<atomic<u32>>;
@binding(3) @group(0) var<storage, read> boids : array<Boid>;

fn getGridID(boid: Boid) -> u32 {
  let x = u32(floor(boid.pos.x / params.gridCellSize + f32(params.gridDimX / 2)));
  let y = u32(floor(boid.pos.y / params.gridCellSize + f32(params.gridDimY / 2)));
  return (params.gridDimX * y) + x;
}

@compute @workgroup_size(blockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index : u32 = GlobalInvocationID.x;

  if (index >= params.numBoids) {
    return;
  }

  let gridID = getGridID(boids[index]);
  grid[index].x = gridID;
  grid[index].y = atomicAdd(&gridOffsets[gridID], 1);
}`,ne=e=>({clearRasterComputeShader:new y(`clearRaster`,e,{computeSource:w},{bindingsMapping:{renderTarget:{group:0,binding:0},params:{group:0,binding:1}}}),generateBoidsComputeShader:new y(`generateBoids`,e,{computeSource:D},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1}}}),boidComputeShader:new y(`boids`,e,{computeSource:E},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},boidsIn:{group:0,binding:2},gridOffsets:{group:0,binding:3}}}),clearGridComputeShader:new y(`clearGrid`,e,{computeSource:T},{bindingsMapping:{params:{group:0,binding:0},gridOffsets:{group:0,binding:1}}}),updateGridComputeShader:new y(`updateGrid`,e,{computeSource:M},{bindingsMapping:{params:{group:0,binding:0},grid:{group:0,binding:1},gridOffsets:{group:0,binding:2},boids:{group:0,binding:3}}}),prefixSumComputeShader:new y(`prefixSum`,e,{computeSource:O},{bindingsMapping:{params:{group:0,binding:0},gridOffsetsIn:{group:0,binding:1},gridOffsetsOut:{group:0,binding:2},gridSums:{group:0,binding:3}}}),sumBucketsComputeShader:new y(`sumBuckets`,e,{computeSource:j},{bindingsMapping:{params:{group:0,binding:0},gridSumsIn:{group:0,binding:1},gridSumsOut:{group:0,binding:2}}}),addSumsComputeShader:new y(`addSums`,e,{computeSource:C},{bindingsMapping:{params:{group:0,binding:0},gridSumsIn:{group:0,binding:1},gridOffsetsOut:{group:0,binding:2}}}),rearrangeBoidsComputeShader:new y(`rearrangeBoids`,e,{computeSource:k},{bindingsMapping:{params:{group:0,binding:0},grid:{group:0,binding:1},gridOffsets:{group:0,binding:2},boidsIn:{group:0,binding:3},boidsOut:{group:0,binding:4}}}),renderBoidsComputeShader:new y(`renderBoids`,e,{computeSource:A},{bindingsMapping:{params:{group:0,binding:0},boids:{group:0,binding:1},renderTarget:{group:0,binding:2}}})}),N=async()=>{let e=32,t=.5,n=.5,r=.15,a=document.getElementById(`renderCanvas`),o=document.getElementById(`boidText`),u=document.getElementById(`boidSlider`),d=document.getElementById(`avoidToggle`);d.checked=!1;let f=document.getElementById(`fpsText`),v=new h(a,{setMaximumLimits:!0,enableAllFeatures:!0});await v.initAsync(),document.getElementById(`loader`)?.remove();let y=v.currentLimits.maxComputeWorkgroupSizeX;_(y);let b=y*v.currentLimits.maxComputeWorkgroupsPerDimension;u.max=Math.ceil(Math.log2(b)).toString();let x,C,w,T,E,{clearRasterComputeShader:D,generateBoidsComputeShader:O,boidComputeShader:k,clearGridComputeShader:A,updateGridComputeShader:j,prefixSumComputeShader:M,sumBucketsComputeShader:N,addSumsComputeShader:P,rearrangeBoidsComputeShader:F,renderBoidsComputeShader:I}=ne(v),L,R,z,B,V,H,U,W,G,K,q=null,J=0,Y=0,X=new l(v,void 0,!1,`params`);X.addUniform(`numBoids`,1),X.addUniform(`xBound`,1),X.addUniform(`yBound`,1),X.addUniform(`maxSpeed`,1),X.addUniform(`minSpeed`,1),X.addUniform(`turnSpeed`,1),X.addUniform(`visualRangeSq`,1),X.addUniform(`minDistanceSq`,1),X.addUniform(`cohesionFactor`,1),X.addUniform(`alignmentFactor`,1),X.addUniform(`separationFactor`,1),X.addUniform(`dt`,1),X.addUniform(`gridDimX`,1),X.addUniform(`gridDimY`,1),X.addUniform(`gridCellSize`,1),X.addUniform(`gridTotalCells`,1),X.addUniform(`divider`,1),X.addUniform(`rngSeed`,1),X.addUniform(`blocks`,1),X.addUniform(`avoidMouse`,1),X.addUniform(`zoom`,1),X.addFloat2(`mousePos`,0,0),X.addUniform(`renderWidth`,1),X.addUniform(`renderHeight`,1),X.addFloat2(`viewportHalfSize`,0,0),X.addFloat2(`cameraPos`,0,0);let Z=()=>{T=v.getRenderWidth()/v.getRenderHeight(),X.updateUInt(`renderWidth`,v.getRenderWidth()),X.updateUInt(`renderHeight`,v.getRenderHeight()),X.updateFloat2(`viewportHalfSize`,w*T,w),X.updateFloat2(`cameraPos`,E.position.x,E.position.y)},Q=()=>{let e=v.getRenderWidth(),t=v.getRenderHeight();if(q&&J===e&&Y===t)return;let n=te.CreateRGBAStorageTexture(null,e,t,x,!1,!1,c.NEAREST_NEAREST);n.wrapU=c.CLAMP_ADDRESSMODE,n.wrapV=c.CLAMP_ADDRESSMODE;let r=q;q=n,J=e,Y=t,K.texture=q,D.setStorageTexture(`renderTarget`,q),I.setStorageTexture(`renderTarget`,q),r?.dispose()},$=()=>{o.innerHTML=`Boids: ${e}`,x=new p(v),x.clearColor.fromHexString(`#314D79`),E=new g(`camera1`,new i(0,0,-5),x),E.mode=1,T=v.getRenderWidth()/v.getRenderHeight(),w=Math.max(2,Math.sqrt(e)/10+t),C=w,E.orthoBottom=-w,E.orthoTop=w,E.orthoLeft=-w*T,E.orthoRight=w*T;let a=w*T-t,c=w-t,l=Math.floor(a*2/n)+30,u=Math.floor(c*2/n)+30;W=l*u,G=Math.ceil(W/y),L=new m(v,e*16),R=new m(v,e*16),K=new S(`rasterLayer`,null,x,!1,new s(1,1,1,1)),K.texture=null,X.updateUInt(`numBoids`,e),X.updateFloat(`xBound`,a),X.updateFloat(`yBound`,c),X.updateFloat(`maxSpeed`,2),X.updateFloat(`minSpeed`,2*.75),X.updateFloat(`turnSpeed`,6),X.updateFloat(`visualRangeSq`,n*n),X.updateFloat(`minDistanceSq`,r*r),X.updateFloat(`cohesionFactor`,2),X.updateFloat(`alignmentFactor`,5),X.updateFloat(`separationFactor`,1),X.updateUInt(`gridDimX`,l),X.updateUInt(`gridDimY`,u),X.updateFloat(`gridCellSize`,n),X.updateUInt(`gridTotalCells`,W),X.updateUInt(`rngSeed`,Math.floor(Math.random()*1e7)),X.updateUInt(`blocks`,G),Z(),X.update(),z=new m(v,e*8),B=new m(v,W*4),V=new m(v,W*4),H=new m(v,G*4),U=new m(v,G*4),A.setUniformBuffer(`params`,X),A.setStorageBuffer(`gridOffsets`,B),D.setUniformBuffer(`params`,X),j.setUniformBuffer(`params`,X),j.setStorageBuffer(`grid`,z),j.setStorageBuffer(`gridOffsets`,B),j.setStorageBuffer(`boids`,L),M.setUniformBuffer(`params`,X),M.setStorageBuffer(`gridOffsetsOut`,V),M.setStorageBuffer(`gridOffsetsIn`,B),M.setStorageBuffer(`gridSums`,H),N.setUniformBuffer(`params`,X),P.setUniformBuffer(`params`,X),P.setStorageBuffer(`gridOffsetsOut`,V),F.setUniformBuffer(`params`,X),F.setStorageBuffer(`grid`,z),F.setStorageBuffer(`gridOffsets`,V),F.setStorageBuffer(`boidsIn`,L),F.setStorageBuffer(`boidsOut`,R),k.setUniformBuffer(`params`,X),k.setStorageBuffer(`boidsIn`,R),k.setStorageBuffer(`boids`,L),k.setStorageBuffer(`gridOffsets`,V),I.setUniformBuffer(`params`,X),I.setStorageBuffer(`boids`,L),Q(),O.setUniformBuffer(`params`,X),O.setStorageBuffer(`boids`,L),O.dispatchWhenReady(Math.ceil(e/y),1,1)},re=()=>{q?.dispose(),x.dispose(),L.dispose(),R.dispose(),z.dispose(),B.dispose(),V.dispose(),H.dispose(),U.dispose(),q=null,J=0,Y=0};$(),a.onwheel=e=>{let t=e.deltaY*w*.001;C+t>1&&(C+=t)},a.onpointermove=e=>{let t=a.getBoundingClientRect(),n=((e.clientX-t.left)/t.width-.5)*w*2*T+E.position.x,r=-((e.clientY-t.top)/t.height-.5)*w*2+E.position.y;X.updateFloat2(`mousePos`,n,r),X.update(),e.buttons&&(E.position.x-=e.movementX*.002*w,E.position.y+=e.movementY*.002*w)},u.oninput=()=>{e=Math.round(2**u.valueAsNumber),e>b&&(e=b),re(),$()};let ie;window.onresize=()=>{clearTimeout(ie),ie=setTimeout(function(){v.resize(),T=v.getRenderWidth()/v.getRenderHeight(),E.orthoBottom=-w,E.orthoTop=w,E.orthoLeft=-w*T,E.orthoRight=w*T},100)},d.onclick=()=>{X.updateUInt(`avoidMouse`,d.checked?1:0),X.update()};let ae=()=>{if(Math.abs(w-C)>.01){let e=v.getAspectRatio(E);w=ee.Lerp(w,C,.1),E.orthoBottom=-w,E.orthoTop=w,E.orthoLeft=-w*e,E.orthoRight=w*e}};return v.runRenderLoop(()=>{f.innerHTML=`FPS: ${v.getFps().toFixed(2)}`,ae(),Q(),X.updateFloat(`dt`,v.getDeltaTime()/1e3),X.updateFloat(`zoom`,w/3),Z(),X.update(),A.dispatch(G,1,1),j.dispatch(Math.ceil(e/y),1,1),M.dispatch(G,1,1);let t=!1;for(let e=1;e<G;e*=2)N.setStorageBuffer(`gridSumsIn`,t?U:H),N.setStorageBuffer(`gridSumsOut`,t?H:U),X.updateUInt(`divider`,e),X.update(),N.dispatch(Math.ceil(G/y),1,1),t=!t;P.setStorageBuffer(`gridSumsIn`,t?U:H),P.dispatch(G,1,1),F.dispatch(Math.ceil(e/y),1,1),k.dispatch(Math.ceil(e/y),1,1),D.dispatch(Math.ceil(J/8),Math.ceil(Y/8),1),I.dispatch(Math.ceil(e/y),1,1),x.render()}),v};export{N as boids2d};