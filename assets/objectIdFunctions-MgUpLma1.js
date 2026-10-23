import{t as e}from"./shaderStore-D-XQlhUT.js";var t=`objectIdFunctions`,n=`highp vec4 encodeObjectId(highp float objectId) {
#ifdef PREPASS_OBJECT_ID_R8
return vec4(objectId/255.0,0.0,0.0,1.0);
#else
highp float id=floor(objectId);highp vec3 encodedId=vec3(
floor(mod(id,16777216.0)/65536.0),
floor(mod(id,65536.0)/256.0),
mod(id,256.0)
)/255.0;return vec4(encodedId,step(0.5,id));
#endif
}
`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=n);var r={name:t,shader:n};export{r as objectIdFunctions};