import 'slickgrid/plugins/slick.rowselectionmodel';

import { Extension, SlickRowSelectionModel, SlickNamespace } from '../interfaces/index';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class RowSelectionExtension implements Extension {
  private _addon: SlickRowSelectionModel | null;

  constructor(private readonly sharedService: SharedService) { }

  dispose() {
    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
      this._addon = null;
    }
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickRowSelectionModel | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickRowSelectionModel | null {
    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      this._addon = new Slick.RowSelectionModel(this.sharedService.gridOptions.rowSelectionOptions);
      if (this._addon) {
        this.sharedService.slickGrid.setSelectionModel(this._addon);
      }
      return this._addon;
    }
    return null;
  }
}
