import { ExtensionName } from '../enums/index';
import { Extension, GetSlickEventType, GridOption, SlickDraggableGrouping, SlickEventHandler, SlickNamespace } from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class DraggableGroupingExtension implements Extension {
  private _addon: SlickDraggableGrouping | null;
  private _eventHandler: SlickEventHandler;

  constructor(private extensionUtility: ExtensionUtility, private sharedService: SharedService) {
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
  }

  /**
   * Bind/Create different plugins before the Grid creation.
   * For example the multi-select have to be added to the column definition before the grid is created to work properly
   */
  create(gridOptions: GridOption): SlickDraggableGrouping | null {
    if (gridOptions) {
      // dynamically import the SlickGrid plugin (addon) with RequireJS
      this.extensionUtility.loadExtensionDynamically(ExtensionName.draggableGrouping);

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
    if (this._addon && this.sharedService && this.sharedService.grid && this.sharedService.gridOptions) {
      this.sharedService.grid.registerPlugin<SlickDraggableGrouping>(this._addon);

      // Events
      if (this.sharedService.grid && this.sharedService.gridOptions.draggableGrouping) {
        if (this._addon && this.sharedService.gridOptions.draggableGrouping.onExtensionRegistered) {
          this.sharedService.gridOptions.draggableGrouping.onExtensionRegistered(this._addon);
        }

        if (this._addon && this._addon.onGroupChanged) {
          const onGroupChangedHandler = this._addon.onGroupChanged;
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onGroupChangedHandler>>).subscribe(onGroupChangedHandler, (e, args) => {
            if (this.sharedService.gridOptions.draggableGrouping && typeof this.sharedService.gridOptions.draggableGrouping.onGroupChanged === 'function') {
              this.sharedService.gridOptions.draggableGrouping.onGroupChanged(e, args);
            }
          });
        }
      }

      return this._addon;
    }
    return null;
  }
}
