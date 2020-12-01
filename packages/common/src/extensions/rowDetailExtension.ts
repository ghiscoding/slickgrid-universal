import { Column, Extension, GridOption, SlickEventHandler, SlickNamespace, SlickRowDetailView, Subscription } from '../interfaces/index';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class RowDetailViewExtension implements Extension {
  private _addon: SlickRowDetailView | null;
  private _eventHandler: SlickEventHandler;
  private _subscriptions: Subscription[] = [];

  constructor() {
    this._eventHandler = new Slick.EventHandler();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Dispose of the RowDetailView Extension */
  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
      this._addon = null;
    }
  }

  /**
   * Create the plugin before the Grid creation, else it will behave oddly.
   * Mostly because the column definitions might change after the grid creation
   */
  create(_columnDefinitions: Column[], _gridOptions: GridOption) {
    throw new Error('[Slickgrid-Universal] Row Detail not yet implemented');
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance() {
    return this._addon;
  }

  register(_rowSelectionPlugin?: SlickRowDetailView) {
    throw new Error('[Slickgrid-Universal] Row Detail not yet implemented');
    return null;
  }
}
