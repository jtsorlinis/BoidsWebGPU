import{t as e}from"./shaderStore-D-XQlhUT.js";import{helperFunctions as t}from"./helperFunctions-Cz12B3WM.js";var n=`rgbdEncodePixelShader`,r=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;e.ShadersStore[n]||(e.ShadersStore[n]=r);var i=[t];for(let t of i)e.IncludesShadersStore[t.name]||(e.IncludesShadersStore[t.name]=t.shader);var a={name:n,shader:r};export{a as rgbdEncodePixelShader};