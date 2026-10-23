import{t as e}from"./shaderStore-D-XQlhUT.js";import{t}from"./kernelBlurVaryingDeclaration-DP2Wr9Oc.js";var n=`kernelBlurVertex`,r=`sampleCoord{X}=sampleCenter+delta*KERNEL_OFFSET{X};`;e.IncludesShadersStore[n]||(e.IncludesShadersStore[n]=r);var i={name:n,shader:r},a=`kernelBlurVertexShader`,o=`attribute vec2 position;uniform vec2 delta;varying vec2 sampleCenter;
#include<kernelBlurVaryingDeclaration>[0..varyingCount]
const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
sampleCenter=(position*madd+madd);
#include<kernelBlurVertex>[0..varyingCount]
gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;e.ShadersStore[a]||(e.ShadersStore[a]=o);var s=[t,i];for(let t of s)e.IncludesShadersStore[t.name]||(e.IncludesShadersStore[t.name]=t.shader);var c={name:a,shader:o};export{c as kernelBlurVertexShader};