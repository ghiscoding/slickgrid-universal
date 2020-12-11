import { Column } from '../../interfaces/index';
import { iconFormatter } from '../iconFormatter';

describe('the Icon Formatter', () => {
  it('should throw an error when omitting to pass "propertyNames" to "params"', () => {
    expect(() => iconFormatter(0, 0, 'anything', {} as Column, {}, {} as any))
      .toThrowError('You must provide the "icon" or "formatterIcon" via the generic "params"');
  });

  it('should always return a <i> with the icon class name provided in the "icon" property from "params"', () => {
    const input = null;
    const icon = 'fa fa-search';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { icon } } as Column, {}, {} as any);
    expect(result).toBe(`<i class="${icon}" aria-hidden="true"></i>`);
  });

  it('should always return a <i> with the icon class name provided in the "formatterIcon" property from "params"', () => {
    const input = null;
    const icon = 'fa fa-search';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { formatterIcon: icon } } as Column, {}, {} as any);
    expect(result).toBe(`<i class="${icon}" aria-hidden="true"></i>`);
  });
});
