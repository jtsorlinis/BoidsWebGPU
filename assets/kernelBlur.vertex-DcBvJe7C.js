import{t as e}from"./shaderStore-B3CsX8Dt.js";import"./kernelBlurVaryingDeclaration-DJFp-rf7.js";var t=`kernelBlurVertex`,n=`vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};`;e.IncludesShadersStoreWGSL[t]||(e.IncludesShadersStoreWGSL[t]=n);var r=`kernelBlurVertexShader`,i=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(vertexInputs.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;e.ShadersStoreWGSL[r]||(e.ShadersStoreWGSL[r]=i);var a={name:r,shader:i};export{a as kernelBlurVertexShaderWGSL};