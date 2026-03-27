import{t as e}from"./shaderStore-B3CsX8Dt.js";var t=`vertexColorMixing`,n=`#if defined(VERTEXCOLOR) || defined(INSTANCESCOLOR) && defined(INSTANCES)
vColor=vec4(1.0);
#ifdef VERTEXCOLOR
#ifdef VERTEXALPHA
vColor*=colorUpdated;
#else
vColor.rgb*=colorUpdated.rgb;
#endif
#endif
#ifdef INSTANCESCOLOR
vColor*=instanceColor;
#endif
#endif
`;e.IncludesShadersStore[t]||(e.IncludesShadersStore[t]=n);