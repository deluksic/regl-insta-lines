import { Regl } from 'regl';
import { JoinType, CapType, createLines3D } from '../../src';
import { glsl } from '../../src/glsl';

export function main(regl: Regl) {
  const lines3dcmd = createLines3D(regl, {
    join: JoinType.miterSquare,
    cap: {
      start: CapType.arrow(),
      end: CapType.butt
    },
    primitive: 'line strip',
    joinCount: 8,
    frag: glsl`
      precision highp float;
      varying vec2 distanceAlongPath;
      varying vec2 vUv;
      void main() {
        if(gl_FrontFacing) {
          float dash = floor(0.5 + mod(distanceAlongPath.x, 0.05) / 0.05);
          vec3 color = dash > 0.5 ? vec3(.4, .2, .1) : vec3(.6, .2, .1);
          // gl_FragColor = vec4(color, 1.0);
          // gl_FragColor = vec4(0.0, distanceAlongPath.y, 0.0, 1.0);
          // gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
          gl_FragColor = vec4(vUv, 0.0, 1.0);
        } else {
          gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
      }
    `,
  });

  const points: [number, number, number][][] = [
    [
      [0, 0, 0],
      [0.2, 0, 0],
      [0.15, 0.6, 0],
      [0.6, 0.4, 0],
      [0.7, 0.3, 0],
      [0.7, -0.5, 0],
      [0.5, -0.5, 0],
      [0.8, -0.5, 0]
    ],
    [
      [-0.15, 0.7, 0],
      [-0.7, 0.6, 0],
      [-0.7, -0.0, 0],
    ],
    [
      [-0.15, -0.8, 0],
      [-0.6, -0.6, 0],
      [-0.4, 0., 0],
    ]
  ];
  document.addEventListener('mousemove', m => {
    points[0][0][0] = 2 * m.clientX / window.innerWidth - 1;
    points[0][0][1] = -2 * m.clientY / window.innerHeight + 1;
  });
  regl.frame(ctx => {
    regl.clear({ color: [1, 1, 1, 1] });
    lines3dcmd.setLines(points.map((line, i) => ({
      points: line,
      radii: line.map((v, i) => 20 * (Math.sqrt(i) + 1)),
      closed: i === 1
    })));
    // lines3dcmd.setWidth(40 * (0.25 * Math.sin(ctx.time) + 1));
    lines3dcmd.setWidth(100);
    lines3dcmd.render();
  });
}