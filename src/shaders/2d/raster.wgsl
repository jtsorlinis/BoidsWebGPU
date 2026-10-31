// Draws boids into the raster, for the 2D boids kernel

const boidScale : f32 = 0.1;
const boidTriangle0 : vec2<f32> = vec2<f32>(-0.4, -0.5) * boidScale;
const boidTriangle1 : vec2<f32> = vec2<f32>(0.0, 0.5) * boidScale;
const boidTriangle2 : vec2<f32> = vec2<f32>(0.4, -0.5) * boidScale;

fn edge(a: vec2<f32>, b: vec2<f32>, p: vec2<f32>) -> f32 {
  let ab = b - a;
  let ap = p - a;
  return ap.x * ab.y - ap.y * ab.x;
}

fn rotateLocalVertex(vertex: vec2<f32>, velocity: vec2<f32>) -> vec2<f32> {
  let speedSq = dot(velocity, velocity);
  if (speedSq <= 1e-8) {
    return vertex;
  }

  let dir = velocity * inverseSqrt(speedSq);
  return vec2<f32>(
    vertex.x * dir.y + vertex.y * dir.x,
    vertex.y * dir.y - vertex.x * dir.x
  );
}

fn worldToScreen(worldPos: vec2<f32>) -> vec2<f32> {
  let rasterSize = vec2<f32>(f32(params.renderWidth), f32(params.renderHeight));
  let screenScale = rasterSize / (params.viewportHalfSize * 2.0);
  let screenOffset = rasterSize * 0.5 - params.cameraPos * screenScale;
  return worldPos * screenScale + screenOffset;
}

fn getBoidColour(boid: Boid) -> u32 {
  var d = 1.0;
  if (params.avoidMouse > 0u) {
    d = distance(boid.pos, params.mousePos) / params.zoom;
  }
  return pack4x8unorm(vec4<f32>(1.0, d, d, 1.0));
}

fn rasterizeBoid(boid: Boid) {
  let v0 = worldToScreen(rotateLocalVertex(boidTriangle0, boid.vel) + boid.pos);
  let v1 = worldToScreen(rotateLocalVertex(boidTriangle1, boid.vel) + boid.pos);
  let v2 = worldToScreen(rotateLocalVertex(boidTriangle2, boid.vel) + boid.pos);

  // Only the on screen pixels whose centres could be inside the triangle
  let minBounds = ceil(min(v0, min(v1, v2)) - 0.5);
  let maxBounds = floor(max(v0, max(v1, v2)) - 0.5);
  let minX = max(0, i32(minBounds.x));
  let minY = max(0, i32(minBounds.y));
  let maxX = min(i32(params.renderWidth) - 1, i32(maxBounds.x));
  let maxY = min(i32(params.renderHeight) - 1, i32(maxBounds.y));
  if (minX > maxX || minY > maxY) {
    return;
  }

  // Rotating and scaling to the screen keep the winding, so the area is
  // always positive unless the triangle is too small to cover a pixel
  let area = edge(v0, v1, v2);
  if (area <= 1e-5) {
    return;
  }

  let pixelStart = vec2<f32>(f32(minX) + 0.5, f32(minY) + 0.5);
  var w0Row = edge(v1, v2, pixelStart);
  var w1Row = edge(v2, v0, pixelStart);
  var w2Row = edge(v0, v1, pixelStart);

  let w0StepX = v2.y - v1.y;
  let w1StepX = v0.y - v2.y;
  let w2StepX = v1.y - v0.y;
  let w0StepY = v1.x - v2.x;
  let w1StepY = v2.x - v0.x;
  let w2StepY = v0.x - v1.x;
  let colour = getBoidColour(boid);

  for (var y = minY; y <= maxY; y += 1) {
    var w0 = w0Row;
    var w1 = w1Row;
    var w2 = w2Row;
    let row = u32(y) * params.renderWidth;

    for (var x = minX; x <= maxX; x += 1) {
      if (w0 >= 0.0 && w1 >= 0.0 && w2 >= 0.0) {
        raster[row + u32(x)] = colour;
      }

      w0 += w0StepX;
      w1 += w1StepX;
      w2 += w2StepX;
    }

    w0Row += w0StepY;
    w1Row += w1StepY;
    w2Row += w2StepY;
  }
}
