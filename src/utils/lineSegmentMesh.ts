/**
 * Create a line segment mesh as follows:
 * 
 * Left accordion            <-- idxTop
 *                                  |
 * [0,1,1]..[0,1,0.5]..[0,1,0]---[1,1,0]
 *      \          \      |  \      |  \    \
 *           \       \    |    \    |    \       \
 *                \    \  |      \  |      \          \
 *                     [0,0,0]---[1,0,0]..[1,0,0.5]..[1,0,1]
 *                        |
 *                     idxBot -->            Right accordion
 *
 * @param joinCount
 */
export function lineSegmentMesh(joinCount: number) {
  if (joinCount < 1) {
    throw new Error(`Line segment mesh got invalid value for 'joinCount': ${joinCount}.`);
  }
  // fill(0) must be used!
  const joinCountRange = new Array(joinCount).fill(0).map((_, i) => i);
  const vertices = [
    // bottom line (left-to-right)
    [0, 0, 0], [1, 0, 0],
    ...joinCountRange.map(i => [1, 0, (i + 1) / joinCount]),
    // top line (right-to-left)
    [1, 1, 0], [0, 1, 0],
    ...joinCountRange.map(i => [0, 1, (i + 1) / joinCount]),
  ] as [number, number, number][];
  const idxBot = 0;
  const idxTop = joinCount + 2;
  const indices = [
    // two middle triangles
    [idxBot, idxBot + 1, idxTop + 1],
    [idxTop, idxTop + 1, idxBot + 1],
    // left accordion
    ...joinCountRange.map(i => [idxBot, idxTop + i + 1, idxTop + i + 2]),
    // right accordion
    ...joinCountRange.map(i => [idxTop, idxBot + i + 1, idxBot + i + 2])
  ] as [number, number, number][];
  return {
    vertices,
    indices
  };
}
