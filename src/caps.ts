import { glsl } from './glsl';
import { PI } from './glslUtils';

export const CapType = {
  butt: glsl`
    vec2 cap(vec2 dir, vec2 norm, float percent) {
      return percent < 0.5 ? norm : -norm;
    }
  `,
  square: glsl`
    vec2 cap(vec2 dir, vec2 norm, float percent) {
      if (percent == 0.0) return norm;
      if (percent == 1.0) return -norm;
      return percent < 0.5 ? dir + norm : dir - norm;
    }
  `,
  round: glsl`
    ${PI}
    vec2 cap(vec2 dir, vec2 norm, float percent) {
      return slerp(norm, dir, percent * 2.0, -1.0);
    }
  `,
};
