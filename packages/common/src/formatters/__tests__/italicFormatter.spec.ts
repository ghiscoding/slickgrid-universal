import { Column } from '../../interfaces/index';
import { italicFormatter } from '../italicFormatter';

describe('the Italic Formatter', () => {
  it('should return an empty string when no value is passed', () => {
    const value = null;
    const result = italicFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('');
  });

  it('should return an italic html formatted string when value is filled', () => {
    const value = 'john';
    const result = italicFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe(`<i>${value}</i>`);
  });
});
