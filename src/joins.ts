import { glsl } from './glsl';

export const JoinType = {
  bevel: glsl`
    vec2 join(vec2 a, vec2 b, float percent) {
      return mix(a, b, percent);
    }
  `,
  round: glsl`
    vec2 join(vec2 a, vec2 b, float percent) {
      return slerp(a, b, percent, -1.0);
    }
  `,
  miter: (limit = 3) => glsl`
    vec2 join(vec2 a, vec2 b, float percent) {
      vec2 mid = 0.5 * (a + b);
      float midlen2 = dot(mid, mid);
      float miterLen2 = 1.0 / midlen2;
      float limit = ${limit.toFixed(4)};
      if (midlen2 < 0.0001 || miterLen2 > limit*limit) {
        return mix(a, b, percent);
      } else {
        vec2 i = mid * miterLen2;
        return percent == 0. ? a : percent == 1. ? b : i;
      }
    }
  `,
  miterSquare: glsl`
    float winding(vec2 v0, vec2 v1) {
      return sign(cross(vec3(v1, 0.0), vec3(v0, 0.0)).z);
    }

    vec2 join(vec2 a, vec2 b, float percent) {
      float sgn = winding(a, b);
      float alpha = acos(dot(a, b)) * 0.5;
      float beta = tan(alpha);
      float det = beta*beta - 2.0*beta;
      float x = sgn * (det < 0.0 ? beta : beta - sqrt(det));
      if (a == -b) {
        x = -1.0;
      }
      vec2 norma = x * vec2(a.y, -a.x);
      vec2 normb = x * vec2(-b.y, b.x);
      if (percent == 0.0) {
        return a;
      }
      if (percent == 1.0) {
        return b;
      }
      return percent < 0.5 ? a + norma : b + normb;
    }
  `
};
