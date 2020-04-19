import REGL, { Regl } from 'regl';
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

export const defaultFrag = glsl`
  void main() {
    gl_FragColor = vec4(1.0);
  }
`;

export type CreateLineOptions = {
  /**
   * Width in pixels.
   */
  width?: number;
  /**
   * GLSL code for calculating the caps.
   * ```glsl
   * vec2 cap(vec2 a, vec2 b, float percent);
   */
  cap?: GLSL | { start: GLSL; end: GLSL };
  /**
   * GLSL code of declarations, at least:
   * ```glsl
   * vec4 cameraTransform(vec4 pos);
   * ```
   */
  declarationsGLSL?: GLSL;
  /**
   * Fragment shader code.
   * ```glsl
   * varying vec2 vUv;
   * ```
   */
  frag?: GLSL;
  /**
   * GLSL code for calculating the join.
   * ```glsl
   * vec2 join(vec2 a, vec2 b, float percent);
   * ```
   */
  join?: GLSL;
  /**
   * Number of triangles approximating the joins.
   * NOTE: some joins (like miter or round) become bevel
   * joins when set to 1.
   */
  joinCount?: number;
  /**
   * GLSL code of main() function body. After this call, these
   * should be defined at least:
   * ```glsl
   *  vec3 p0, p1, p2, p3;
   * ```
   * NOTE: these could also be defined in declarations as attributes.
   */
  defineVerticesGLSL?: GLSL;
  /**
   * Optional GLSL code of main() function body. Called after clip positions
   * become available:
   * ```glsl
   * // clip space coords
   * vec4 clip0, ..., clip3;
   * // screen space coords
   * vec2 ssp0, ..., ssp3;
   * ```
   */
  postprocessVerticesGLSL?: GLSL;
  /**
   * For setting to lines for debugging
   */
  primitive?: REGL.DrawConfig['primitive'];
}

/**
 * Creates a regl lines drawing command.
 */
export function lineBase(
  regl: Regl,
  {
    width = 1,
    cap = CapType.butt,
    declarationsGLSL = defaultCameraTransform,
    frag = defaultFrag,
    join = JoinType.bevel,
    joinCount = 4,
    defineVerticesGLSL,
    postprocessVerticesGLSL,
    primitive = 'triangles'
  }: CreateLineOptions
) {
  const mesh = lineSegmentMesh(joinCount);
  const vertices = regl.buffer(mesh.vertices);
  let startCap, endCap;
  if (typeof cap === 'string') {
    startCap = endCap = cap;
  } else {
    startCap = cap.start;
    endCap = cap.end;
  }
  return {
    setWidth: (newWidth: number) => width = newWidth,
    render: regl({
      frag,
      vert: glsl`
        precision highp float;
        uniform float width;
        uniform vec2 resolution;
        attribute vec3 vertex;

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

          // choose p,a,b,c,d
          vec4 p;
          vec2 a, b, c, d;
          if(vertex.x < 0.0) {
            p = clip1; a = p1a; b = p1b; c = p1c; d = p1d;
          } else {
            p = clip2; a = p2a; b = p2b; c = p2c; d = p2d;
          }

          vec2 final = vec2(0.0);
          vec2 dir = vertex.x * normalize(p1p2);
          if (vertex.y == -1.0) {
            // just a c coordinate
            final = c;
          } else if (vertex.y == 1.0) {
            // interpolate a to b (cap or join)
            if(b == vec2(0.0)){
              if (vertex.x < 0.5) {
                final = startCap(dir, a, vertex.z);
              } else {
                final = endCap(dir, a, vertex.z);
              }
            } else {
              final = join(a, b, vertex.z);
            }
          }

          gl_Position = p;
          gl_Position.xy += final * width * p.w / halfRes;
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
        width: () => width,
        resolution: ctx => [ctx.viewportWidth, ctx.viewportHeight]
      },
      cull: {
        enable: true,
        face: 'back'
      },
      blend: {
        enable: true,
        func: {
          src: 'src alpha',
          dst: 'one minus src alpha'
        }
      }
    })
  };
}