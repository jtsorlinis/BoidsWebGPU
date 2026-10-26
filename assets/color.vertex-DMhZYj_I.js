import{Ct as e,St as t,bt as n,xt as r}from"./computeShader-BqU1fTyk.js";import{t as i}from"./shaderStore-D-XQlhUT.js";import{i as a,n as o,r as s,t as c}from"./clipPlaneVertex-B1wJvZTt.js";import{n as l,t as u}from"./fogVertex-DNAMrhb0.js";import{t as d}from"./vertexColorMixing-UCrnwszu.js";var f=`colorVertexShader`,p=`attribute position: vec3f;
#ifdef VERTEXCOLOR
attribute color: vec4f;
#endif
#include<bonesDeclaration>
#include<bakedVertexAnimationDeclaration>
#include<clipPlaneVertexDeclaration>
#include<fogVertexDeclaration>
#ifdef FOG
uniform view: mat4x4f;
#endif
#include<instancesDeclaration>
uniform viewProjection: mat4x4f;
#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
varying vColor: vec4f;
#endif
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {
#define CUSTOM_VERTEX_MAIN_BEGIN
#ifdef VERTEXCOLOR
var colorUpdated: vec4f=vertexInputs.color;
#endif
#include<instancesVertex>
#include<bonesVertex>
#include<bakedVertexAnimation>
var worldPos: vec4f=finalWorld* vec4f(vertexInputs.position,1.0);vertexOutputs.position=uniforms.viewProjection*worldPos;
#include<clipPlaneVertex>
#include<fogVertex>
#include<vertexColorMixing>
#define CUSTOM_VERTEX_MAIN_END
}`;i.ShadersStoreWGSL[f]||(i.ShadersStoreWGSL[f]=p);var m=[a,e,s,l,t,r,o,n,c,u,d];for(let e of m)i.IncludesShadersStoreWGSL[e.name]||(i.IncludesShadersStoreWGSL[e.name]=e.shader);var h={name:f,shader:p};export{h as colorVertexShaderWGSL};