/* eslint-disable @typescript-eslint/no-unused-vars */
import { Column, Extension, GridOption, SlickRowDetailView, SlickRowSelectionModel } from '../interfaces/index';

export class RowDetailViewExtension implements Extension {
  /** Dispose of the RowDetailView Extension */
  dispose() {
    throw new Error('[Slickgrid-Universal] RowDetailViewExtension "dispose" method is not yet implemented');
  }

  /**
   * Create the plugin before the Grid creation, else it will behave oddly.
   * Mostly because the column definitions might change after the grid creation
   */
  create(_columnDefinitions: Column[], _gridOptions: GridOption) {
    throw new Error('[Slickgrid-Universal] RowDetailViewExtension "create" method is not yet implemented');
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance() {
    throw new Error('[Slickgrid-Universal] RowDetailViewExtension "getAddonInstance" method is not yet implemented');
  }

  register(_rowSelectionPlugin?: SlickRowSelectionModel): SlickRowDetailView | null {
    throw new Error('[Slickgrid-Universal] RowDetailViewExtension "register" method is not yet implemented');
  }
}
