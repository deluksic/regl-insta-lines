import { Regl } from 'regl';
import { glsl, GLSL } from './glsl';
import {
  createLineBase,
  defaultCameraTransform,
  CreateLineOptions
} from './base';
import { addBoundaries } from './utils/addBoundaries';
import { accumulate } from './utils/accumulate';
import { vec3 } from 'gl-matrix';

export type CreateLines3DOptions = CreateLineOptions & {
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
  closed?: boolean;
}

export function createLines3D(
  regl: Regl,
  {
    declarationsGLSL,
    defineVerticesGLSL,
    postprocessVerticesGLSL,
    mainEndGLSL,
    cameraTransform = defaultCameraTransform,
    distanceFn = vec3.distance,
    ...linesBaseOptions
  }: CreateLines3DOptions
) {
  let count = 0;
  const points = regl.buffer({ type: 'float32' });
  const distanceAlongPath = regl.buffer({ type: 'float32' });
  const skipSegment = regl.buffer({ type: 'float32' });
  function setLines(lines: Line3DDescriptor[]) {
    const ps = lines.flatMap(line => addBoundaries(
      line.points, line.closed
    ));
    const ds = lines.flatMap(line => addBoundaries(
      accumulate(line.points, distanceFn), line.closed
    ));
    const sk = lines.flatMap(line => addBoundaries(
      line.points.map(() => 0), line.closed, 1
    ));
    points(ps);
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
  const dx = (x: number) => ({
    buffer: distanceAlongPath,
    divisor: 1,
    offset: Float32Array.BYTES_PER_ELEMENT * 2 * x,
    stride: Float32Array.BYTES_PER_ELEMENT * 2
  });
  const { setWidth, render } = createLineBase(regl, {
    ...linesBaseOptions,
    declarationsGLSL: glsl`
      ${cameraTransform}
      attribute vec3 ap0, ap1, ap2, ap3;
      attribute float askip;
      attribute vec2 ad1, ad2;
      varying vec2 distanceAlongPath;
      ${declarationsGLSL}
    `,
    defineVerticesGLSL: glsl`
      p0 = ap0, p1 = ap1, p2 = ap2, p3 = ap3;
      skip = askip;
      ${defineVerticesGLSL}
    `,
    mainEndGLSL: glsl`
      distanceAlongPath = mix(ad1, ad2, vUv.x);
      ${mainEndGLSL}
    `
  });
  const cmd = regl({
    attributes: {
      ap0: px(0),
      ap1: px(1),
      ap2: px(2),
      ap3: px(3),
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
    render: () => cmd(() => render())
  };
}