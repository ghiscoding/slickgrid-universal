import { Column } from '../../interfaces/index';
import { yesNoFormatter } from '../yesNoFormatter';

describe('Yes/No Formatter', () => {
  it('should return a "Yes" string when value is passed', () => {
    const output = yesNoFormatter(1, 1, 'blah', {} as Column, {}, {} as any);
    expect(output).toBe('Yes');
  });

  it('should return the string "No" string when empty string provided', () => {
    const output = yesNoFormatter(1, 1, '', {} as Column, {}, {} as any);
    expect(output).toBe('No');
  });

  it('should return the string "No" string when value is null', () => {
    const output = yesNoFormatter(1, 1, null, {} as Column, {}, {} as any);
    expect(output).toBe('No');
  });
});
