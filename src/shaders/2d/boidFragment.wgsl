uniform avoidMouse : u32;
uniform zoom : f32;
uniform mousePos : vec2<f32>;

varying wPos : vec2<f32>;
varying neighbours : f32;

fn hueToRGBA(hue: f32) -> vec4<f32> {
    var r = abs(hue * 6.0 - 3.0) - 1.0;
    var g = 2.0 - abs(hue * 6.0 - 2.0);
    var b = 2.0 - abs(hue * 6.0 - 4.0);
    return saturate(vec4<f32>(r, g, b, 1.0));
}

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
    var d = 1.0;
    if(uniforms.avoidMouse > 0) {
        d = distance(input.wPos, uniforms.mousePos) / uniforms.zoom;
    }
    fragmentOutputs.color = hueToRGBA(input.neighbours);
}