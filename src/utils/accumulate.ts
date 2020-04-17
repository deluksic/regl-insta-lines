/**
 * Given an array of elements and a function to specify "distance" between
 * elements, compute total and relative distance for each element. E.g.:
 * ```
 * accumulate([1, -2, 3], (a, b) => Math.abs(b - a))  // [[0, 0.], [3, 0.375], [8, 1.]]
 * ```
 * @param array
 * @param fn
 */
export function accumulate<T>(array: T[], fn: (prev: T, curr: T) => number) {
  let sum = 0;
  const acc = new Array(array.length).fill(0).map(() => [0, 0] as [number, number]);
  for (let i = 1; i < array.length; ++i) {
    sum += fn(array[i - 1], array[i]);
    acc[i][0] = sum;
  }
  for (let i = 0; i < array.length; ++i) {
    acc[i][1] = acc[i][0] / sum;
  }
  return acc;
}