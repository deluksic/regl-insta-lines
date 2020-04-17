import createRegl from 'regl';
import { JoinType, CapType, createLines3D } from '../src';
import { glsl } from '../src/glsl';

const regl = createRegl({
  extensions: [
    'ANGLE_instanced_arrays'
  ]
});

const lines3dcmd = createLines3D(regl, {
  join: JoinType.round,
  cap: CapType.round,
  // primitive: 'lines',
  joinCount: 8,
  frag: glsl`
    precision highp float;
    varying vec2 distanceAlongPath;
    varying vec2 vUv;
    void main() {
      if(gl_FrontFacing) {
        // gl_FragColor = vec4(vec3(floor(0.5 + mod(distanceAlongPath.x, 0.1) / 0.1)), 1.0);
        // gl_FragColor = vec4(0.0, distanceAlongPath.y, 0.0, 1.0);
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
    [0.85, -0.5, 0]
  ],
  [
    [-0.15, 0.6, 0],
    [-0.6, 0.4, 0],
    [-0.7, -0.2, 0],
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
// const p0123 = [... new Array(points.length - 3)].map((_, i) => points.slice(i, i + 4)).flat();
regl.frame(ctx => {
  regl.clear({ color: [0, 0, 0, 1] });
  lines3dcmd.setLines(points.map((line, i) => ({
    points: line,
    // widths: line.map((v, i) => 40 * (i + 1)),
    closed: i === 1
  })));
  // lines3dcmd.setWidth(40 * (0.25 * Math.sin(ctx.time) + 1));
  lines3dcmd.setWidth(100);
  lines3dcmd.render();
});