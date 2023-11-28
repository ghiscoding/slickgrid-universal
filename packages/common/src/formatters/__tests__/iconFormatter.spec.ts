import { Column } from '../../interfaces/index';
import { iconFormatter } from '../iconFormatter';

describe('the Icon Formatter', () => {
  const consoleWarnSpy = jest.spyOn(global.console, 'warn').mockReturnValue();

  it('should throw an error when omitting to pass "propertyNames" to "params"', () => {
    expect(() => iconFormatter(0, 0, 'anything', {} as Column, {}, {} as any))
      .toThrowError('[Slickgrid-Universal] When using `Formatters.icon`, you must provide the "iconCssClass" via the generic "params"');
  });

  it('should always return a <i> with the icon class name provided in the "icon" property from "params"', () => {
    const input = null;
    const icon = 'fa fa-search';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { icon } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe(`<i class="${icon}"></i>`);
  });

  it('should always return a <i> with the icon class name provided in the "formatterIcon" property from "params"', () => {
    const input = null;
    const icon = 'fa fa-search';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { formatterIcon: icon } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe(`<i class="${icon}"></i>`);
  });

  it('should show console warning when using deprecated icon/formatterIcon params', () => {
    const input = null;
    const icon = 'fa fa-search';
    const result = iconFormatter(0, 0, input, { field: 'user', params: { icon } } as Column, {}, {} as any);
    expect((result as HTMLElement).outerHTML).toBe(`<i class="${icon}"></i>`);
    expect(consoleWarnSpy).toHaveBeenCalledWith('[Slickgrid-Universal] deprecated params.icon or params.formatterIcon are deprecated when using `Formatters.icon` in favor of params.iconCssClass. (e.g.: `{ formatter: Formatters.icon, params: { iconCssClass: "fa fa-search" }}`');
  });
});
