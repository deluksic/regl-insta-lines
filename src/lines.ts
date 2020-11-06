import { Regl } from 'regl';
import { glsl, GLSL } from './glsl';
import {
  createLineBase,
  defaultCameraTransform,
  CreateLineBaseOptions
} from './base';
import { addBoundaries } from './utils/addBoundaries';
import { calculateDistances } from './utils/calculateDistances';

export type PositionDimension = 2 | 3;
export type PositionType<PDim extends PositionDimension> =
  PDim extends 2 ? [number, number] :
  PDim extends 3 ? [number, number, number] :
  never;
export type DistanceFn<PDim extends PositionDimension> = (a: PositionType<PDim>, b: PositionType<PDim>) => number;

const defaultDistanceFn: DistanceFn<2 | 3> = (a, b) => {
  const [x, y, z] = [b[0] - a[0], b[1] - a[1], (b[2] ?? 0) - (a[2] ?? 0)];
  return Math.sqrt(x * x + y * y + z * z);
};

export type CreateLinesOptions<PDim extends PositionDimension> = CreateLineBaseOptions & {
  /**
   * Positions can be specified using 2 or 3 floats.
   * In case of 2 floats, z coordinate will be zero inside the shader.
   * @default 3
   */
  dimension?: PDim;
  /**
   * Optional GLSL code for the camera:
   * transform:
   * ```glsl
   * // ...your uniforms...
   * vec4 cameraTransform(vec4 pos) {
   *   return // ...your cool non-linear camera
   * }
   * ```
   */
  cameraTransformGLSL?: GLSL;
  /**
   * In addition to base frag varyings:
   * ```glsl
   * varying vec3 distanceAlongPath;
   * ```
   * Components:
   *   x = index / number of points
   *   y = distance
   *   z = distance / total distance
   */
  frag?: GLSL;
  /**
   * Function to be used to calculate distanceAlongPath varying.
   */
  distanceFn?: DistanceFn<PDim>;
}

export type LineDescriptor<PDim extends PositionDimension> = {
  points: PositionType<PDim>[];
  closed?: boolean;
}

export function createLines<PDim extends PositionDimension = 3>(
  regl: Regl,
  {
    cameraTransformGLSL = defaultCameraTransform,
    declarationsGLSL,
    defineVerticesGLSL,
    dimension = 3 as PDim,
    distanceFn = defaultDistanceFn,
    mainEndGLSL,
    ...linesBaseOptions
  }: CreateLinesOptions<PDim>
): {
  setLines: (lines: LineDescriptor<PDim>[]) => void;
  setWidth: (newWidth: number) => number;
  render: () => void;
} {
  let count = 0;
  const points = regl.buffer({ type: 'float32' });
  const distanceAlongPath = regl.buffer({ type: 'float32' });
  const skipSegment = regl.buffer({ type: 'float32' });
  function setLines(lines: LineDescriptor<PDim>[]) {
    const ps = lines.flatMap(
      line => addBoundaries(line.points, line.closed)
    );
    const ds = lines.flatMap(
      line => addBoundaries(calculateDistances(line.points, distanceFn, line.closed), false, [0, 0, 0])
    );
    const sk = lines.flatMap(
      line => addBoundaries(line.points.map(() => 0), line.closed, 1)
    );
    points(ps);
    distanceAlongPath(ds);
    skipSegment(sk);
    count = ps.length - 3;
  }
  const px = (x: number) => ({
    buffer: points,
    divisor: 1,
    offset: Float32Array.BYTES_PER_ELEMENT * dimension * x,
    stride: Float32Array.BYTES_PER_ELEMENT * dimension
  });
  const dx = (x: number) => ({
    buffer: distanceAlongPath,
    divisor: 1,
    offset: Float32Array.BYTES_PER_ELEMENT * 3 * x,
    stride: Float32Array.BYTES_PER_ELEMENT * 3
  });
  const positionAssign = {
    2: 'p0.xy = ap0, p1.xy = ap1, p2.xy = ap2, p3.xy = ap3;',
    3: 'p0 = ap0, p1 = ap1, p2 = ap2, p3 = ap3;',
  };
  const { setWidth, render } = createLineBase(regl, {
    ...linesBaseOptions,
    declarationsGLSL: glsl`
      ${cameraTransformGLSL}
      attribute vec${dimension} ap0, ap1, ap2, ap3;
      attribute vec3 ad1, ad2;
      attribute float askip;
      varying vec3 distanceAlongPath;
      ${declarationsGLSL}
    `,
    defineVerticesGLSL: glsl`
      ${positionAssign[dimension]}
      skip = askip;
      ${defineVerticesGLSL}
    `,
    mainEndGLSL: glsl`
      // use vUv.x to mix distances since vUv.x will have
      // corrected distance along the segment due to
      // reverse miter
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
