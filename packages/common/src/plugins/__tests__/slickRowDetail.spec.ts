import { SlickRowDetailView } from '../slickRowDetailView';

describe('SlickRowDetailView plugin', () => {
  let plugin: SlickRowDetailView;

  beforeEach(() => {
    plugin = new SlickRowDetailView();
  });

  it('should throw a not implemented error when calling "init" method', () => {
    expect(() => plugin.init({} as any)).toThrow('SlickRowDetailView the "init" method must be implemented');
  });

  it('should throw a not implemented error when calling "create" method', () => {
    expect(() => plugin.create([], {} as any)).toThrow('SlickRowDetailView the "create" method must be implemented');
  });

  it('should throw a not implemented error when calling "destroy" method', () => {
    expect(() => plugin.destroy()).toThrow('SlickRowDetailView the "destroy" method must be implemented');
  });

  it('should throw a not implemented error when calling "dispose" method', () => {
    expect(() => plugin.dispose()).toThrow('SlickRowDetailView the "dispose" method must be implemented');
  });

  it('should throw a not implemented error when calling "collapseAll" method', () => {
    expect(() => plugin.collapseAll()).toThrow('SlickRowDetailView the "collapseAll" method must be implemented');
  });

  it('should throw a not implemented error when calling "collapseDetailView" method', () => {
    expect(() => plugin.collapseDetailView({} as any, true)).toThrow('SlickRowDetailView the "collapseDetailView" method must be implemented');
  });

  it('should throw a not implemented error when calling "expandDetailView" method', () => {
    expect(() => plugin.expandDetailView({} as any)).toThrow('SlickRowDetailView the "expandDetailView" method must be implemented');
  });

  it('should throw a not implemented error when calling "expandableOverride" method', () => {
    expect(() => plugin.expandableOverride({} as any)).toThrow('SlickRowDetailView the "expandableOverride" method must be implemented');
  });

  it('should throw a not implemented error when calling "getColumnDefinition" method', () => {
    expect(() => plugin.getColumnDefinition()).toThrow('SlickRowDetailView the "getColumnDefinition" method must be implemented');
  });

  it('should throw a not implemented error when calling "getExpandedRows" method', () => {
    expect(() => plugin.getExpandedRows()).toThrow('SlickRowDetailView the "getExpandedRows" method must be implemented');
  });

  it('should throw a not implemented error when calling "getFilterItem" method', () => {
    expect(() => plugin.getFilterItem({} as any)).toThrow('SlickRowDetailView the "getFilterItem" method must be implemented');
  });

  it('should throw a not implemented error when calling "getOptions" method', () => {
    expect(() => plugin.getOptions()).toThrow('SlickRowDetailView the "getOptions" method must be implemented');
  });

  it('should throw a not implemented error when calling "resizeDetailView" method', () => {
    expect(() => plugin.resizeDetailView({} as any)).toThrow('SlickRowDetailView the "resizeDetailView" method must be implemented');
  });

  it('should throw a not implemented error when calling "saveDetailView" method', () => {
    expect(() => plugin.saveDetailView({} as any)).toThrow('SlickRowDetailView the "saveDetailView" method must be implemented');
  });

  it('should throw a not implemented error when calling "setOptions" method', () => {
    expect(() => plugin.setOptions({} as any)).toThrow('SlickRowDetailView the "setOptions" method must be implemented');
  });
});
