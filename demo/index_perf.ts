import createRegl from 'regl';
import { main } from './perftests/ecg';

import { createLines } from './webglLines';
import { createLines3D } from '../src/lines3D';

const regl = createRegl({
  extensions: ['ANGLE_instanced_arrays']
});
main(regl, createLines);
// main(regl, createLines3D);
// main(regl, createLines3Dfw);