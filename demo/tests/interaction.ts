import { Regl } from 'regl';
import { JoinType, CapType, createLines } from '../../src';
import { glsl } from '../../src/glsl';

export function main(regl: Regl) {
  const lines3dcmd = createLines(regl, {
    dimension: 2,
    join: JoinType.round,
    cap: CapType.butt,
    // primitive: 'line strip',
    joinCount: 8,
    frag: glsl`
      precision highp float;
      varying vec3 distanceAlongPath;
      varying vec2 vUv;
      void main() {
        if(gl_FrontFacing) {
          float dash = floor(0.5 + mod(distanceAlongPath.y, 0.05) / 0.05);
          vec3 color = dash > 0.5 ? vec3(.4, .2, .1) : vec3(.6, .2, .1);
          float radial = 1.-abs(0.5 - vUv.y)*2.;
          // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          gl_FragColor = vec4(color, 1.0);
          // gl_FragColor = vec4(0.0, distanceAlongPath.y, 0.0, 1.0);
          // gl_FragColor = vec4(radial, 0.0, 0.0, 1.0);
          // gl_FragColor = vec4(sin(vUv.y*30.), 0.0, 0.0, 1.0);
        } else {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      }
    `,
  });

  const points: [number, number, number][][] = [
    [
      [-.2, 0.2, 0],
      [0.2, 0, 0],
      [0.15, 0.6, 0],
      [0.6, 0.4, 0],
      [0.7, 0.3, 0],
      [0.7, -0.5, 0],
      [0.2, -0.5, 0],
      // [0.9, -0.5, 0]
    ],
    [
      [-0.15, 0.7, 0],
      [-0.7, 0.6, 0],
      [-0.7, -0.0, 0],
    ],
    [
      [-0.15, -0.8, 0],
      [-0.6, -0.6, 0],
      [-0.3, 0., 0],
    ]
  ];
  document.addEventListener('mousemove', m => {
    points[0][0][0] = 2 * m.clientX / window.innerWidth - 1;
    points[0][0][1] = -2 * m.clientY / window.innerHeight + 1;
  });
  regl.frame(() => {
    regl._gl.lineWidth(3);
    regl.clear({ color: [1, 1, 1, 1] });
    lines3dcmd.setLines(points.map((line, i) => ({
      points: line.map(p => [p[0], p[1]]),
      radii: line.map((v, i) => 20 * (Math.sqrt(i) + 1)),
      closed: i === 1
    })));
    // lines3dcmd.setWidth(40 * (0.25 * Math.sin(ctx.time) + 1));
    lines3dcmd.setWidth(50);
    lines3dcmd.render();
  });
}