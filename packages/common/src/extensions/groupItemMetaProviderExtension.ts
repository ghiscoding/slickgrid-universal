import { Extension, SlickGroupItemMetadataProvider } from '../interfaces/index';
import { SharedService } from '../services/shared.service';

export class GroupItemMetaProviderExtension implements Extension {
  private _addon: SlickGroupItemMetadataProvider | null;

  constructor(private readonly sharedService: SharedService) { }

  dispose() {
    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
    }
    this._addon = null;
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickGroupItemMetadataProvider | null {
    return this._addon;
  }

  /** register the group item metadata provider to add expand/collapse group handlers */
  register(): SlickGroupItemMetadataProvider | null {
    if (this.sharedService && this.sharedService.slickGrid) {
      this._addon = this.sharedService.groupItemMetadataProvider;
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickGroupItemMetadataProvider>(this._addon);
      }
      return this._addon;
    }
    return null;
  }
}
