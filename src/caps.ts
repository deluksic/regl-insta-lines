import { glsl } from './glsl';

export const CapType = {
  butt: glsl`
    // vec2 cap(vec2 dir, vec2 norm, float percent) {
      return percent < 0.5 ? norm : -norm;
    // }
  `,
  square: glsl`
    // vec2 cap(vec2 dir, vec2 norm, float percent) {
      if (percent == 0.0) return norm;
      if (percent == 1.0) return -norm;
      return percent < 0.5 ? dir + norm : dir - norm;
    //}
  `,
  round: glsl`
    // vec2 cap(vec2 dir, vec2 norm, float percent) {
      return slerp(norm, dir, percent * 2.0, -1.0);
    // }
  `,
  arrow: (size = 2.5, angle = 60) => glsl`
    // vec2 cap(vec2 dir, vec2 norm, float percent) {
      float size = ${size.toFixed(4)};
      float angle = radians(${angle.toFixed(4)});
      mat2 prot = rotMat(angle, 1.0);
      mat2 nrot = rotMat(-angle, 1.0);
      vec2 shoulder1 = -nrot * dir * size;
      vec2 shoulder2 = -prot * dir * size;
      vec2 mid = dir * size;
      if (percent == 0.0) return norm;
      if (percent == 1.0) return -norm;
      if (percent == 0.5) return mid;
      if (percent < 0.5) return shoulder1;
      if (percent > 0.5) return shoulder2;
    // }
  `
};
