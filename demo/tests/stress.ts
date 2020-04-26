import { Regl } from 'regl';
import { createLines } from '../webglLines';
import { createLines as createLines3D } from '../../src/lines';
import { glsl } from '../../src/glsl';

type Algo =
  | typeof createLines3D
  | typeof createLines;

function ecgPoints(nlines = 64, npoints = 1000, scale = 1) {
  return [...new Array(nlines).keys()]
    .map(i => [...new Array(npoints).keys()]
      .map(j => [
        (j + 0.5) / npoints,
        (i + 0.5) / nlines + (Math.random() * 2 - 1) * scale / nlines,
        0
      ] as [number, number, number]));
}

export function main(regl: Regl, algo: Algo) {
  const points = ecgPoints(64, 2000, 0.5);
  const lines = algo(regl, {
    dimension: 3,
    cameraTransform: glsl`
        vec4 cameraTransform(vec4 pos) {
          return pos * 2. - 1.;
        }
      `
  });
  lines.setLines(points.map(l => ({ points: l })));
  lines.setWidth(1);
  regl.frame(() => {
    regl.clear({ color: [0, 0, 0, 1] });
    lines.render();
  });
}