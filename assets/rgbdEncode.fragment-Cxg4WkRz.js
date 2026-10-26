import{Tt as e}from"./computeShader-BqU1fTyk.js";import{t}from"./shaderStore-D-XQlhUT.js";var n=`rgbdEncodePixelShader`,r=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=toRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV).rgb);}`;t.ShadersStoreWGSL[n]||(t.ShadersStoreWGSL[n]=r);var i=[e];for(let e of i)t.IncludesShadersStoreWGSL[e.name]||(t.IncludesShadersStoreWGSL[e.name]=e.shader);var a={name:n,shader:r};export{a as rgbdEncodePixelShaderWGSL};