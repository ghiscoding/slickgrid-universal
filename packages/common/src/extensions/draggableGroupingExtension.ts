import 'slickgrid/plugins/slick.draggablegrouping';

import { DraggableGrouping, Extension, GetSlickEventType, GridOption, SlickDraggableGrouping, SlickEventHandler, SlickNamespace } from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class DraggableGroupingExtension implements Extension {
  private _addon: SlickDraggableGrouping | null;
  private _draggableGroupingOptions: DraggableGrouping | null;
  private _eventHandler: SlickEventHandler;

  constructor(private readonly extensionUtility: ExtensionUtility, private readonly sharedService: SharedService) {
    this._eventHandler = new Slick.EventHandler();
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  dispose() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();

    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
    }
    this.extensionUtility.nullifyFunctionNameStartingWithOn(this._draggableGroupingOptions);
    this._addon = null;
    this._draggableGroupingOptions = null;
  }

  /**
   * Bind/Create different plugins before the Grid creation.
   * For example the multi-select have to be added to the column definition before the grid is created to work properly
   */
  create(gridOptions: GridOption): SlickDraggableGrouping | null {
    if (gridOptions) {
      if (!this._addon) {
        this._addon = new Slick.DraggableGrouping(gridOptions.draggableGrouping);
      }
      return this._addon;
    }
    return null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickDraggableGrouping | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickDraggableGrouping | null {
    if (this._addon && this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      this.sharedService.slickGrid.registerPlugin<SlickDraggableGrouping>(this._addon);

      // Events
      if (this.sharedService.slickGrid && this.sharedService.gridOptions.draggableGrouping) {
        this._draggableGroupingOptions = this.sharedService.gridOptions.draggableGrouping;
        if (this._addon && this._draggableGroupingOptions.onExtensionRegistered) {
          this._draggableGroupingOptions.onExtensionRegistered(this._addon);
        }

        if (this._addon && this._addon.onGroupChanged) {
          const onGroupChangedHandler = this._addon.onGroupChanged;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onGroupChangedHandler>>).subscribe(onGroupChangedHandler, (e, args) => {
            if (this._draggableGroupingOptions && typeof this._draggableGroupingOptions.onGroupChanged === 'function') {
              this._draggableGroupingOptions.onGroupChanged(e, args);
            }
          });
        }
      }

      return this._addon;
    }
    return null;
  }
}
