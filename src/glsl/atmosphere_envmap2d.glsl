precision highp float;

uniform vec3 sundir;
varying vec2 uv;

#pragma glslify: atmosphere = require(./atmosphere.glsl);

vec3 paraboloidToNormal (mediump vec2 screen) {
  float K = 2. / (dot(screen, screen) + 1.);
  return vec3(K * screen.x, K - 1., K * screen.y);
}

void main() {
  vec2 newUV = vec2(fract(uv.x)*2.0 - 1., uv.y);
  vec3 r = normalize(paraboloidToNormal(newUV));
  r.y *= sign(uv.x);
  vec3 color = atmosphere(
    r,
    vec3(0, 6372e3, 0),
    normalize(sundir),
    22.0,
    6371e3,
    6471e3,
    vec3(5.5e-6, 13.0e-6, 22.4e-6),
    21e-6,
    8e3,
    1.2e3,
    0.758
  );
  gl_FragColor = vec4(color, 1);
}