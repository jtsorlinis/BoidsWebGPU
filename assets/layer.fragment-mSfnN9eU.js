import{t as e}from"./shaderStore-D-XQlhUT.js";import{helperFunctions as t}from"./helperFunctions-Cz12B3WM.js";var n=`layerPixelShader`,r=`varying vec2 vUV;uniform sampler2D textureSampler;uniform vec4 color;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) {
#define CUSTOM_FRAGMENT_MAIN_BEGIN
vec4 baseColor=texture2D(textureSampler,vUV);
#if defined(CONVERT_TO_GAMMA)
baseColor.rgb=toGammaSpace(baseColor.rgb);
#elif defined(CONVERT_TO_LINEAR)
baseColor.rgb=toLinearSpace(baseColor.rgb);
#endif
#ifdef ALPHATEST
if (baseColor.a<0.4)
discard;
#endif
gl_FragColor=baseColor*color;
#define CUSTOM_FRAGMENT_MAIN_END
}`;e.ShadersStore[n]||(e.ShadersStore[n]=r);var i=[t];for(let t of i)e.IncludesShadersStore[t.name]||(e.IncludesShadersStore[t.name]=t.shader);var a={name:n,shader:r};export{a as layerPixelShader};