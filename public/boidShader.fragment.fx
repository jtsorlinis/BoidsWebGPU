uniform avoidMouse : u32;
uniform zoom : f32;
uniform mousePos : vec2<f32>;

varying wPos : vec2<f32>;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
    var d = 1.0;
    if(uniforms.avoidMouse > 0) {
        d = distance(input.wPos, uniforms.mousePos) / uniforms.zoom;
    }
    fragmentOutputs.color = vec4(1, d, d, 1.0);
}