import{d as e}from"./math.scalar.functions-wVG2V0LJ.js";import{t}from"./shaderStore-B3CsX8Dt.js";var n=e({postprocessVertexShader:()=>a}),r=`postprocessVertexShader`,i=`attribute vec2 position;uniform vec2 scale;varying vec2 vUV;const vec2 madd=vec2(0.5,0.5);
#define CUSTOM_VERTEX_DEFINITIONS
void main(void) {
#define CUSTOM_VERTEX_MAIN_BEGIN
vUV=(position*madd+madd)*scale;gl_Position=vec4(position,0.0,1.0);
#define CUSTOM_VERTEX_MAIN_END
}`;t.ShadersStore[r]||(t.ShadersStore[r]=i);var a={name:r,shader:i};export{n as t};