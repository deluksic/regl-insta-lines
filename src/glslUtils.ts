import { glsl } from './glsl';

export const PI = glsl`
  #define PI 3.1415926535897932384626
`;

export const slerp = glsl`
  ${PI}

  mat2 rotMat(float angle, float t) {
    float cost = cos(angle * t);
    float sint = sin(angle * t);
    return mat2(cost, -sint, sint, cost);
  }

  float signedAngle(vec2 a, vec2 b, float preferSign) {
    vec2 diff = b + a;
    if(dot(diff, diff) < 0.0001) return preferSign*PI;
    return atan(a.x*b.y - a.y*b.x, a.x*b.x + a.y*b.y);
  }

  // assumes v0 and v1 are unit vectors
  vec2 slerp(vec2 v0, vec2 v1, float t, float preferSign)
  {
    float theta = signedAngle(v1, v0, preferSign);
    return rotMat(theta, t) * v0;
  }
`;