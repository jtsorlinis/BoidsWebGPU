attribute vec2 position;
attribute vec2 boidPos;
attribute vec2 boidVel;

uniform mat4 worldViewProjection;

void main() {
    float angle = -atan(boidVel.x, boidVel.y);
    vec2 pos = vec2(
        position.x * cos(angle) - position.y * sin(angle),
        position.x * sin(angle) + position.y * cos(angle)
    );
    pos *= 0.1;
    gl_Position = worldViewProjection * vec4(pos + boidPos, 0.0, 1.0);;
}