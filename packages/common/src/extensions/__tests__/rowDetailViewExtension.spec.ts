import { RowDetailViewExtension } from '../rowDetailViewExtension';
import { Column, GridOption, SlickNamespace } from '../../interfaces/index';

declare const Slick: SlickNamespace;

const mockAddon = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn(),
  getColumnDefinition: jest.fn(),
  onAsyncResponse: new Slick.Event(),
  onAsyncEndUpdate: new Slick.Event(),
  onAfterRowDetailToggle: new Slick.Event(),
  onBeforeRowDetailToggle: new Slick.Event(),
  onRowOutOfViewportRange: new Slick.Event(),
  onRowBackToViewportRange: new Slick.Event()
}));

const mockSelectionModel = jest.fn().mockImplementation(() => ({
  init: jest.fn(),
  destroy: jest.fn()
}));

jest.mock('slickgrid/plugins/slick.rowdetailview', () => mockAddon);
Slick.Plugins = {
  RowDetailView: mockAddon
} as any;

jest.mock('slickgrid/plugins/slick.rowselectionmodel', () => mockSelectionModel);
Slick.RowSelectionModel = mockSelectionModel;

describe('rowDetailViewExtension', () => {
  it('should display a not implemented when calling "create" method', () => {
    expect(() => RowDetailViewExtension.prototype.create!([] as Column[], {} as GridOption)).toThrow('[Slickgrid-Universal] RowDetailViewExtension "create" method is not yet implemented');
  });

  it('should display a not implemented when calling "dispose" method', () => {
    expect(() => RowDetailViewExtension.prototype.dispose!()).toThrow('[Slickgrid-Universal] RowDetailViewExtension "dispose" method is not yet implemented');
  });

  it('should display a not implemented when calling "getAddonInstance" method', () => {
    expect(() => RowDetailViewExtension.prototype.getAddonInstance()).toThrow('[Slickgrid-Universal] RowDetailViewExtension "getAddonInstance" method is not yet implemented');
  });

  it('should display a not implemented when calling "register" method', () => {
    expect(() => RowDetailViewExtension.prototype.register!()).toThrow('[Slickgrid-Universal] RowDetailViewExtension "register" method is not yet implemented');
  });
});
