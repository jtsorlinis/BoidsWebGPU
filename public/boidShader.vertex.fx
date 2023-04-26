#include<sceneUboDeclaration>
#include<boidInclude>

var<storage,read> boids: array<Boid>;
var<uniform> boidVertices : array<vec3<f32>,3>;

varying wPos : vec2<f32>;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let instanceId = vertexInputs.vertexIndex / 3;
    let vertexId = vertexInputs.vertexIndex - (instanceId * 3);
    let boid = boids[instanceId];
    let angle = -atan2(boid.vel.x, boid.vel.y);
    var pos = boidVertices[vertexId].xy * 0.1;
    var rotated = vec2(
        pos.x * cos(angle) - pos.y * sin(angle),
        pos.x * sin(angle) + pos.y * cos(angle)
    );
    vertexOutputs.wPos = boid.pos;
    vertexOutputs.position = scene.viewProjection * vec4(rotated + boid.pos, 0.0, 1.0);
}    