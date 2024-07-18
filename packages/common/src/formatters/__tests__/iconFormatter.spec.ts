import { Column } from '../../interfaces/index';
import { iconFormatter } from '../iconFormatter';

describe('the Icon Formatter', () => {
  it('should throw an error when omitting to pass "propertyNames" to "params"', () => {
    expect(() => iconFormatter(0, 0, 'anything', {} as Column, {}, {} as any))
      .toThrowError('[Slickgrid-Universal] When using `Formatters.icon`, you must provide the "iconCssClass" via the generic "params"');
  });

  it('should always return a <i> with the icon class name provided in the "icon" property from "params"', () => {
    const input = null;
    const icon = 'mdi mdi-magnify';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { icon } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe(`<i class="${icon}" aria-hidden="true"></i>`);
  });

  it('should always return a <i> with the icon class name provided in the "formatterIcon" property from "params"', () => {
    const input = null;
    const icon = 'mdi mdi-magnify';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { formatterIcon: icon } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe(`<i class="${icon}" aria-hidden="true"></i>`);
  });

  it('should always return a <i> with the title attribute provided in the "title" property from "params"', () => {
    const input = null;
    const title = 'This is a title';
    const icon = 'mdi mdi-magnify';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { icon, title } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe(`<i class="${icon}" aria-hidden="true" title="${title}"></i>`);
  });
});
