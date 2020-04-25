import { lineSegmentMesh } from '../lineSegmentMesh';

describe('Test lineSegmentMesh', () => {
  it('throws on joinCount < 1', () => {
    expect(() => lineSegmentMesh(0)).toThrow('Line segment mesh got invalid value for \'joinCount\': 0.');
    expect(() => lineSegmentMesh(-1)).toThrow('Line segment mesh got invalid value for \'joinCount\': -1.');
  });

  it('returns correctly for joinCount=1', () => {
    expect(lineSegmentMesh(1)).toEqual({
      indices: [[0, 1, 3], [0, 3, 4], [1, 0, 2], [1, 2, 6], [0, 4, 5], [1, 6, 7]],
      vertices: [[-1, 0, 0], [1, 0, 0], [-1, -1, 0], [1, -1, 0], [-1, 1, 0], [-1, 1, 1], [1, 1, 0], [1, 1, 1]]
    });
  });

  it('returns correctly for joinCount=2', () => {
    expect(lineSegmentMesh(2)).toEqual({
      indices: [[0, 1, 3], [0, 3, 4], [1, 0, 2], [1, 2, 7], [0, 4, 5], [0, 5, 6], [1, 7, 8], [1, 8, 9]],
      vertices: [[-1, 0, 0], [1, 0, 0], [-1, -1, 0], [1, -1, 0], [-1, 1, 0], [-1, 1, 0.5], [-1, 1, 1], [1, 1, 0], [1, 1, 0.5], [1, 1, 1]]
    });
  });

  it('returns correct number of vertices/indices for joinCount > 2', () => {
    const mesh = lineSegmentMesh(64);
    // 64 + 64 + 6 main vertices = 134
    expect(mesh.vertices.length).toEqual(134);
    // 64 + 64 + 4 main triangles = 132
    expect(mesh.indices.length).toEqual(132);
  });
});