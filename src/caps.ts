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
      return percent < 0.5 ? dir + norm : dir - norm;
    }
  `,
  round: glsl`
    ${PI}
    vec2 cap(vec2 _, vec2 norm, float percent) {
      float cost = cos(-PI * percent);
      float sint = sin(-PI * percent);
      return mat2(cost, -sint, sint, cost) * norm;
    }
  `,
};
