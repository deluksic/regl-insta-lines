import { Regl } from 'regl';
import { JoinType, CapType, createLines3D } from '../../src';
import { glsl } from '../../src/glsl';
import { vec3 } from 'gl-matrix';
import { GUI } from 'dat.gui';

function maybeString(s: string | (() => string)): string {
  if (typeof s === 'function') {
    return s();
  }
  return s;
}

const capjoin = Object.keys(CapType).flatMap(
  ct => Object.keys(JoinType).map(jt => ({
    cap: maybeString(CapType[ct as keyof typeof CapType]),
    join: maybeString(JoinType[jt as keyof typeof JoinType])
  })));

const testLine = (angle: number, scale: number, shift: [number, number]) => [
  [shift[0] + scale * -Math.sin(angle / 2), shift[1] + scale * Math.cos(angle / 2) / 2, 0],
  [shift[0], shift[1] - scale * Math.cos(angle / 2) / 4, 0],
  [shift[0] + scale * Math.sin(angle / 2), shift[1] + scale * Math.cos(angle / 2) / 2, 0]
] as vec3[];

const testLines = (count: number, shifty: number) => [...new Array(count).keys()]
  .map(i => ({
    points: testLine(i / (count - 1) * 2 * Math.PI, 0.08, [(i + .5) / count * 2 - 1, shifty])
  }));

export function main(regl: Regl) {
  const opts = {
    width: 10
  };
  const gui = new GUI();
  gui.add(opts, 'width', 0, 30, 0.0001);
  const linecmds = capjoin.map(({ cap, join }) => createLines3D(regl, {
    cap,
    join,
    primitive: 'line strip',
    joinCount: 8,
    frag: glsl`
      precision highp float;
      varying vec2 distanceAlongPath;
      varying vec2 vUv;
      void main() {
        if(gl_FrontFacing) {
          float dash = floor(0.5 + mod(distanceAlongPath.x, 0.03) / 0.03);
          vec3 color = dash > 0.5 ? vec3(.4, .2, .1) : vec3(.6, .2, .1);
          gl_FragColor = vec4(color, 1.0);
          // gl_FragColor = vec4(0.0, distanceAlongPath.y, 0.0, 1.0);
          // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        } else {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      }
    `,
  }));
  linecmds.forEach((cmd, i) => {
    cmd.setWidth(opts.width);
    cmd.setLines(testLines(9, -(i + .5) / linecmds.length * 2 + 1))
  });
  regl.frame(() => {
    linecmds.forEach(cmd => {
      cmd.setWidth(opts.width);
    });
    regl.clear({ color: [1, 1, 1, 1] });
    linecmds.forEach(cmd => cmd.render());
  });
}