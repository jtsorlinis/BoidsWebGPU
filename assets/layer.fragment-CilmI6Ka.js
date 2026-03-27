import{t as e}from"./shaderStore-B3CsX8Dt.js";import"./helperFunctions-BvNOocrJ.js";var t=`layerPixelShader`,n=`varying vUV: vec2f;var textureSamplerSampler: sampler;var textureSampler: texture_2d<f32>;uniform color: vec4f;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
var baseColor: vec4f=textureSample(textureSampler,textureSamplerSampler,input.vUV);
#if defined(CONVERT_TO_GAMMA)
baseColor=toGammaSpace(baseColor);
#elif defined(CONVERT_TO_LINEAR)
baseColor=toLinearSpaceVec4(baseColor);
#endif
#ifdef ALPHATEST
if (baseColor.a<0.4) {discard;}
#endif
fragmentOutputs.color=baseColor*uniforms.color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStoreWGSL[t]||(e.ShadersStoreWGSL[t]=n);var r={name:t,shader:n};export{r as layerPixelShaderWGSL};