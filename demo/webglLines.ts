import REGL, { Regl } from 'regl';
import { glsl, GLSL } from '../src/glsl';
import { Line3DDescriptor } from 'regl-lines/src';

const defaultCameraTransform = glsl`
  vec4 cameraTransform(vec4 pos) {
    return pos;
  }
`;

export type CreateLineOptions = {
  /**
   * Shader code for camera transformation:
   * ```glsl
   * vec4 cameraTransform(vec4 pos);
   * ```
   */
  cameraTransform?: GLSL;
}

export type LinesUniforms = {
  color: [number, number, number, number];
}

export type LinesAttributes = {
  position: [number, number, number][] | REGL.Buffer;
}

export type LinesProps = LinesUniforms & {
  points: [number, number, number][] | REGL.Buffer;
  count: number;
};

/**
 * Creates a regl lines drawing command.
 */
export function createLines(regl: Regl, {
  cameraTransform = defaultCameraTransform
}: CreateLineOptions & { width?: number }) {
  const points = regl.buffer({ type: 'float32' });
  let count = 0;
  function setWidth() {
    // noop
  }
  function setLines(lines: Line3DDescriptor[]) {
    const positions = lines.flatMap(l => l.points);
    points(positions);
    count = positions.length;
  }
  const render = regl<LinesUniforms, LinesAttributes, LinesProps>({
    vert: glsl`
      precision highp float;

      ${cameraTransform}

      attribute vec3 position;

      void main() {
        gl_Position = cameraTransform(vec4(position, 1.0));
      }
    `,
    frag: glsl`
      precision highp float;
      uniform vec4 color;
      void main() {
        gl_FragColor = color;
      }
    `,
    attributes: {
      position: points
    },
    uniforms: {
      color: (_, props) => props?.color ?? [1, 1, 1, 1]
    },
    primitive: 'line strip',
    count: () => count
  });
  return {
    render,
    setWidth,
    setLines
  };
}