import 'slickgrid/plugins/slick.headerbuttons';

import { Extension, GetSlickEventType, SlickEventHandler, SlickNamespace, SlickHeaderButtons, HeaderButton } from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class HeaderButtonExtension implements Extension {
  private _eventHandler: SlickEventHandler;
  private _addon: SlickHeaderButtons | null;
  private _headerButtonOptions: HeaderButton | null;

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
    this.extensionUtility.nullifyFunctionNameStartingWithOn(this._headerButtonOptions);
    this._addon = null;
    this._headerButtonOptions = null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickHeaderButtons | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickHeaderButtons | null {
    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      this._headerButtonOptions = this.sharedService.gridOptions.headerButton || {};
      this._addon = new Slick.Plugins.HeaderButtons(this._headerButtonOptions);
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickHeaderButtons>(this._addon);
      }

      // hook all events
      if (this._addon && this.sharedService.slickGrid && this._headerButtonOptions) {
        if (this._headerButtonOptions.onExtensionRegistered) {
          this._headerButtonOptions.onExtensionRegistered(this._addon);
        }

        const onCommandHandler = this._addon.onCommand;
        if (onCommandHandler) {
          (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCommandHandler>>).subscribe(onCommandHandler, (e, args) => {
            if (this._headerButtonOptions && typeof this._headerButtonOptions.onCommand === 'function') {
              this._headerButtonOptions.onCommand(e, args);
            }
          });
        }
      }
      return this._addon;
    }
    return null;
  }
}
