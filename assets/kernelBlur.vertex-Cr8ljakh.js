import{t as e}from"./shaderStore-D-XQlhUT.js";import{t}from"./kernelBlurVaryingDeclaration-g2Ge9lzd.js";var n=`kernelBlurVertex`,r=`vertexOutputs.sampleCoord{X}=vertexOutputs.sampleCenter+uniforms.delta*KERNEL_OFFSET{X};`;e.IncludesShadersStoreWGSL[n]||(e.IncludesShadersStoreWGSL[n]=r);var i={name:n,shader:r},a=`kernelBlurVertexShader`,o=`attribute position: vec2f;uniform delta: vec2f;varying sampleCenter: vec2f;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
#define CUSTOM_VERTEX_DEFINITIONS
@vertex
fn main(input : VertexInputs)->FragmentInputs {const madd: vec2f= vec2f(0.5,0.5);
#define CUSTOM_VERTEX_MAIN_BEGIN
vertexOutputs.sampleCenter=(vertexInputs.position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
vertexOutputs.position= vec4f(vertexInputs.position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;e.ShadersStoreWGSL[a]||(e.ShadersStoreWGSL[a]=o);var s=[t,i];for(let t of s)e.IncludesShadersStoreWGSL[t.name]||(e.IncludesShadersStoreWGSL[t.name]=t.shader);var c={name:a,shader:o};export{c as kernelBlurVertexShaderWGSL};