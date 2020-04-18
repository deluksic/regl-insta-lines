import createRegl from 'regl';
import { main as stress } from './tests/stress';
import { main as inter } from './tests/interaction';
import { main as comb } from './tests/combinations';

import { createLines } from './webglLines';
import { createLines3D } from '../src/lines3D';

const regl = createRegl({
  extensions: ['ANGLE_instanced_arrays']
});
// main(regl, createLines);
// main(regl, createLines3D);
// inter(regl);
comb(regl);