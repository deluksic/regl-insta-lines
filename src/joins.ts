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
      if (percent == 0.0) return a;
      if (percent == 1.0) return b;
      float limit = ${limit.toFixed(4)};
      vec2 mp = miterPoint(a, b);
      float mplen2 = dot(mp, mp);
      if (mplen2 < 0.0001 || mplen2 > limit*limit) {
        return mix(a, b, percent);
      } else {
        return mp;
      }
    }
  `,
  miterSquare: glsl`
    vec2 join(vec2 a, vec2 b, float percent) {
      if (percent == 0.0) return a;
      if (percent == 1.0) return b;
      vec2 anorm = vec2(-a.y, a.x);
      vec2 bnorm = vec2(b.y, -b.x);
      if (dot(anorm, b) <= 0.0) return vec2(0.0);
      vec2 mid = normalize(anorm + bnorm);
      return miterPoint(percent < 0.5 ? a : b, mid);
    }
  `
};
