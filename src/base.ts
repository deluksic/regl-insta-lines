import { Regl, DrawConfig, DrawCommand, DefaultContext } from 'regl';
import { glsl, GLSL } from './glsl';
import { lineSegmentMesh } from './utils/lineSegmentMesh';
import { JoinType } from './joins';
import { CapType } from './caps';
import { slerp } from './glslUtils';

export const defaultCameraTransform = glsl`
  vec4 cameraTransform(vec4 pos) {
    return pos;
  }
`;

export type CreateLineBaseOptions = {
  /**
   * Width in pixels.
   * @default 1
   */
  width?: number;
  /**
   * GLSL code for calculating the caps.
   * ```glsl
   * vec2 cap(vec2 a, vec2 b, float percent);
   * ```
   * @default CapType.butt
   */
  cap?: GLSL | { start: GLSL; end: GLSL };
  /**
   * GLSL code for calculating the join.
   * One of JoinType.* values or your own.
   * ```glsl
   * vec2 join(vec2 a, vec2 b, float percent);
   * ```
   * @default JoinType.bevel
   */
  join?: GLSL;
  /**
   * Number of triangles approximating the joins.
   * NOTE: joins are effectively bevel joins when this value is set to 1.
   * @default 4
   */
  joinCount?: number;
  /**
   * How far up the segment can a reverse miter go. Default is 0.5.
   * Anything larger than 0.5 has a probability of failure, but allows
   * sharper angles to still be reverse-mitered. Conversely, smaller
   * value means that corner segments will fold earlier.
   * @default 0.5
   */
  reverseMiterLimit?: number;
  /**
   * Optional Fragment shader code.
   * You can also wrap the render call inside another cmd that
   * supplies the fragment shader + uniforms needed.
   * Following varyings are available in the base API:
   * ```glsl
   * varying vec3 vPos;
   * varying vec2 vUv;
   * ```
   */
  frag?: GLSL;
  /**
   * Optional blending mode. Alpha blending enabled by default.
   */
  blend?: DrawConfig['blend'];
  /**
   * Optional GLSL code of declarations, that at least defines a camera
   * transform:
   * ```glsl
   * vec4 cameraTransform(vec4 pos);
   * ```
   * @default identity
   */
  declarationsGLSL?: GLSL;
  /**
   * Required GLSL code of main() function body. After this code, these
   * should be defined at least:
   * ```glsl
   *  vec3 p0, p1, p2, p3;
   *  float skip;
   * ```
   * NOTE: If you set skip to something else than 0.0, the segment will
   * be discarded.
   */
  defineVerticesGLSL?: GLSL;
  /**
   * Optional GLSL code of main() function body. Called after clip and screen
   * coordinates become available:
   * ```glsl
   * // clip space coords
   * vec4 clip0, ..., clip3;
   * // screen space coords
   * vec2 ssp0, ..., ssp3;
   * ```
   */
  postprocessVerticesGLSL?: GLSL;
  /**
   * Optional GLSL code that runs at the end of main() function body.
   * Useful to compute aditional varyings based on some values
   * computed previously.
   */
  mainEndGLSL?: GLSL;
  /**
   * For setting to lines for debugging
   */
  primitive?: DrawConfig['primitive'];
}

/**
 * Creates a regl lines drawing command.
 */
export function createLineBase(
  regl: Regl,
  {
    blend,
    cap = CapType.butt,
    declarationsGLSL = defaultCameraTransform,
    defineVerticesGLSL,
    frag,
    join = JoinType.bevel,
    joinCount = 4,
    mainEndGLSL,
    postprocessVerticesGLSL,
    primitive = 'triangles',
    reverseMiterLimit = 0.5,
    width = 1,
  }: CreateLineBaseOptions
): {
  setWidth: (newWidth: number) => number;
  render: DrawCommand<DefaultContext, Record<string, unknown>>;
} {
  const mesh = lineSegmentMesh(joinCount);
  const vertices = regl.buffer(mesh.vertices);
  const [startCap, endCap] = typeof cap === 'string' ?
    [cap, cap] : [cap.start, cap.end];
  return {
    setWidth: (newWidth: number) => width = newWidth,
    render: regl({
      frag,
      vert: glsl`
        precision highp float;
        uniform float radius;
        uniform vec2 resolution;
        attribute vec3 vertex;

        varying vec3 vPos;
        varying vec2 vUv;

        // assumes a and b are normalized
        vec2 miterPoint(vec2 a, vec2 b) {
          vec2 ab = 0.5 * (a + b);
          float len2 = dot(ab, ab);
          if (len2 < 0.0001) return vec2(0.0);
          return ab / len2;
        }
    
        vec4 tangentPoints(vec2 d) {
          float len = length(d);
          if (len < 1e-4) return vec4(0.0);
          vec2 dnorm = d / len;
          return vec4(
            -dnorm.y, dnorm.x,
            dnorm.y, -dnorm.x
          );
        }

        ${slerp}
        ${declarationsGLSL}
        ${join}
        
        vec2 startCap(vec2 dir, vec2 norm, float percent) {
          ${startCap}
        }

        vec2 endCap(vec2 dir, vec2 norm, float percent) {
          ${endCap}
        }

        void main() {
          vec2 halfRes = vec2(0.5 * resolution);
          vec3 p0, p1, p2, p3;
          float skip = 0.0;
          ${defineVerticesGLSL}

          vUv = vec2(vertex.x, -vertex.x*vertex.y)*0.5 + 0.5;

          // clip space coords
          vec4 clip0 = cameraTransform(vec4(p0, 1.0));
          vec4 clip1 = cameraTransform(vec4(p1, 1.0));
          vec4 clip2 = cameraTransform(vec4(p2, 1.0));
          vec4 clip3 = cameraTransform(vec4(p3, 1.0));

          // screen space coords
          vec2 ssp0 = (clip0 / clip0.w).xy * halfRes;
          vec2 ssp1 = (clip1 / clip1.w).xy * halfRes;
          vec2 ssp2 = (clip2 / clip2.w).xy * halfRes;
          vec2 ssp3 = (clip3 / clip3.w).xy * halfRes;

          ${postprocessVerticesGLSL}

          // detect skip
          if (skip != 0.0) {
            gl_Position.z = -1.0;
            return;
          }

          // position diffs
          vec2 p0p1 = ssp1 - ssp0;
          vec2 p1p2 = ssp2 - ssp1;
          vec2 p2p3 = ssp3 - ssp2;

          // tangents
          vec4 t01 = tangentPoints(p0p1);
          vec4 t12 = tangentPoints(p1p2);
          vec4 t23 = tangentPoints(p2p3);

          // abcd
          vec2 p1a = t12.xy, p1b = t01.xy, p1c = t12.zw, p1d = t01.zw;
          vec2 p2a = t12.zw, p2b = t23.zw, p2c = t12.xy, p2d = t23.xy;

          // choose
          vec4 p;
          vec2 a, b, c, d, sab, scd;
          if(vertex.x < 0.0) {
            p = clip1;
            a = p1a; b = p1b;
            c = p1c; d = p1d;
            sab = -p0p1; scd = p1p2;
          } else {
            p = clip2;
            a = p2a; b = p2b;
            c = p2c; d = p2d;
            sab = p2p3; scd = -p1p2;
          }

          bool isCap = b == vec2(0.0);

          // values required to potentially account for reverse miter
          float reverseMiterLimit = ${reverseMiterLimit.toFixed(4)};
          vec2 abrevmiter = miterPoint(a, b);
          vec2 cdrevmiter = miterPoint(c, d);
          float sablen2 = dot(sab, sab);
          float scdlen2 = dot(scd, scd);
          float ababmitlen = dot(sab, abrevmiter) * radius / sablen2;
          float abcdmitlen = dot(sab, cdrevmiter) * radius / sablen2;
          float cdabmitlen = dot(scd, abrevmiter) * radius / scdlen2;
          float cdcdmitlen = dot(scd, cdrevmiter) * radius / scdlen2;

          vec2 final = vec2(0.0);
          vec2 dir = vertex.x * normalize(p1p2);
          if (vertex.y == -1.0) {
            // account for reverse miter
            if (!isCap && cdcdmitlen > 0.0 &&
                cdcdmitlen < reverseMiterLimit &&
                abcdmitlen < reverseMiterLimit) {
              c = cdrevmiter;
              vUv.x -= vertex.x * cdcdmitlen;
            }
            final = c;
          } else if (vertex.y == 1.0) {
            // interpolate a to b (cap or join)
            if(isCap){
              if (vertex.x < 0.5) {
                final = startCap(dir, a, vertex.z);
              } else {
                final = endCap(dir, a, vertex.z);
              }
            } else {
              // account for reverse miter
              if (ababmitlen > 0.0 &&
                  ababmitlen < reverseMiterLimit &&
                  cdabmitlen < reverseMiterLimit) {
                a = b = abrevmiter;
                vUv.x -= vertex.x * cdabmitlen;
              }
              final = join(a, b, vertex.z);
            }
          }

          gl_Position = p;
          gl_Position.xy += final * radius * p.w / halfRes;

          // use vUv.x to mix positions since vUv.x will have
          // corrected distance along the segment due to
          // reverse miter
          vPos = mix(p1, p2, vUv.x);

          ${mainEndGLSL}
        }
      `,
      primitive,
      elements: mesh.indices,
      attributes: {
        vertex: {
          buffer: vertices,
          divisor: 0,
        }
      },
      uniforms: {
        radius: () => 0.5 * width,
        resolution: ctx => [ctx.viewportWidth, ctx.viewportHeight]
      },
      cull: {
        enable: true,
        face: 'back'
      },
      blend: blend ?? {
        enable: true,
        func: {
          src: 'src alpha',
          dst: 'one minus src alpha'
        }
      }
    })
  };
}