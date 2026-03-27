import{t as e}from"./shaderStore-B3CsX8Dt.js";import"./helperFunctions-BvNOocrJ.js";var t=`rgbdDecodePixelShader`,n=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {fragmentOutputs.color=vec4f(fromRGBD(textureSample(textureSampler,textureSamplerSampler,input.vUV)),1.0);}`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=n);var r={name:t,shader:n};export{r as rgbdDecodePixelShaderWGSL};