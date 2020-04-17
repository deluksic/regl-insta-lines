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
   * GLSL code for calculating the cap.
   * ```glsl
   * vec2 cap(vec2 a, vec2 b, float percent);
   * ```
   */
  cap?: GLSL;
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
   *   vec3 p0, p1, p2, p3;
   *   float r0, r1, r2, r3;
   * ```
   * NOTE: these could also be defined in declarations as attributes.
   */
  defineVerticesGLSL?: GLSL;
  /**
   * Optional GLSL code of main() function body. Called after clip positions
   * become available:
   * ```glsl
   *   // clip space coords
   *   vec4 clip0, ..., clip3;
   *   // screen space coords
   *   vec2 ssp0, ..., ssp3;
   * ```
   */
  postprocessVerticesGLSL?: GLSL;
  /**
   * For setting to lines for debugging
   */
  primitive?: REGL.DrawConfig['primitive'];
}

export type LineUniforms = {
  resolution: [number, number];
}

/**
 * Creates a regl lines drawing command.
 */
export function lineBase(
  regl: Regl,
  {
    cap = CapType.butt,
    declarationsGLSL = defaultCameraTransform,
    frag = defaultFrag,
    join = JoinType.bevel,
    joinCount = 8,
    defineVerticesGLSL,
    postprocessVerticesGLSL,
    primitive = 'triangles'
  }: CreateLineOptions
) {
  const mesh = lineSegmentMesh(joinCount);
  const vertices = regl.buffer(mesh.vertices);
  return regl<LineUniforms, REGL.Attributes, {}>({
    frag,
    vert: glsl`
      precision highp float;
      uniform vec2 resolution;
      attribute vec3 vertex;

      varying vec2 vUv;

      ${slerp}
      ${declarationsGLSL}
      ${cap}
      ${join}

      vec4 tangentPoints(vec2 d, float r0, float r1) {
        float dlen = length(d);
        if (dlen < 0.0001) {
          return vec4(0.0);
        }
        vec2 x = d / dlen;
        vec2 y = vec2(-x.y, x.x);
        float cosA = (r1 - r0) / dlen;
        float sinA = sqrt(1.0 - cosA*cosA);
        vec2 t1 = (-cosA*x + sinA*y);
        vec2 t2 = (-cosA*x - sinA*y);
        return vec4(t1, t2);
      }

      void main() {
        vec2 halfRes = vec2(0.5 * resolution);
        vec3 p0, p1, p2, p3;
        float r0, r1, r2, r3;
        float skip = 0.0;
        ${defineVerticesGLSL}

        vUv = vertex.xy;

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

        // segment directions
        vec2 d01 = ssp1 - ssp0;
        vec2 d12 = ssp2 - ssp1;
        vec2 d23 = ssp3 - ssp2;

        // tangents
        vec4 t01 = tangentPoints(d01, r0, r1);
        vec4 t12 = tangentPoints(d12, r1, r2);
        vec4 t23 = tangentPoints(d23, r2, r3);

        vec2 v00a = t12.zw, v00b = t01.zw;
        vec2 v01a = t12.xy, v01b = t01.xy;
        vec2 v10a = t12.zw, v10b = t23.zw;
        vec2 v11a = t12.xy, v11b = t23.xy;

        vec2 bota = vertex.x < 0.5 ? v00a : v10a;
        vec2 topa = vertex.x < 0.5 ? v01a : v11a;
        vec2 botb = vertex.x < 0.5 ? v00b : v10b;
        vec2 topb = vertex.x < 0.5 ? v01b : v11b;

        vec2 fina = vertex.y < 0.5 ? bota : topa;
        vec2 finb = vertex.y < 0.5 ? botb : topb;
        vec2 fin;
        if(finb == vec2(0.0)){
          vec2 dir = (vertex.x*2.-1.) * normalize(d12);
          fin = cap(dir, fina, vertex.z);
        } else {
          fin = join(fina, finb, vertex.z);
        }

        if (vertex.x < 0.5) {
          gl_Position = clip1;
          gl_Position.xy += fin * (r1 * clip1.w) / halfRes;
        } else {
          gl_Position = clip2;
          gl_Position.xy += fin * (r2 * clip2.w) / halfRes;
        }
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
  });
}