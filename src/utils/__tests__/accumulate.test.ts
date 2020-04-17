import { accumulate } from '../accumulate';

describe('Test accumulate', () => {
  it('returns empty array for empty array input', () => {
    expect(accumulate([], () => 1)).toHaveLength(0);
  });

  it('returns [0, NaN] for one element', () => {
    expect(accumulate([1], () => 1)).toEqual([[0, Number.NaN]]);
  });

  it('returns accumulated values', () => {
    expect(accumulate([1, -2, 3], (a, b) => Math.abs(b - a)))
      .toEqual([[0, 0.], [3, 0.375], [8, 1.]]);
  });
});