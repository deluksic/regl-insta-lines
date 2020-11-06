type ArrayElement<T> = T extends (infer E)[] ? E : never;
/**
 * When drawing a line, each segment is specified using 4 consecutive points: p0, p1, p2, p3.
 * A line segment is drawn only through p1 --- p2, but p0 and p3 are important for
 * segment endings. If p0 === p1, a cap will be drawn on the start, and if p2 === p3
 * a cap will be drawn on the end. Otherwise, an appropriate "accordion" will be computed.
 *
 * Given a line specified by points (p0, p1, ..., pn) generate boundary conditions:
 * - closed: pn, p0, p1, ..., pn, p0, p1
 * - open: p0, p0, p1, ..., pn, pn
 *
 * Or, if fill specified, use that instead:
 * - closed: fill, p0, p1, ..., pn, fill, fill
 * - open: fill, p0, p1, ..., pn, fill
 *
 * @param points
 * @param closed
 * @param fill
 */
export function addBoundaries<T>(
  points: T,
  closed?: boolean,
  fill?: ArrayElement<T>
): ArrayElement<T>[] {
  if (!Array.isArray(points) || points.length === 0) {
    return [];
  }
  if (closed) {
    return [
      fill ?? points[points.length - 1] ?? points[0],
      ...points,
      fill ?? points[0],
      fill ?? points[1] ?? points[0],
    ];
  } else {
    return [
      fill ?? points[0],
      ...points,
      fill ?? points[points.length - 1] ?? points[0]
    ];
  }
}
