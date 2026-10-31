import{_ as e,n as t,r as n,t as r,u as i}from"./gpu-nS4QaLAx.js";var{clamp:a,degToRad:o}=e,s=.1,c=.1,l=(e,t,n)=>Math.abs(t-e)<=n?t:e+Math.sign(t-e)*n,u=(e,t,n)=>{let r=!1,i=0,a=0;e.addEventListener(`pointerdown`,t=>{(t.button===0||t.button===2)&&(r=!0,i=t.clientX,a=t.clientY,e.setPointerCapture(t.pointerId),t.pointerType===`mouse`&&e.requestPointerLock?.()?.catch(()=>{}))},{signal:t}),e.addEventListener(`pointermove`,t=>{let o=document.pointerLockElement===e,s=o?t.movementX:t.clientX-i,c=o?t.movementY:t.clientY-a;i=t.clientX,a=t.clientY,r&&n(s,c)},{signal:t});let o=()=>{r&&(r=!1,document.pointerLockElement===e&&document.exitPointerLock())};return e.addEventListener(`pointerup`,o,{signal:t}),e.addEventListener(`pointercancel`,o,{signal:t}),e.addEventListener(`contextmenu`,e=>e.preventDefault(),{signal:t}),{isDragging:()=>r}},d=(e,t)=>{let n=1,r=1,i={x:0,y:0,orthoSize:1,resetView:e=>{i.x=0,i.y=0,i.orthoSize=e,n=e,r=n+Math.sqrt(n)/2},update:e=>{n=a(n,2,r),i.orthoSize+=(n-i.orthoSize)*Math.min(e*10,1)}};return u(e,t,(e,t)=>{let n=i.orthoSize/57.5;i.x-=e*s*n,i.y+=t*s*n}),e.addEventListener(`wheel`,e=>{let t=e.deltaMode===WheelEvent.DOM_DELTA_LINE?e.deltaY/3:e.deltaY/100;n+=t*c*(i.orthoSize/2)},{signal:t,passive:!0}),i},f=3,p=10,m=3,h=o(88),g=o(s*1.5),_=(e,t,n)=>{e.rotation.order=`YXZ`;let r={x:0,y:0,z:0},i=new Set,o=u(t,n,(t,n)=>{e.rotation.y-=t*g,e.rotation.x=a(e.rotation.x-n*g,-h,h)});window.addEventListener(`keydown`,e=>{e.ctrlKey||e.metaKey||e.altKey||i.add(e.code)},{signal:n}),window.addEventListener(`keyup`,e=>i.delete(e.code),{signal:n}),window.addEventListener(`blur`,()=>i.clear(),{signal:n});let s=(...e)=>e.some(e=>i.has(e)),c=(e,t,n,r)=>{let i=!!n-+!!t;return e*i<0&&(e=0),l(e,i,f*r)};return{resetView:t=>{e.position.set(0,0,t),e.rotation.set(0,0,0)},update:t=>{if(r.x=c(r.x,s(`KeyA`,`ArrowLeft`),s(`KeyD`,`ArrowRight`),t),r.y=c(r.y,s(`KeyQ`),s(`KeyE`),t),r.z=c(r.z,s(`KeyS`,`ArrowDown`),s(`KeyW`,`ArrowUp`),t),o.isDragging()){let n=p*(s(`ShiftLeft`,`ShiftRight`)?m:1)*t;e.translateX(r.x*n),e.translateY(r.y*n),e.translateZ(-r.z*n)}}}},v=`// Shared by the prefix sum kernels, which also get the boid include for Params and blockSize\r
\r
fn getCell(groupID: u32, localID: u32, row: u32) -> u32 {\r
  return groupID * blockCells + row * blockSize + localID;\r
}\r
\r
var<workgroup> scanTemp : array<array<vec4<u32>, blockSize>, 2>;\r
\r
// Exclusive scan of a group's 4 rows of values in row order, total gets their sum\r
fn groupScan(values: vec4<u32>, localID: u32, total: ptr<function, u32>) -> vec4<u32> {\r
  // The previous scan may still be reading scanTemp\r
  workgroupBarrier();\r
  var inclusive = values;\r
  var buf = 0u;\r
  for (var offset = 1u; offset < blockSize; offset *= 2u) {\r
    scanTemp[buf][localID] = inclusive;\r
    workgroupBarrier();\r
    if (localID >= offset) {\r
      inclusive += scanTemp[buf][localID - offset];\r
    }\r
    buf ^= 1u;\r
  }\r
  buf ^= 1u;\r
  // The last step stored sums of each half of the rows\r
  let rowTotals = scanTemp[buf][blockSize - 1u] + scanTemp[buf][blockSize / 2u - 1u];\r
  *total = rowTotals.x + rowTotals.y + rowTotals.z + rowTotals.w;\r
  return inclusive - values + vec4<u32>(0u, rowTotals.x, rowTotals.x + rowTotals.y, *total - rowTotals.w);\r
}\r
`,y=`@binding(0) @group(0) var<uniform> params : Params;\r
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
`,b=`@binding(0) @group(0) var<uniform> params : Params;\r
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
`,x=`@binding(0) @group(0) var<uniform> params : Params;\r
@binding(1) @group(0) var<storage, read_write> gridOffsetsIn : array<u32>;\r
@binding(2) @group(0) var<storage, read_write> gridOffsets : array<u32>;\r
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
      gridOffsets[cell] = offsets[row];\r
      // Reset the counts so the boids kernel can fill them in for next frame\r
      gridOffsetsIn[cell] = 0u;\r
    }\r
  }\r
}\r
`,S=`@binding(0) @group(0) var<uniform> params : Params;
// Each boid's (cell, rank in that cell), from when the boid was binned
@binding(1) @group(0) var<storage, read> grid : array<vec2<u32>>;
@binding(2) @group(0) var<storage, read> gridOffsets : array<u32>;
@binding(3) @group(0) var<storage, read_write> sortedIndices : array<u32>;

@compute @workgroup_size(boidBlockSize)
fn main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = getBoidIndex(GlobalInvocationID);

  if (index >= params.numBoids) {
    return;
  }

  // Only the index moves, the boids kernel reads the boid through it
  let slot = grid[index];
  sortedIndices[gridOffsets[slot.x] + slot.y] = index;
}
`,C=256,w=C*4,T=(e,t,n)=>{let r=Math.ceil(e/t),i=Math.max(1,Math.ceil(r/n));return[Math.ceil(r/i),i]},E=(e,t)=>`
const boidBlockSize: u32 = 256;
const blockSize: u32 = ${C};
const blockCells: u32 = ${w};
const searchBlockSize: u32 = ${t.searchBlockSize};
const tileSize: u32 = ${t.tileSize};
// Passes for a group to stage a full tile, one boid per thread each pass
const stagePasses: u32 = (tileSize + searchBlockSize - 1u) / searchBlockSize;

${e}

fn getBoidIndex(id: vec3<u32>) -> u32 {
  return id.y * params.boidStride + id.x;
}

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

${t.include}
`,D=class e{shaders;bindGroups=[];constructor(e){this.shaders=e}static async create(t,n){let i=`${v}\n${n}`,a=await Promise.all([r.create(t,`sumBlocks`,`${y}\n${i}`,[`params`,`gridOffsetsIn`,`gridSums`]),r.create(t,`scanSums`,`${b}\n${i}`,[`params`,`gridSums`]),r.create(t,`prefixSum`,`${x}\n${i}`,[`params`,`gridOffsetsIn`,`gridOffsets`,`gridSums`])]);return new e(a)}setBuffers(e){this.bindGroups=this.shaders.map(t=>t.createBindGroup(e))}dispatch(e,t){let[n,r,i]=this.shaders;n.dispatch(e,this.bindGroups[0],t),r.dispatch(e,this.bindGroups[1],1),i.dispatch(e,this.bindGroups[2],t)}},O=.5,k=.5,A=2,j=.15,M=2,ee=5,N=1,P={numBoids:`u32`,xBound:`f32`,yBound:`f32`,maxSpeed:`f32`,minSpeed:`f32`,turnSpeed:`f32`,visualRangeSq:`f32`,minDistanceSq:`f32`,cohesionFactor:`f32`,alignmentFactor:`f32`,separationFactor:`f32`,dt:`f32`,gridDimX:`u32`,gridDimY:`u32`,gridInverseCellSize:`f32`,gridTotalCells:`u32`,boidStride:`u32`,updateGroupsX:`u32`,rngSeed:`u32`,blocks:`u32`},F=async(e,i,a)=>{let o=e.limits.maxComputeWorkgroupsPerDimension,s=Math.min(e.limits.maxStorageBufferBindingSize,e.limits.maxBufferSize),c=Math.min(i.boidLimitPerGroup*o,Math.floor(s/i.boidBytes)),l=new t(e,{...P,...a});l.set(`maxSpeed`,A),l.set(`minSpeed`,A*.75),l.set(`turnSpeed`,6),l.set(`visualRangeSq`,k*k),l.set(`minDistanceSq`,j*j),l.set(`cohesionFactor`,M),l.set(`alignmentFactor`,ee),l.set(`separationFactor`,N),l.set(`gridInverseCellSize`,1/k);let u=E(l.wgsl,i),{label:d}=i,[f,p,m,h]=await Promise.all([r.create(e,`generateBoids${d}`,`${i.generateBoids}\n${u}`,[`params`,`boids`,`gridOffsetsIn`,`grid`]),r.create(e,`rearrangeBoids${d}`,`${S}\n${u}`,[`params`,`grid`,`gridOffsets`,`sortedIndices`]),r.create(e,`boids${d}`,`${i.boids}\n${u}`,[`params`,`boidsIn`,`boidsOut`,`sortedIndices`,`gridOffsets`,`gridOffsetsIn`,`grid`,...i.viewBindings]),D.create(e,u)]),g=0,_=[0,0],v=[0,0],y=[],b={},x={},C=null,O=[],F=0,I=()=>({params:l.buffer,...b,...x}),L=()=>{O=y.map((e,t)=>m.createBindGroup({...I(),boidsIn:e,boidsOut:y[1-t]}))},R=()=>{for(let e of y)e.destroy();for(let e of Object.values(b))e.destroy()};return{params:l,boidLimit:c,get boidBuffers(){return y},get current(){return F},setViewBuffers:e=>{x=e,L()},setup:(t,r,a)=>{R(),g=Math.ceil(r/w),_=T(t,256,o),v=T(t,i.searchBlockSize,o);for(let e in a)l.set(e,a[e]);l.set(`numBoids`,t),l.set(`gridTotalCells`,r),l.set(`boidStride`,_[0]*256),l.set(`updateGroupsX`,v[0]),l.set(`rngSeed`,Math.floor(Math.random()*1e7)),l.set(`blocks`,g),l.update(),y=[n(e,t*i.boidBytes),n(e,t*i.boidBytes)],b={grid:n(e,t*8),sortedIndices:n(e,t*4),gridOffsetsIn:n(e,r*4),gridOffsets:n(e,r*4),gridSums:n(e,g*4)},h.setBuffers(I()),C=p.createBindGroup(I()),L(),F=0;let s=e.createCommandEncoder(),c=s.beginComputePass();f.dispatch(c,f.createBindGroup({...I(),boids:y[0]}),..._),c.end(),e.queue.submit([s.finish()])},encode:(e,t)=>{l.set(`dt`,t),l.update();let n=e.beginComputePass();h.dispatch(n,g),p.dispatch(n,C,..._),m.dispatch(n,O[F],...v),n.end(),F=1-F},dispose:()=>{R(),l.dispose()}}};i.BRDF_GGX,i.BRDF_Lambert,i.BRDF_Sheen,i.BasicPointShadowFilter,i.BasicShadowFilter,i.Break,i.Const,i.Continue,i.DFGLUT,i.D_GGX,i.D_GGX_Anisotropic,i.Discard,i.EPSILON,i.EnvironmentBRDF,i.F_Schlick;var I=i.Fn;i.HALF_PI,i.INFINITY;var L=i.If;i.LTC_Evaluate,i.LTC_Evaluate_Volume,i.LTC_Uv,i.Loop,i.NodeAccess,i.NodeShaderStage,i.NodeType,i.NodeUpdateType,i.OnAfterObjectUpdate,i.OnAfterRenderPipeline,i.OnBeforeFrameUpdate,i.OnBeforeMaterialUpdate,i.OnBeforeObjectUpdate,i.OnBeforeRenderPipeline,i.OnFrameUpdate,i.OnMaterialUpdate,i.OnObjectUpdate,i.PCFShadowFilter,i.PI,i.PI2,i.PointShadowFilter,i.Return,i.Schlick_to_F0,i.ShaderNode,i.Stack,i.Switch,i.TBNViewMatrix,i.TWO_PI,i.VSMShadowFilter,i.V_GGX_SmithCorrelated,i.V_GGX_SmithCorrelated_Anisotropic,i.Var,i.VarIntent,i.abs,i.acesFilmicToneMapping,i.acos,i.acosh,i.add,i.addMethodChaining,i.addNodeElement,i.agxToneMapping,i.all,i.alphaT,i.ambientOcclusion,i.and,i.anisotropy,i.anisotropyB,i.anisotropyT,i.any,i.array,i.asin,i.asinh,i.assign,i.atan,i.atanh,i.atomicAdd,i.atomicAnd,i.atomicFunc,i.atomicLoad,i.atomicMax,i.atomicMin,i.atomicOr,i.atomicStore,i.atomicSub,i.atomicXor,i.attenuationColor,i.attenuationDistance,i.attribute,i.attributeArray,i.backgroundBlurriness,i.backgroundIntensity,i.backgroundRotation,i.batch,i.batchColor,i.batchIndirectIndex,i.bentNormalView,i.billboarding,i.bitAnd,i.bitNot,i.bitOr,i.bitXor,i.bitangentGeometry,i.bitangentLocal,i.bitangentView,i.bitangentViewFrame,i.bitangentWorld,i.bitcast,i.blendBurn,i.blendColor,i.blendDodge,i.blendOverlay,i.blendScreen,i.bool,i.buffer,i.bufferAttribute,i.builtin,i.builtinAOContext,i.builtinGIContext,i.builtinShadowContext,i.bumpMap,i.bvec2,i.bvec3,i.bvec4,i.bypass,i.cache,i.call,i.cameraFar,i.cameraIndex,i.cameraNear,i.cameraNormalMatrix;var R=i.cameraPosition;i.cameraProjectionMatrix,i.cameraProjectionMatrixInverse,i.cameraViewMatrix,i.cameraViewport,i.cameraWorldMatrix,i.cbrt,i.cdl,i.ceil,i.checker,i.cineonToneMapping,i.clamp,i.clearcoat,i.clearcoatNormalView,i.clearcoatRoughness,i.clipSpace,i.clipping,i.clippingAlpha,i.code,i.color,i.colorSpaceToWorking,i.colorToDirection,i.compute,i.computeKernel,i.computeSkinning,i.context,i.convert,i.convertColorSpace,i.convertToTexture,i.cos,i.cosh,i.countLeadingZeros,i.countOneBits,i.countTrailingZeros,i.cross,i.cubeTexture,i.cubeTextureBase,i.dFdx,i.dFdy,i.dashSize,i.debug,i.decrement,i.decrementBefore,i.defaultBuildStages,i.defaultShaderStages,i.defined,i.degrees,i.deltaTime,i.densityFogFactor,i.depth,i.depthPass,i.determinant,i.difference,i.diffuseColor,i.diffuseContribution,i.directPointLight,i.directionToColor,i.directionToFaceDirection,i.dispersion,i.distance,i.div,i.dot,i.dot4I8Packed,i.dot4U8Packed,i.drawIndex,i.dynamicBufferAttribute,i.element,i.emissive,i.equal,i.equirectDirection,i.equirectUV,i.exp,i.exp2,i.exponentialHeightFogFactor,i.expression,i.faceDirection,i.faceForward,i.faceforward;var z=i.float;i.floatBitsToInt,i.floatBitsToUint,i.floor,i.fog,i.fract,i.frameGroup,i.frameId,i.frontFacing,i.fwidth,i.gain,i.gapSize,i.getConstNodeType,i.getCurrentStack,i.getDistanceAttenuation,i.getGeometryRoughness,i.getNormalFromDepth,i.getParallaxCorrectNormal,i.getRoughness,i.getScreenPosition,i.getScreenPositionFromClip,i.getShIrradianceAt,i.getTextureIndex,i.getViewPosition,i.globalId,i.glsl,i.glslFn,i.grayscale,i.greaterThan,i.greaterThanEqual,i.hardwareClipping,i.hash,i.highpModelNormalViewMatrix,i.highpModelViewMatrix,i.hue,i.increment,i.incrementBefore,i.inspect,i.instance,i.instanceColor,i.instanceIndex,i.instancedArray,i.instancedBufferAttribute,i.instancedDynamicBufferAttribute,i.instancedMesh,i.int,i.intBitsToFloat,i.interleavedGradientNoise,i.inverse,i.inverseSqrt,i.inversesqrt,i.invocationLocalIndex,i.invocationSubgroupIndex,i.ior,i.iridescence,i.iridescenceIOR,i.iridescenceThickness,i.isolate,i.ivec2,i.ivec3,i.ivec4,i.js,i.label,i.length,i.lengthSq,i.lessThan,i.lessThanEqual,i.lightPosition,i.lightProjectionUV,i.lightShadowMatrix,i.lightTargetDirection,i.lightTargetPosition,i.lightViewPosition,i.lightingContext,i.lights,i.linearDepth,i.linearToneMapping,i.localId,i.log,i.log2,i.logarithmicDepthToViewZ,i.luminance,i.mat2,i.mat3,i.mat4,i.matcapUV,i.materialAO,i.materialAlphaTest,i.materialAnisotropy,i.materialAnisotropyVector,i.materialAttenuationColor,i.materialAttenuationDistance,i.materialClearcoat,i.materialClearcoatNormal,i.materialClearcoatRoughness,i.materialColor,i.materialDispersion,i.materialEmissive,i.materialEnvIntensity,i.materialEnvRotation,i.materialIOR,i.materialIridescence,i.materialIridescenceIOR,i.materialIridescenceThickness,i.materialLightMap,i.materialLineDashOffset,i.materialLineDashSize,i.materialLineGapSize,i.materialLineScale,i.materialLineWidth,i.materialMetalness,i.materialNormal,i.materialOpacity,i.materialPointSize,i.materialReference,i.materialReflectivity,i.materialRefractionRatio,i.materialRetroreflectivity,i.materialRotation,i.materialRoughness,i.materialSheen,i.materialSheenRoughness,i.materialShininess,i.materialSpecular,i.materialSpecularColor,i.materialSpecularIntensity,i.materialSpecularStrength,i.materialThickness,i.materialTransmission,i.max,i.maxMipLevel,i.mediumpModelViewMatrix,i.metalness;var B=i.min,V=i.mix;i.mixElement,i.mod,i.modelDirection,i.modelNormalMatrix,i.modelPosition,i.modelRadius,i.modelScale,i.modelViewMatrix,i.modelViewPosition,i.modelViewProjection,i.modelWorldMatrix,i.modelWorldMatrixInverse,i.morphReference,i.mrt,i.mul,i.mx_aastep,i.mx_add,i.mx_atan2,i.mx_cell_noise_float,i.mx_cell_noise_vec3,i.mx_contrast,i.mx_divide,i.mx_fractal_noise_float,i.mx_fractal_noise_float_2d,i.mx_fractal_noise_vec2,i.mx_fractal_noise_vec3,i.mx_fractal_noise_vec4,i.mx_frame,i.mx_heighttonormal,i.mx_hsvtorgb,i.mx_ifequal,i.mx_ifgreater,i.mx_ifgreatereq,i.mx_invert,i.mx_modulo,i.mx_multiply,i.mx_noise_float,i.mx_noise_vec3,i.mx_noise_vec4,i.mx_place2d,i.mx_power,i.mx_ramp4,i.mx_ramplr,i.mx_ramptb,i.mx_rgbtohsv,i.mx_rotate2d,i.mx_rotate3d,i.mx_safepower,i.mx_separate,i.mx_smoothstep,i.mx_splitlr,i.mx_splittb,i.mx_srgb_texture_to_lin_rec709,i.mx_subtract,i.mx_timer,i.mx_transform_uv,i.mx_unifiednoise2d,i.mx_unifiednoise3d,i.mx_worley_noise_float,i.mx_worley_noise_float_2d,i.mx_worley_noise_float_3d,i.mx_worley_noise_vec2,i.mx_worley_noise_vec3,i.mx_worley_noise_vec3_style,i.negate,i.negateOnBackSide,i.neutralToneMapping,i.nodeArray,i.nodeImmutable,i.nodeObject,i.nodeObjectIntent,i.nodeObjects,i.nodeProxy,i.nodeProxyConstructor,i.nodeProxyIntent,i.normalFlat,i.normalGeometry,i.normalLocal,i.normalMap,i.normalView,i.normalViewGeometry,i.normalWorld;var H=i.normalWorldGeometry;i.normalize,i.not,i.notEqual,i.numWorkgroups,i.objectDirection,i.objectGroup,i.objectPosition,i.objectRadius,i.objectScale,i.objectViewPosition,i.objectWorldMatrix,i.oneMinus,i.or,i.orthographicDepthToViewZ,i.oscSawtooth,i.oscSine,i.oscSquare,i.oscTriangle,i.output,i.outputStruct,i.overloadingFn,i.overrideNode,i.overrideNodes,i.pack4xI8,i.pack4xI8Clamp,i.pack4xU8,i.pack4xU8Clamp,i.packHalf2x16,i.packNormalToRGB,i.packSnorm2x16,i.packSnorm4x8,i.packUnorm2x16,i.packUnorm4x8,i.parabola,i.parallaxDirection,i.parallaxUV,i.parameter,i.pass,i.passTexture,i.pcurve,i.perspectiveDepthToViewZ,i.pmremTexture,i.pointShadow,i.pointUV,i.pointWidth,i.positionGeometry,i.positionLocal,i.positionPrevious;var U=i.positionView;i.positionViewDirection;var W=i.positionWorld;i.positionWorldDirection,i.posterize;var G=i.pow;i.pow2,i.pow3,i.pow4,i.premultiplyAlpha,i.property,i.quadBroadcast,i.quadSwapDiagonal,i.quadSwapX,i.quadSwapY,i.radians,i.rand,i.range,i.rangeFogFactor,i.reciprocal;var K=i.reference;i.referenceBuffer,i.reflect,i.reflectVector,i.reflectView,i.reflector,i.refract,i.refractVector,i.refractView,i.reinhardToneMapping,i.remap,i.remapClamp;var q=i.renderGroup;i.renderOutput,i.rendererReference,i.replaceDefaultUV,i.retroreflectivity,i.rotate,i.rotateUV,i.roughness,i.round,i.rtt;var J=i.sRGBTransferEOTF;i.sRGBTransferOETF,i.sample,i.sampler,i.samplerComparison;var Y=i.saturate;i.saturation;var X=i.screenCoordinate;i.screenDPR,i.screenSize,i.screenUV;var Z=i.select;i.setCurrentStack,i.setName,i.shaderStages;var Q=i.shadow;i.shadowPositionWorld,i.shapeCircle,i.sharedUniformGroup,i.sheen,i.sheenRoughness,i.shiftLeft,i.shiftRight,i.shininess,i.sign,i.sin,i.sinc,i.sinh,i.skinning;var te=i.smoothstep;i.smoothstepElement,i.specularColor,i.specularColorBlended,i.specularF90,i.spherizeUV,i.split,i.spritesheetUV,i.sqrt,i.stack,i.step,i.stepElement;var ne=i.storage;i.storageBarrier,i.storageElement,i.storageTexture,i.storageTexture3D,i.struct,i.sub,i.subBuild,i.subgroupAdd,i.subgroupAll,i.subgroupAnd,i.subgroupAny,i.subgroupBallot,i.subgroupBroadcast,i.subgroupBroadcastFirst,i.subgroupElect,i.subgroupExclusiveAdd,i.subgroupExclusiveMul,i.subgroupInclusiveAdd,i.subgroupInclusiveMul,i.subgroupIndex,i.subgroupMax,i.subgroupMin,i.subgroupMul,i.subgroupOr,i.subgroupShuffle,i.subgroupShuffleDown,i.subgroupShuffleUp,i.subgroupShuffleXor,i.subgroupSize,i.subgroupXor,i.tan,i.tangentGeometry,i.tangentLocal,i.tangentView,i.tangentViewFrame,i.tangentWorld,i.tanh,i.texture,i.texture3D,i.texture3DLevel,i.texture3DLoad,i.textureBarrier,i.textureBicubic,i.textureBicubicLevel,i.textureLevel,i.textureLoad,i.textureSize,i.textureStore,i.thickness,i.time,i.toneMapping,i.toneMappingExposure,i.toonOutlinePass,i.transformDirection,i.transformNormal,i.transformNormalByInverseViewMatrix,i.transformNormalByViewMatrix,i.transformNormalToView,i.transformedClearcoatNormalView,i.transformedNormalView,i.transformedNormalWorld,i.transmission,i.transpose,i.triNoise3D,i.triplanarTexture,i.triplanarTextures,i.trunc;var re=i.uint;i.uintBitsToFloat;var ie=i.uniform;i.uniformArray,i.uniformCubeTexture,i.uniformFlow,i.uniformGroup,i.uniformTexture,i.unpack4xI8,i.unpack4xU8,i.unpackHalf2x16,i.unpackNormal,i.unpackRGBToNormal,i.unpackSnorm2x16,i.unpackSnorm4x8,i.unpackUnorm2x16;var $=i.unpackUnorm4x8;i.unpremultiplyAlpha,i.userData,i.uv;var ae=i.uvec2;i.uvec3,i.uvec4,i.varying,i.varyingProperty;var oe=i.vec2,se=i.vec3,ce=i.vec4;i.vectorComponents,i.velocity,i.vertexColor;var le=i.vertexIndex;i.vertexStage,i.vibrance,i.viewZToLogarithmicDepth;var ue=i.viewZToOrthographicDepth;i.viewZToPerspectiveDepth,i.viewZToReversedOrthographicDepth,i.viewZToReversedPerspectiveDepth,i.viewport,i.viewportCoordinate,i.viewportDepthTexture,i.viewportLinearDepth,i.viewportMipTexture,i.viewportOpaqueMipTexture,i.viewportSafeUV,i.viewportSharedTexture,i.viewportSize,i.viewportTexture,i.viewportUV,i.vogelDiskSample,i.wgsl;var de=i.wgslFn;i.workgroupArray,i.workgroupBarrier,i.workgroupId,i.workingToColorSpace,i.xor;export{F as A,ae as C,le as D,ce as E,k as M,d as N,ue as O,_ as P,$ as S,se as T,Q as _,B as a,re as b,U as c,K as d,q as f,Z as g,X as h,z as i,O as j,de as k,W as l,Y as m,L as n,V as o,J as p,R as r,H as s,I as t,G as u,te as v,oe as w,ie as x,ne as y};