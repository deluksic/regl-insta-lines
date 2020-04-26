import { calculateDistances } from '../calculateDistances';

describe('Test calculateDistances', () => {
  it('returns empty array for empty array input', () => {
    expect(calculateDistances([], () => 1)).toHaveLength(0);
  });

  it('returns [0, 0, 0] for one element', () => {
    expect(calculateDistances([1], () => 1)).toEqual([[0, 0, 0]]);
  });

  it('returns correct values for closed=false', () => {
    const diff = (a: number, b: number) => Math.abs(b - a);
    expect(calculateDistances([1, -2, 3], diff)).toEqual([
      [0, 0, 0],
      [1 / 3, 3, 3 / 8],
      [2 / 3, 8, 1],
    ]);
    expect(calculateDistances([6, 7, 0, -3, 4], diff)).toEqual([
      [0, 0, 0],
      [1 / 5, 1, 1 / 18],
      [2 / 5, 8, 8 / 18],
      [3 / 5, 11, 11 / 18],
      [4 / 5, 18, 1],
    ]);
  });

  it('returns correct values for closed=true', () => {
    const diff = (a: number, b: number) => Math.abs(b - a);
    expect(calculateDistances([1, -2, 3], diff, true)).toEqual([
      [0, 0, 0],
      [1 / 3, 3, 3 / 10],
      [2 / 3, 8, 8 / 10],
      [3 / 3, 10, 1],
    ]);
    expect(calculateDistances([6, 7, 0, -3, 4], diff, true)).toEqual([
      [0, 0, 0],
      [1 / 5, 1, 1 / 20],
      [2 / 5, 8, 8 / 20],
      [3 / 5, 11, 11 / 20],
      [4 / 5, 18, 18 / 20],
      [5 / 5, 20, 1],
    ]);
  });
});