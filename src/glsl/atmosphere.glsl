#define PI 3.1415926535
#define iSteps 16
#define jSteps 8

vec2 raySphereIntersect(vec3 r0, vec3 rd, float sr) {
  float a = dot(rd, rd);
  float b = 2.0 * dot(rd, r0);
  float c = dot(r0, r0) - (sr * sr);
  float d = (b * b) - 4.0 * a * c;
  if (d < 0.0) return vec2(1e5,-1e5);
  return vec2((-b - sqrt(d))/(2.0*a), (-b + sqrt(d))/(2.0*a));
}

// r          - normalized ray direction
// r0         - ray origin (eye)
// pSun       - position of the sun
// intensity  - intensity of the sun
// rPlanet    - radius of the planet in meters
// rAtmos     - radius of the atmosphere in meters
// kRlh       - Rayleigh scattering coefficient
// kMie       - Mie scattering coefficient
// shRlh      - Rayleigh scale height
// shMie      - Mie scale height
// g          - Mie preferred scattering direction
vec3 atmosphere(vec3 r, vec3 r0, vec3 pSun, float iSun, float rPlanet, float rAtmos, vec3 kRlh, float kMie, float shRlh, float shMie, float g) {
  pSun = normalize(pSun);
  r = normalize(r);

  vec2 p = raySphereIntersect(r0, r, rAtmos);
  if (p.x > p.y) {
    return vec3(0, 0, 0);
  }
  p.y = min(p.y, raySphereIntersect(r0, r, rPlanet).x);
  float iStepSize = (p.y - p.x) / float(iSteps);

  // Initialize accumulators for Rayleigh and Mie scattering.
  vec3 totalRlh = vec3(0, 0, 0);
  vec3 totalMie = vec3(0, 0, 0);

  // Initialize optical depth accumulators for the primary ray.
  // optical depth is the average atmospheric density across the ray from point Pa to point Pb multiplied by the length of the ray
  float iOdRlh = 0.0;
  float iOdMie = 0.0;

  // since pSun and r are normolized, mu is the cos(theta) of two vector,
  float mu = dot(r, pSun);
  float mumu = mu * mu;
  float gg = g * g;
  float pRlh = 3.0 / (16.0 * PI) * (1.0 + mumu);
  float pMie = 3.0 / (8.0 * PI) * ((1.0 - gg) * (mumu + 1.0)) / (pow(1.0 + gg - 2.0 * mu * g, 1.5) * (2.0 + gg));

  for (int i = 0; i < iSteps; i++) {
    vec3 iPos = r0 + r * (iStepSize * (float(i) + 0.5));
    float iHeight = length(iPos) - rPlanet;
    float odStepRlh = exp(-iHeight / shRlh) * iStepSize;
    float odStepMie = exp(-iHeight / shMie) * iStepSize;

    // 
    iOdRlh += odStepRlh;
    iOdMie += odStepMie;

    float jStepSize = raySphereIntersect(iPos, pSun, rAtmos).y / float(jSteps);
    float jOdRlh = 0.0;
    float jOdMie = 0.0;
    for (int j = 0; j < jSteps; j++) {
      vec3 jPos = iPos + pSun * (jStepSize * (float(j) + 0.5));

      float jHeight = length(jPos) - rPlanet;
      jOdRlh += exp(-jHeight / shRlh) * jStepSize;
      jOdMie += exp(-jHeight / shMie) * jStepSize;
    }

    vec3 attn = exp(-(kMie * (iOdMie + jOdMie) + kRlh * (iOdRlh + jOdRlh)));
    totalRlh += odStepRlh * attn;
    totalMie += odStepMie * attn;
  }

  return iSun * (pRlh * kRlh * totalRlh + pMie * kMie * totalMie);
}

#pragma glslify: export(atmosphere)
