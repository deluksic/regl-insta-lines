import { lineSegmentMesh } from '../lineSegmentMesh';

describe('Test lineSegmentMesh', () => {
  it('throws on joinCount < 1', () => {
    expect(() => lineSegmentMesh(0)).toThrow('Line segment mesh got invalid value for \'joinCount\': 0.');
    expect(() => lineSegmentMesh(-1)).toThrow('Line segment mesh got invalid value for \'joinCount\': -1.');
  });

  it('returns correctly for joinCount=1', () => {
    expect(lineSegmentMesh(1)).toEqual({
      indices: [[0, 1, 4], [3, 4, 1], [0, 4, 5], [3, 1, 2]],
      vertices: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 0], [0, 1, 0], [0, 1, 1]]
    });
  });

  it('returns correctly for joinCount=2', () => {
    expect(lineSegmentMesh(2)).toEqual({
      indices: [[0, 1, 5], [4, 5, 1], [0, 5, 6], [0, 6, 7], [4, 1, 2], [4, 2, 3]],
      vertices: [[0, 0, 0], [1, 0, 0], [1, 0, 0.5], [1, 0, 1], [1, 1, 0], [0, 1, 0], [0, 1, 0.5], [0, 1, 1]]
    });
  });

  it('returns correct number of vertices/indices for joinCount > 2', () => {
    const mesh = lineSegmentMesh(64);
    // 64 + 64 + 4 main vertices = 132
    expect(mesh.vertices.length).toEqual(132);
    // 64 + 64 + 2 main triangles = 130
    expect(mesh.indices.length).toEqual(130);
  });
});