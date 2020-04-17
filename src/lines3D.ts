import { Regl } from 'regl';
import { glsl, GLSL } from './glsl';
import {
  lineBase,
  defaultCameraTransform,
  CreateLineOptions
} from './base';
import { addBoundaries } from './utils/addBoundaries';
import { accumulate } from './utils/accumulate';
import { vec3 } from 'gl-matrix';

export type CreateLines3DOptions = CreateLineOptions & {
  width?: number;
  cameraTransform?: GLSL;
  /**
   * ```glsl
   * // x=total, y=relative [0, 1]
   * varying vec2 distanceAlongPath;
   * ```
   */
  frag?: GLSL;
  distanceFn?: (a: vec3, b: vec3) => number;
}

export type Line3DDescriptor = {
  points: vec3[];
  radii?: number[];
  closed?: boolean;
}

export function createLines3D(
  regl: Regl,
  {
    declarationsGLSL,
    defineVerticesGLSL,
    postprocessVerticesGLSL,
    width = 10,
    cameraTransform = defaultCameraTransform,
    distanceFn = vec3.distance,
    ...linesBaseOptions
  }: CreateLines3DOptions
) {
  let radius = width / 2;
  let count = 0;
  const points = regl.buffer({ type: 'float32' });
  const radii = regl.buffer({ type: 'float32' });
  const distanceAlongPath = regl.buffer({ type: 'float32' });
  const skipSegment = regl.buffer({ type: 'float32' });
  function setWidth(width: number) {
    radius = width / 2;
  }
  function setLines(lines: Line3DDescriptor[]) {
    const ps = lines.flatMap(line => addBoundaries(
      line.points, line.closed
    ));
    const ws = lines.flatMap(line => addBoundaries(
      line.radii ?? line.points.map(() => 1), line.closed
    ));
    const ds = lines.flatMap(line => addBoundaries(
      accumulate(line.points, distanceFn), line.closed
    ));
    const sk = lines.flatMap(line => addBoundaries(
      line.points.map(() => 0), line.closed, 1
    ));
    points(ps);
    radii(ws);
    distanceAlongPath(ds);
    skipSegment(sk);
    count = ps.length - 3;
  }
  const px = (x: number) => ({
    buffer: points,
    divisor: 1,
    offset: Float32Array.BYTES_PER_ELEMENT * 3 * x,
    stride: Float32Array.BYTES_PER_ELEMENT * 3
  });
  const rx = (x: number) => () => {
    if (radius) {
      return {
        constant: radius
      };
    }
    return {
      buffer: radii,
      divisor: 1,
      offset: Float32Array.BYTES_PER_ELEMENT * x,
      stride: Float32Array.BYTES_PER_ELEMENT
    };
  };
  const dx = (x: number) => ({
    buffer: distanceAlongPath,
    divisor: 1,
    offset: Float32Array.BYTES_PER_ELEMENT * 2 * x,
    stride: Float32Array.BYTES_PER_ELEMENT * 2
  });
  const basecmd = lineBase(regl, {
    ...linesBaseOptions,
    declarationsGLSL: glsl`
      ${cameraTransform}
      attribute vec3 ap0, ap1, ap2, ap3;
      attribute float ar0, ar1, ar2, ar3;
      attribute float askip;
      attribute vec2 ad1, ad2;
      varying vec2 distanceAlongPath;
      ${declarationsGLSL}
    `,
    defineVerticesGLSL: glsl`
      p0 = ap0, p1 = ap1, p2 = ap2, p3 = ap3;
      r0 = ar0, r1 = ar1, r2 = ar2, r3 = ar3;
      distanceAlongPath = vertex.x < 0.5 ? ad1 : ad2;
      skip = askip;
      ${defineVerticesGLSL}
    `
  });
  const cmd = regl({
    attributes: {
      ap0: px(0),
      ap1: px(1),
      ap2: px(2),
      ap3: px(3),
      ar0: rx(0),
      ar1: rx(1),
      ar2: rx(2),
      ar3: rx(3),
      ad1: dx(1),
      ad2: dx(2),
      askip: {
        buffer: skipSegment,
        divisor: 1,
        offset: Float32Array.BYTES_PER_ELEMENT,
        stride: Float32Array.BYTES_PER_ELEMENT
      }
    },
    instances: () => count
  });
  return {
    setLines,
    setWidth,
    render: () => cmd(() => basecmd())
  };
}