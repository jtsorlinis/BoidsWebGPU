#include<sceneUboDeclaration>
#include<boid3dInclude>

var<storage,read> boids: array<Boid3d>;
var<uniform> boidVertices : array<vec3<f32>, 6>;
var<uniform> boidNormals : array<vec3<f32>, 2>;

varying worldPos : vec3<f32>;
varying norm : vec3<f32>;

const up = vec3<f32>(0.0, 1.0, 0.0);

fn rotate3d(v : vec3<f32>, vel : vec3<f32>) -> vec3<f32> {
    let axis = normalize(cross(up, vel));
    let angle = acos(dot(up, normalize(vel)));
    return v * cos(angle) + cross(axis, v) * sin(angle) + axis * dot(axis, v) * (1.0 - cos(angle));
}

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let instanceId = vertexInputs.vertexIndex / 6;
    let vertexId = vertexInputs.vertexIndex - (instanceId * 6);
    let boid = boids[instanceId];
    let normal = rotate3d(boidNormals[vertexId / 3], boid.vel);
    let pos = rotate3d(boidVertices[vertexId] * 0.1, boid.vel) + boid.pos;
    vertexOutputs.worldPos = pos;
    vertexOutputs.norm = normal;
    vertexOutputs.position = scene.viewProjection * vec4(pos, 1.0);
}    