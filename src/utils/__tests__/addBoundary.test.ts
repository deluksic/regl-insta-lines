import { addBoundaries } from '../addBoundaries';

describe('Test addBoundaries', () => {
  it('returns empty array for empty array input', () => {
    expect(addBoundaries([])).toHaveLength(0);
    expect(addBoundaries([], true)).toHaveLength(0);
    expect(addBoundaries([], false, undefined)).toHaveLength(0);
    expect(addBoundaries([], true, undefined)).toHaveLength(0);
  });

  it('returns correct boundaries for one element', () => {
    expect(addBoundaries([1.5], false)).toEqual([1.5, 1.5, 1.5]);
    expect(addBoundaries([1.5], true)).toEqual([1.5, 1.5, 1.5, 1.5]);
    expect(addBoundaries([1.5], false, 0)).toEqual([0, 1.5, 0]);
    expect(addBoundaries([1.5], true, 0)).toEqual([0, 1.5, 0, 0]);
  });

  it('returns correct boundaries for multiple elements', () => {
    expect(addBoundaries([1, 2, 3], false)).toEqual([1, 1, 2, 3, 3]);
    expect(addBoundaries([1, 2, 3], true)).toEqual([3, 1, 2, 3, 1, 2]);
    expect(addBoundaries([1, 2, 3], false, 0)).toEqual([0, 1, 2, 3, 0]);
    expect(addBoundaries([1, 2, 3], true, 0)).toEqual([0, 1, 2, 3, 0, 0]);
  });
});