uniform cameraPosition : vec3<f32>;

varying worldPos : vec3<f32>;
varying norm : vec3<f32>;

const boidColour : vec3<f32> = vec3<f32>(1, 1, 1);
const ambientStrength : f32 = 0.3;
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
    fragmentOutputs.color = vec4<f32>(lighting * boidColour, 1.0);
}