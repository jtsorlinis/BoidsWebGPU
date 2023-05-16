uniform cameraPosition : vec3<f32>;

varying worldPos : vec3<f32>;
varying norm : vec3<f32>;
varying neighbours : f32;

fn hueToRGBA(hue: f32) -> vec4<f32> {
    var r = abs(hue * 6.0 - 3.0) - 1.0;
    var g = 2.0 - abs(hue * 6.0 - 2.0);
    var b = 2.0 - abs(hue * 6.0 - 4.0);
    return saturate(vec4<f32>(r, g, b, 1.0));
}

const boidColour : vec3<f32> = vec3<f32>(.98, .98, 1);
const ambientStrength : f32 = 0.2;
const specularStrength : f32 = 1.0;
const lightColour : vec3<f32> = vec3<f32>(1.0, 1.0, 1.0);
const lightDirection : vec3<f32> = vec3<f32>(-0.32, -0.77, 0.56);

@fragment
fn main(input : FragmentInputs) -> FragmentOutputs {
    let ambient = ambientStrength * lightColour;
    
    let diffuse = lightColour * max(dot(input.norm, -lightDirection), 0.0);
    
    let viewDir = normalize(uniforms.cameraPosition - input.worldPos);
    let reflectDir = reflect(lightDirection, input.norm);
    let spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    let specular = specularStrength * spec * lightColour;

    let lighting = specular + diffuse + ambient;
    fragmentOutputs.color = hueToRGBA(input.neighbours) * vec4<f32>(lighting, 1.0);
}