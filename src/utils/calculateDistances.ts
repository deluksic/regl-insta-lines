/**
 * Given an array of elements and a function to specify "distance" between
 * elements, compute normalized index, total and relative distance for each element. E.g.:
 * ```
 * calculateDistances([1, -2, 3], (a, b) => Math.abs(b - a))  // [[0., 0, 0.], [0.333, 3, 0.375], [0.666, 8, 1.]]
 * ```
 * @param array
 * @param distanceFn
 * @param closed If closed, its as if the first point was added to the end
 */
export function calculateDistances<T>(
  array: T[],
  distanceFn: (prev: T, curr: T) => number,
  closed?: boolean
): [number, number, number][] {
  let sum = 0;
  const len = array.length + (closed ? 1 : 0);
  const acc = [...new Array(len).keys()].map(
    i => {
      if (i === 0) return [0, 0, 0] as [number, number, number];
      sum += distanceFn(array[i - 1], array[i % array.length]);
      return [i / array.length, sum, 0] as [number, number, number];
    }
  );
  // prevent div by 0
  sum = sum === 0 ? 1 : sum;
  // after everything is summed up, calculate relative distances
  for (let i = 0; i < len; ++i) {
    acc[i][2] = acc[i][1] / sum;
  }
  return acc;
}