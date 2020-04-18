/**
 * Create a line segment mesh as described here:
 * https://www.geogebra.org/geometry/uw5kurzg
 *
 * Vertices are described using 3 numbers:
 * [P1 | P2, a | P | c, a..b]
 * [-1 | 1, 1 | 0 | -1, 0..1]
 * 
 * @param joinCount
 */
export function lineSegmentMesh(joinCount: number) {
  if (joinCount < 1) {
    throw new Error(`Line segment mesh got invalid value for 'joinCount': ${joinCount}.`);
  }
  const joinCountRange = [...new Array(joinCount).keys()];
  const vertices = [
    // P1 idx=0
    [-1, 0, 0],
    // P2 idx=1
    [1, 0, 0],
    // P1c idx=2
    [-1, -1, 0],
    // P2c idx=3
    [1, -1, 0],
    // P1a to P1b idx=4..(joinCount+4)
    [-1, 1, 0],
    ...joinCountRange.map(
      i => [-1, 1, (i + 1) / joinCount]
    ),
    // P2a to P2b idx=(joinCount+5)..(joinCount*2+5)
    [1, 1, 0],
    ...joinCountRange.map(
      i => [1, 1, (i + 1) / joinCount]
    )
  ] as [number, number, number][];
  const indices = [
    // P1, P2, P2c
    [0, 1, 3],
    // P1, P2c, P1a
    [0, 3, 4],
    // P2, P1, P1c
    [1, 0, 2],
    // P2, P1c, P2a
    [1, 2, joinCount + 5],
    // P1, P1a to P1b
    ...joinCountRange.map(
      i => [0, 4 + i, 5 + i]
    ),
    // P2, P2a to P2b
    ...joinCountRange.map(
      i => [1, joinCount + 5 + i, joinCount + 6 + i]
    )
  ] as [number, number, number][];
  return {
    vertices,
    indices
  };
}
