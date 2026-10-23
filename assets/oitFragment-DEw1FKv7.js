import{t as e}from"./shaderStore-D-XQlhUT.js";import"./objectIdFunctions-MgUpLma1.js";var t=`decalFragmentDeclaration`,n=`#ifdef DECAL
uniform vec4 vDecalInfos;
#endif
`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=n);var r={name:t,shader:n},i=`prePassDeclaration`,a=`#ifdef PREPASS
#extension GL_EXT_draw_buffers : require
#ifdef PREPASS_MESH_BLEND_TAG
#if {X}>0
#if PREPASS_MESH_BLEND_TAG_INDEX==0
layout(location=0) out highp uvec4 meshBlendTagOutput;
#else
layout(location=0) out highp vec4 glFragData0;
#endif
#endif
#if {X}>1
#if PREPASS_MESH_BLEND_TAG_INDEX==1
layout(location=1) out highp uvec4 meshBlendTagOutput;
#else
layout(location=1) out highp vec4 glFragData1;
#endif
#endif
#if {X}>2
#if PREPASS_MESH_BLEND_TAG_INDEX==2
layout(location=2) out highp uvec4 meshBlendTagOutput;
#else
layout(location=2) out highp vec4 glFragData2;
#endif
#endif
#if {X}>3
#if PREPASS_MESH_BLEND_TAG_INDEX==3
layout(location=3) out highp uvec4 meshBlendTagOutput;
#else
layout(location=3) out highp vec4 glFragData3;
#endif
#endif
#if {X}>4
#if PREPASS_MESH_BLEND_TAG_INDEX==4
layout(location=4) out highp uvec4 meshBlendTagOutput;
#else
layout(location=4) out highp vec4 glFragData4;
#endif
#endif
#if {X}>5
#if PREPASS_MESH_BLEND_TAG_INDEX==5
layout(location=5) out highp uvec4 meshBlendTagOutput;
#else
layout(location=5) out highp vec4 glFragData5;
#endif
#endif
#if {X}>6
#if PREPASS_MESH_BLEND_TAG_INDEX==6
layout(location=6) out highp uvec4 meshBlendTagOutput;
#else
layout(location=6) out highp vec4 glFragData6;
#endif
#endif
#if {X}>7
#if PREPASS_MESH_BLEND_TAG_INDEX==7
layout(location=7) out highp uvec4 meshBlendTagOutput;
#else
layout(location=7) out highp vec4 glFragData7;
#endif
#endif
void writeGeometryFragmentOutput(highp int index,highp vec4 value) {
#if {X}>0 && PREPASS_MESH_BLEND_TAG_INDEX != 0
if (index==0) { glFragData0=value; }
#endif
#if {X}>1 && PREPASS_MESH_BLEND_TAG_INDEX != 1
if (index==1) { glFragData1=value; }
#endif
#if {X}>2 && PREPASS_MESH_BLEND_TAG_INDEX != 2
if (index==2) { glFragData2=value; }
#endif
#if {X}>3 && PREPASS_MESH_BLEND_TAG_INDEX != 3
if (index==3) { glFragData3=value; }
#endif
#if {X}>4 && PREPASS_MESH_BLEND_TAG_INDEX != 4
if (index==4) { glFragData4=value; }
#endif
#if {X}>5 && PREPASS_MESH_BLEND_TAG_INDEX != 5
if (index==5) { glFragData5=value; }
#endif
#if {X}>6 && PREPASS_MESH_BLEND_TAG_INDEX != 6
if (index==6) { glFragData6=value; }
#endif
#if {X}>7 && PREPASS_MESH_BLEND_TAG_INDEX != 7
if (index==7) { glFragData7=value; }
#endif
}
#define WRITE_GEOMETRY_FRAGMENT_OUTPUT(INDEX,VALUE) writeGeometryFragmentOutput(INDEX,VALUE)
#else
layout(location=0) out highp vec4 glFragData[{X}];
#define WRITE_GEOMETRY_FRAGMENT_OUTPUT(INDEX,VALUE) gl_FragData[INDEX]=VALUE
#endif
highp vec4 gl_FragColor;
#ifndef PREPASS_CUSTOM_VARYINGS
#ifdef PREPASS_LOCAL_POSITION
varying highp vec3 vPosition;
#endif
#ifdef PREPASS_DEPTH
varying highp vec3 vViewPos;
#endif
#ifdef PREPASS_NORMALIZED_VIEW_DEPTH
varying highp float vNormViewDepth;
#endif
#if (defined(PREPASS_VELOCITY) || defined(PREPASS_VELOCITY_LINEAR)) && !defined(PREPASS_VELOCITY_ZERO)
varying highp vec4 vCurrentPosition;varying highp vec4 vPreviousPosition;
#endif
#endif
#ifdef PREPASS_OBJECT_ID
uniform highp float objectId;
#include<objectIdFunctions>
#endif
#ifdef PREPASS_MESH_BLEND_TAG
uniform highp int meshBlendTag;
#endif
#endif
`;e.IncludesShadersStore[i]||(e.IncludesShadersStore[i]=a);var o={name:i,shader:a},s=`oitDeclaration`,c=`#ifdef ORDER_INDEPENDENT_TRANSPARENCY
#extension GL_EXT_draw_buffers : require
layout(location=0) out vec2 depth; 
layout(location=1) out vec4 frontColor;layout(location=2) out vec4 backColor;
#define MAX_DEPTH 99999.0
highp vec4 gl_FragColor;uniform highp sampler2D oitDepthSampler;uniform sampler2D oitFrontColorSampler;
#endif
`;e.IncludesShadersStore[s]||(e.IncludesShadersStore[s]=c);var l={name:s,shader:c},u=`samplerFragmentDeclaration`,d=`#ifdef _DEFINENAME_
#if _DEFINENAME_DIRECTUV==1
#define v_VARYINGNAME_UV vMainUV1
#elif _DEFINENAME_DIRECTUV==2
#define v_VARYINGNAME_UV vMainUV2
#elif _DEFINENAME_DIRECTUV==3
#define v_VARYINGNAME_UV vMainUV3
#elif _DEFINENAME_DIRECTUV==4
#define v_VARYINGNAME_UV vMainUV4
#elif _DEFINENAME_DIRECTUV==5
#define v_VARYINGNAME_UV vMainUV5
#elif _DEFINENAME_DIRECTUV==6
#define v_VARYINGNAME_UV vMainUV6
#else
varying vec2 v_VARYINGNAME_UV;
#endif
uniform sampler2D _SAMPLERNAME_Sampler;
#endif
`;e.IncludesShadersStore[u]||(e.IncludesShadersStore[u]=d);var f={name:u,shader:d},p=`textureRepetitionFunctions`,m=`#if TEXTURE_REPETITION_MODE>0
vec4 _texRepHash4(vec2 p) {return fract(sin(vec4(
1.0+dot(p,vec2(37.0,17.0)),
2.0+dot(p,vec2(11.0,47.0)),
3.0+dot(p,vec2(41.0,29.0)),
4.0+dot(p,vec2(23.0,31.0))
))*103.0);}
#endif
#if TEXTURE_REPETITION_MODE==1
vec4 _texRepSample(sampler2D samp,vec2 uv) {float k=texture2D(samp,0.005*uv).x;float index=k*8.0;float f=fract(index);float i=floor(index+0.5);float ib=floor(index);f=min(f,1.0-f)*2.0;vec2 offa=sin(vec2(3.0,7.0)*i);vec2 offb=sin(vec2(3.0,7.0)*ib);vec2 dx=dFdx(uv);vec2 dy=dFdy(uv);vec4 cola=textureGrad(samp,uv+0.3*offa,dx,dy);vec4 colb=textureGrad(samp,uv+0.3*offb,dx,dy);float colSum=cola.x+cola.y+cola.z-colb.x-colb.y-colb.z;return mix(cola,colb,smoothstep(0.2,0.8,f-0.1*colSum));}
#elif TEXTURE_REPETITION_MODE==2
#ifndef TEXTURE_REPETITION_M_PI
#define TEXTURE_REPETITION_M_PI 3.14159265358979
#endif
vec2 _texRepHexHash(vec2 p) {vec2 r=mat2(127.1,269.5,311.7,183.3)*p;return fract(sin(r)*43758.5453);}
void _texRepTriangleGrid(
out float w1,out float w2,out float w3,
out ivec2 vertex1,out ivec2 vertex2,out ivec2 vertex3,
vec2 st
) {st*=2.0*sqrt(3.0);mat2 gridToSkewedGrid=mat2(1.0,0.0,-0.57735027,1.15470054);vec2 skewedCoord=gridToSkewedGrid*st;ivec2 baseId=ivec2(floor(skewedCoord));vec3 temp=vec3(fract(skewedCoord),0.0);temp.z=1.0-temp.x-temp.y;float s=step(0.0,-temp.z);float s2=2.0*s-1.0;w1=-temp.z*s2;w2=s-temp.y*s2;w3=s-temp.x*s2;vertex1=baseId+ivec2(int(s),int(s));vertex2=baseId+ivec2(int(s),int(1.0-s));vertex3=baseId+ivec2(int(1.0-s),int(s));}
vec2 _texRepMakeCenST(ivec2 Vertex) {mat2 invSkewMat=mat2(1.0,0.0,0.5,1.0/1.15470054);return (invSkewMat*vec2(Vertex))/(2.0*sqrt(3.0));}
mat2 _texRepLoadRot2x2(ivec2 idx,float rotStr) {float angle=float(abs(idx.x*idx.y)+abs(idx.x+idx.y))+TEXTURE_REPETITION_M_PI;angle=mod(angle,2.0*TEXTURE_REPETITION_M_PI);if (angle<0.0) angle+=2.0*TEXTURE_REPETITION_M_PI;if (angle>TEXTURE_REPETITION_M_PI) angle-=TEXTURE_REPETITION_M_PI;angle*=rotStr;float cs=cos(angle);float si=sin(angle);return mat2(cs,si,-si,cs);}
vec3 _texRepGain3(vec3 x,float r) {float k=log(1.0-r)/log(0.5);vec3 s=2.0*step(0.5,x);vec3 m=2.0*(1.0-s);vec3 res=0.5*s+0.25*m*pow(max(vec3(0.0),s+x*m),vec3(k));return res/(res.x+res.y+res.z);}
vec4 _texRepSample(sampler2D samp,vec2 uv) {float rotStrength=vTextureRepetitionHexTilingParams.x;float fallOffContrast=vTextureRepetitionHexTilingParams.y;float expVal=vTextureRepetitionHexTilingParams.z;float r=vTextureRepetitionHexTilingParams.w;vec2 dSTdx=dFdx(uv);vec2 dSTdy=dFdy(uv);float w1,w2,w3;ivec2 vertex1,vertex2,vertex3;_texRepTriangleGrid(w1,w2,w3,vertex1,vertex2,vertex3,uv);mat2 rot1=_texRepLoadRot2x2(vertex1,rotStrength);mat2 rot2=_texRepLoadRot2x2(vertex2,rotStrength);mat2 rot3=_texRepLoadRot2x2(vertex3,rotStrength);vec2 cen1=_texRepMakeCenST(vertex1);vec2 cen2=_texRepMakeCenST(vertex2);vec2 cen3=_texRepMakeCenST(vertex3);vec2 st1=(uv-cen1)*rot1+cen1+_texRepHexHash(vec2(vertex1));vec2 st2=(uv-cen2)*rot2+cen2+_texRepHexHash(vec2(vertex2));vec2 st3=(uv-cen3)*rot3+cen3+_texRepHexHash(vec2(vertex3));vec4 c1=textureGrad(samp,st1,dSTdx*rot1,dSTdy*rot1);vec4 c2=textureGrad(samp,st2,dSTdx*rot2,dSTdy*rot2);vec4 c3=textureGrad(samp,st3,dSTdx*rot3,dSTdy*rot3);vec3 Lw=vec3(0.299,0.587,0.114);vec3 Dw=vec3(dot(c1.rgb,Lw),dot(c2.rgb,Lw),dot(c3.rgb,Lw));Dw=mix(vec3(1.0),Dw,fallOffContrast);vec3 W=Dw*pow(vec3(w1,w2,w3),vec3(expVal));W/=(W.x+W.y+W.z);if (r != 0.5) {W=_texRepGain3(W,r);}
return W.x*c1+W.y*c2+W.z*c3;}
#elif TEXTURE_REPETITION_MODE==3
vec4 _texRepSample(sampler2D samp,vec2 uv) {vec2 iuv=floor(uv);vec2 fuv=fract(uv);vec4 ofa=_texRepHash4(iuv+vec2(0.0,0.0));vec4 ofb=_texRepHash4(iuv+vec2(1.0,0.0));vec4 ofc=_texRepHash4(iuv+vec2(0.0,1.0));vec4 ofd=_texRepHash4(iuv+vec2(1.0,1.0));vec2 dx=dFdx(uv);vec2 dy=dFdy(uv);ofa.zw=sign(ofa.zw-0.5);ofb.zw=sign(ofb.zw-0.5);ofc.zw=sign(ofc.zw-0.5);ofd.zw=sign(ofd.zw-0.5);vec2 uva=uv*ofa.zw+ofa.xy; vec2 ddxa=dx*ofa.zw; vec2 ddya=dy*ofa.zw;vec2 uvb=uv*ofb.zw+ofb.xy; vec2 ddxb=dx*ofb.zw; vec2 ddyb=dy*ofb.zw;vec2 uvc=uv*ofc.zw+ofc.xy; vec2 ddxc=dx*ofc.zw; vec2 ddyc=dy*ofc.zw;vec2 uvd=uv*ofd.zw+ofd.xy; vec2 ddxd=dx*ofd.zw; vec2 ddyd=dy*ofd.zw;vec2 b=smoothstep(0.25,0.75,fuv);return mix(
mix(textureGrad(samp,uva,ddxa,ddya),textureGrad(samp,uvb,ddxb,ddyb),b.x),
mix(textureGrad(samp,uvc,ddxc,ddyc),textureGrad(samp,uvd,ddxd,ddyd),b.x),
b.y
);}
#elif TEXTURE_REPETITION_MODE==4
vec4 _texRepSample(sampler2D samp,vec2 uv) {vec2 p=floor(uv);vec2 f=fract(uv);vec2 dx=dFdx(uv);vec2 dy=dFdy(uv);vec4 va=vec4(0.0);float wt=0.0;float w2=0.0;for (int j=-1; j<=1; j++) {for (int i=-1; i<=1; i++) {vec2 g=vec2(float(i),float(j));vec4 o=_texRepHash4(p+g);vec2 r=g-f+o.xy;float d=dot(r,r);float w=exp(-5.0*d);vec4 c=textureGrad(samp,uv+o.zw,dx,dy);va+=w*c;wt+=w;w2+=w*w;}}
float mean=0.3;vec4 res=mean+(va-wt*mean)/sqrt(w2);return mix(va/wt,res,0.4);}
#endif
#if TEXTURE_REPETITION_MODE>0
#define TEXRD(s,uv) _texRepSample(s,uv)
#else
#define TEXRD(s,uv) texture2D(s,uv)
#endif
#define TEXRD_DEFINED
`;e.IncludesShadersStore[p]||(e.IncludesShadersStore[p]=m);var h={name:p,shader:m},g=`bumpFragmentMainFunctions`,_=`#ifndef TEXRD_DEFINED
#define TEXRD(s,uv) texture2D(s,uv)
#define TEXRD_DEFINED
#endif
#if defined(BUMP) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC) || defined(DETAIL)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#ifdef OBJECTSPACE_NORMALMAP
uniform mat4 normalMatrix;
#if defined(WEBGL2) || defined(WEBGPU)
mat4 toNormalMatrix(mat4 wMatrix)
{mat4 ret=inverse(wMatrix);ret=transpose(ret);ret[0][3]=0.;ret[1][3]=0.;ret[2][3]=0.;ret[3]=vec4(0.,0.,0.,1.);return ret;}
#else
mat4 toNormalMatrix(mat4 m)
{float
a00=m[0][0],a01=m[0][1],a02=m[0][2],a03=m[0][3],
a10=m[1][0],a11=m[1][1],a12=m[1][2],a13=m[1][3],
a20=m[2][0],a21=m[2][1],a22=m[2][2],a23=m[2][3],
a30=m[3][0],a31=m[3][1],a32=m[3][2],a33=m[3][3],
b00=a00*a11-a01*a10,
b01=a00*a12-a02*a10,
b02=a00*a13-a03*a10,
b03=a01*a12-a02*a11,
b04=a01*a13-a03*a11,
b05=a02*a13-a03*a12,
b06=a20*a31-a21*a30,
b07=a20*a32-a22*a30,
b08=a20*a33-a23*a30,
b09=a21*a32-a22*a31,
b10=a21*a33-a23*a31,
b11=a22*a33-a23*a32,
det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;mat4 mi=mat4(
a11*b11-a12*b10+a13*b09,
a02*b10-a01*b11-a03*b09,
a31*b05-a32*b04+a33*b03,
a22*b04-a21*b05-a23*b03,
a12*b08-a10*b11-a13*b07,
a00*b11-a02*b08+a03*b07,
a32*b02-a30*b05-a33*b01,
a20*b05-a22*b02+a23*b01,
a10*b10-a11*b08+a13*b06,
a01*b08-a00*b10-a03*b06,
a30*b04-a31*b02+a33*b00,
a21*b02-a20*b04-a23*b00,
a11*b07-a10*b09-a12*b06,
a00*b09-a01*b07+a02*b06,
a31*b01-a30*b03-a32*b00,
a20*b03-a21*b01+a22*b00)/det;return mat4(mi[0][0],mi[1][0],mi[2][0],mi[3][0],
mi[0][1],mi[1][1],mi[2][1],mi[3][1],
mi[0][2],mi[1][2],mi[2][2],mi[3][2],
mi[0][3],mi[1][3],mi[2][3],mi[3][3]);}
#endif
#endif
vec3 perturbNormalBase(mat3 cotangentFrame,vec3 normal,float scale)
{
#ifdef NORMALXYSCALE
normal=normalize(normal*vec3(scale,scale,1.0));
#endif
return normalize(cotangentFrame*normal);}
vec3 perturbNormal(mat3 cotangentFrame,vec3 textureSample,float scale)
{return perturbNormalBase(cotangentFrame,textureSample*2.0-1.0,scale);}
mat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv,vec2 tangentSpaceParams)
{vec3 dp1=dFdx(p);vec3 dp2=dFdy(p);vec2 duv1=dFdx(uv);vec2 duv2=dFdy(uv);vec3 dp2perp=cross(dp2,normal);vec3 dp1perp=cross(normal,dp1);vec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;vec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;tangent*=tangentSpaceParams.x;bitangent*=tangentSpaceParams.y;float det=max(dot(tangent,tangent),dot(bitangent,bitangent));float invmax=det==0.0 ? 0.0 : inversesqrt(det);return mat3(tangent*invmax,bitangent*invmax,normal);}
#endif
`;e.IncludesShadersStore[g]||(e.IncludesShadersStore[g]=_);var v={name:g,shader:_},y=`bumpFragmentFunctions`,b=`#if defined(BUMP)
#include<samplerFragmentDeclaration>(_DEFINENAME_,BUMP,_VARYINGNAME_,Bump,_SAMPLERNAME_,bump)
#endif
#if defined(DETAIL)
#include<samplerFragmentDeclaration>(_DEFINENAME_,DETAIL,_VARYINGNAME_,Detail,_SAMPLERNAME_,detail)
#endif
#if defined(BUMP) && defined(PARALLAX)
const float minSamples=4.;const float maxSamples=15.;const int iMaxSamples=15;vec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {float parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;parallaxLimit*=parallaxScale;vec2 vOffsetDir=normalize(vViewDirCoT.xy);vec2 vMaxOffset=vOffsetDir*parallaxLimit;float numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));float stepSize=1.0/numSamples;float currRayHeight=1.0;vec2 vCurrOffset=vec2(0,0);vec2 vLastOffset=vec2(0,0);float lastSampledHeight=1.0;float currSampledHeight=1.0;bool keepWorking=true;for (int i=0; i<iMaxSamples; i++)
{currSampledHeight=texture2D(bumpSampler,texCoord+vCurrOffset).w;if (!keepWorking)
{}
else if (currSampledHeight>currRayHeight)
{float delta1=currSampledHeight-currRayHeight;float delta2=(currRayHeight+stepSize)-lastSampledHeight;float ratio=delta1/(delta1+delta2);vCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;keepWorking=false;}
else
{currRayHeight-=stepSize;vLastOffset=vCurrOffset;
#ifdef PARALLAX_RHS
vCurrOffset-=stepSize*vMaxOffset;
#else
vCurrOffset+=stepSize*vMaxOffset;
#endif
lastSampledHeight=currSampledHeight;}}
return vCurrOffset;}
vec2 parallaxOffset(vec3 viewDir,float heightScale)
{float height=texture2D(bumpSampler,vBumpUV).w;vec2 texCoordOffset=heightScale*viewDir.xy*height;
#ifdef PARALLAX_RHS
return texCoordOffset;
#else
return -texCoordOffset;
#endif
}
#endif
`;e.IncludesShadersStore[y]||(e.IncludesShadersStore[y]=b);var x={name:y,shader:b},S=`bumpFragment`,C=`vec2 uvOffset=vec2(0.0,0.0);
#if defined(BUMP) || defined(PARALLAX) || defined(DETAIL)
#ifdef NORMALXYSCALE
float normalScale=1.0;
#elif defined(BUMP)
float normalScale=vBumpInfos.y;
#else
float normalScale=1.0;
#endif
#if defined(TANGENT) && defined(NORMAL)
mat3 TBN=vTBN;
#elif defined(BUMP)
vec2 TBNUV=gl_FrontFacing ? vBumpUV : -vBumpUV;mat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,TBNUV,vTangentSpaceParams);
#else
vec2 TBNUV=gl_FrontFacing ? vDetailUV : -vDetailUV;mat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,TBNUV,vec2(1.,1.));
#endif
#elif defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL)
mat3 TBN=vTBN;
#else
vec2 TBNUV=gl_FrontFacing ? vMainUV1 : -vMainUV1;mat3 TBN=cotangent_frame(normalW,vPositionW,TBNUV,vec2(1.,1.));
#endif
#endif
#ifdef PARALLAX
mat3 invTBN=transposeMat3(TBN);
#ifdef PARALLAXOCCLUSION
uvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);
#else
uvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);
#endif
#endif
#ifdef DETAIL
vec4 detailColor=texture2D(detailSampler,vDetailUV+uvOffset);vec2 detailNormalRG=detailColor.wy*2.0-1.0;float detailNormalB=sqrt(1.-saturate(dot(detailNormalRG,detailNormalRG)));vec3 detailNormal=vec3(detailNormalRG,detailNormalB);
#endif
#ifdef BUMP
#ifdef OBJECTSPACE_NORMALMAP
#define CUSTOM_FRAGMENT_BUMP_FRAGMENT
normalW=normalize(TEXRD(bumpSampler,vBumpUV).xyz *2.0-1.0);normalW=normalize(mat3(normalMatrix)*normalW);
#elif !defined(DETAIL)
normalW=perturbNormal(TBN,TEXRD(bumpSampler,vBumpUV+uvOffset).xyz,vBumpInfos.y);
#else
vec3 bumpNormal=TEXRD(bumpSampler,vBumpUV+uvOffset).xyz*2.0-1.0;
#if DETAIL_NORMALBLENDMETHOD==0 
detailNormal.xy*=vDetailInfos.z;vec3 blendedNormal=normalize(vec3(bumpNormal.xy+detailNormal.xy,bumpNormal.z*detailNormal.z));
#elif DETAIL_NORMALBLENDMETHOD==1 
detailNormal.xy*=vDetailInfos.z;bumpNormal+=vec3(0.0,0.0,1.0);detailNormal*=vec3(-1.0,-1.0,1.0);vec3 blendedNormal=bumpNormal*dot(bumpNormal,detailNormal)/bumpNormal.z-detailNormal;
#endif
normalW=perturbNormalBase(TBN,blendedNormal,vBumpInfos.y);
#endif
#elif defined(DETAIL)
detailNormal.xy*=vDetailInfos.z;normalW=perturbNormalBase(TBN,detailNormal,vDetailInfos.z);
#endif
`;e.IncludesShadersStore[S]||(e.IncludesShadersStore[S]=C);var w={name:S,shader:C},T=`decalFragment`,E=`#ifdef DECAL
#ifdef GAMMADECAL
decalColor.rgb=toLinearSpace(decalColor.rgb);
#endif
#ifdef DECAL_SMOOTHALPHA
decalColor.a*=decalColor.a;
#endif
surfaceAlbedo.rgb=mix(surfaceAlbedo.rgb,decalColor.rgb,decalColor.a);
#endif
`;e.IncludesShadersStore[T]||(e.IncludesShadersStore[T]=E);var D={name:T,shader:E},O=`depthPrePass`,k=`#ifdef DEPTHPREPASS
gl_FragColor=vec4(0.,0.,0.,1.0);return;
#endif
`;e.IncludesShadersStore[O]||(e.IncludesShadersStore[O]=k);var A={name:O,shader:k},j=`oitFragment`,M=`#ifdef ORDER_INDEPENDENT_TRANSPARENCY
float fragDepth=gl_FragCoord.z; 
#ifdef ORDER_INDEPENDENT_TRANSPARENCY_16BITS
uint halfFloat=packHalf2x16(vec2(fragDepth));vec2 full=unpackHalf2x16(halfFloat);fragDepth=full.x;
#endif
ivec2 fragCoord=ivec2(gl_FragCoord.xy);vec2 lastDepth=texelFetch(oitDepthSampler,fragCoord,0).rg;vec4 lastFrontColor=texelFetch(oitFrontColorSampler,fragCoord,0);depth.rg=vec2(-MAX_DEPTH);frontColor=lastFrontColor;backColor=vec4(0.0);
#ifdef USE_REVERSE_DEPTHBUFFER
float furthestDepth=-lastDepth.x;float nearestDepth=lastDepth.y;
#else
float nearestDepth=-lastDepth.x;float furthestDepth=lastDepth.y;
#endif
float alphaMultiplier=1.0-lastFrontColor.a;
#ifdef USE_REVERSE_DEPTHBUFFER
if (fragDepth>nearestDepth || fragDepth<furthestDepth) {
#else
if (fragDepth<nearestDepth || fragDepth>furthestDepth) {
#endif
return;}
#ifdef USE_REVERSE_DEPTHBUFFER
if (fragDepth<nearestDepth && fragDepth>furthestDepth) {
#else
if (fragDepth>nearestDepth && fragDepth<furthestDepth) {
#endif
depth.rg=vec2(-fragDepth,fragDepth);return;}
#endif
`;e.IncludesShadersStore[j]||(e.IncludesShadersStore[j]=M);var N={name:j,shader:M};export{x as a,f as c,r as d,w as i,l,A as n,v as o,D as r,h as s,N as t,o as u};