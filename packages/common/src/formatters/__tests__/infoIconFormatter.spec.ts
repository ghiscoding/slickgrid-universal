import { Column } from '../../interfaces/index';
import { infoIconFormatter } from '../infoIconFormatter';

describe('the Info Icon Formatter', () => {
  it('should always return the Font Awesome Info icon even when False is provided', () => {
    const value = false;
    const result = infoIconFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('<i class="fa fa-info-circle pointer info-icon" aria-hidden="true"></i>');
  });

  it('should return the Font Awesome Info icon when input is filled with any string', () => {
    const value = 'anything';
    const result = infoIconFormatter(0, 0, value, {} as Column, {}, {} as any);
    expect(result).toBe('<i class="fa fa-info-circle pointer info-icon" aria-hidden="true"></i>');
  });
});
