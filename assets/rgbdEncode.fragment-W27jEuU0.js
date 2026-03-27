import{t as e}from"./shaderStore-B3CsX8Dt.js";import"./helperFunctions-C6fJxhG4.js";var t=`rgbdEncodePixelShader`,n=`varying vec2 vUV;uniform sampler2D textureSampler;
#include<helperFunctions>
#define CUSTOM_FRAGMENT_DEFINITIONS
void main(void) 
{gl_FragColor=toRGBD(texture2D(textureSampler,vUV).rgb);}`;e.ShadersStore[t]||(e.ShadersStore[t]=n);var r={name:t,shader:n};export{r as rgbdEncodePixelShader};