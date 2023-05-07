#include<sceneUboDeclaration>
#include<boid3dInclude>

var<storage,read> boids: array<Boid3d>;
var<uniform> boidVertices : array<vec3<f32>,6>;

varying wPos : vec3<f32>;

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let instanceId = vertexInputs.vertexIndex / 6;
    let vertexId = vertexInputs.vertexIndex - (instanceId * 6);
    let boid = boids[instanceId];
    var pos = boidVertices[vertexId] * 0.1;
    vertexOutputs.wPos = boid.pos;
    vertexOutputs.position = scene.viewProjection * vec4(pos + boid.pos, 1.0);
}    