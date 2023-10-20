#include<sceneUboDeclaration>
#include<boid3dInclude>

var<storage,read> boids: array<Boid3d>;
var<storage,read> boidVertices : array<vec3<f32>>;
var<storage,read> boidNormals : array<vec3<f32>>;
uniform numVertices : u32;

varying worldPos : vec3<f32>;
varying norm : vec3<f32>;

const HALF_PI: f32 = 1.57079632679;

fn rotate3d(v: vec3<f32>, vel: vec3<f32>) -> vec3<f32> {
    let pitch = atan2(vel.y, length(vel.xz)) - HALF_PI;
    let r = vec3<f32>(-v.y * sin(pitch) + v.x * cos(pitch), v.y * cos(pitch) + v.x * sin(pitch), v.z);
    let yaw = atan2(vel.x, vel.z) - HALF_PI;
    return vec3<f32>(r.x * cos(yaw) + r.z * sin(yaw), r.y, r.z * cos(yaw) - r.x * sin(yaw));;
}

@vertex
fn main(input : VertexInputs) -> FragmentInputs {
    let instanceId = vertexInputs.vertexIndex / uniforms.numVertices;
    let vertexId = vertexInputs.vertexIndex - (instanceId * uniforms.numVertices);
    let boid = boids[instanceId];
    let normal = rotate3d(boidNormals[vertexId / 3], boid.vel);
    let pos = rotate3d(boidVertices[vertexId] * 0.1, boid.vel) + boid.pos;
    vertexOutputs.worldPos = pos;
    vertexOutputs.norm = normal;
    vertexOutputs.position = scene.viewProjection * vec4(pos, 1.0);
}    