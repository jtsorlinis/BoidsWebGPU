uniform zoom : f32;
uniform mousePos : vec2<f32>;

varying wPos : vec2<f32>;

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
    let d = distance(input.wPos, uniforms.mousePos) / uniforms.zoom;
    fragmentOutputs.color = vec4(1, d, d, 1.0);
}