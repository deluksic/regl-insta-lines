import createRegl from 'regl';
import { main as stress } from './tests/stress';
import { main as inter } from './tests/interaction';
import { main as comb } from './tests/combinations';

import { createLines } from './webglLines';
import { createLines as createLines3D } from '../src/lines';

const regl = createRegl({
  extensions: ['ANGLE_instanced_arrays']
});
// stress(regl, createLines);
// stress(regl, createLines);
// inter(regl);
comb(regl);