#include<boidInclude>

@binding(0) @group(0) var renderTarget : texture_storage_2d<rgba8unorm, write>;
@binding(1) @group(0) var<uniform> params : Params;

const clearBlockSize : u32 = 8u;
const backgroundColour : vec4<f32> = vec4<f32>(0.19215687, 0.3019608, 0.4745098, 1.0);

@compute @workgroup_size(clearBlockSize, clearBlockSize, 1)
fn main(@builtin(global_invocation_id) globalInvocationID : vec3<u32>) {
  let pixel = globalInvocationID.xy;
  if (pixel.x >= params.renderWidth || pixel.y >= params.renderHeight) {
    return;
  }

  textureStore(renderTarget, vec2<i32>(pixel), backgroundColour);
}
