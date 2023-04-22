#include<sceneUboDeclaration>
#include<boidInclude>

var<storage,read> boids: array<Boid>;
var<storage,read> boidVertices : array<vec3<f32>>;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let boid = boids[vertexInputs.instanceIndex];
    let angle = -atan2(boid.vel.x, boid.vel.y);
    var pos = boidVertices[vertexInputs.vertexIndex].xy * 0.1;
    var rotated = vec2(
        pos.x * cos(angle) - pos.y * sin(angle),
        pos.x * sin(angle) + pos.y * cos(angle)
    );
    vertexOutputs.position = scene.viewProjection * vec4(rotated + boid.pos, 0.0, 1.0);
}    