#include<sceneUboDeclaration>

attribute position : vec2<f32>;
attribute boidPos : vec2<f32>;
attribute boidVel : vec2<f32>;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let angle = -atan2(input.boidVel.x, input.boidVel.y);
    var pos = vec2(
        input.position.x * cos(angle) - input.position.y * sin(angle),
        input.position.x * sin(angle) + input.position.y * cos(angle)
    );
    pos *= 0.1;
    vertexOutputs.position = scene.viewProjection * vec4(pos + input.boidPos, 0.0, 1.0);
}    