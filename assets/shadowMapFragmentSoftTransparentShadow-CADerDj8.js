import{t as e}from"./shaderStore-B3CsX8Dt.js";var t=`shadowMapFragmentSoftTransparentShadow`,n=`#if SM_SOFTTRANSPARENTSHADOW==1
if ((bayerDither8(floor(mod(gl_FragCoord.xy,8.0))))/64.0>=softTransparentShadowSM.x*alpha) discard;
#endif
`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=n);var r={name:t,shader:n};export{r as shadowMapFragmentSoftTransparentShadow};