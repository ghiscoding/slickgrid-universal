
import { ExtensionName } from '../enums/extensionName.enum';
import { Extension } from '../interfaces/index';
import { ExtensionUtility } from './extensionUtility';
import { SharedService } from '../services/shared.service';

// using external non-typed js libraries
declare const Slick: any;

export class RowSelectionExtension implements Extension {
  private _addon: any;

  constructor(private extensionUtility: ExtensionUtility, private sharedService: SharedService) { }

  dispose() {
    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
    }
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance() {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): any {
    if (this.sharedService && this.sharedService.grid && this.sharedService.gridOptions) {
      // dynamically import the SlickGrid plugin (addon) with RequireJS
      this.extensionUtility.loadExtensionDynamically(ExtensionName.rowSelection);

      this._addon = new Slick.RowSelectionModel(this.sharedService.gridOptions.rowSelectionOptions || {});
      this.sharedService.grid.setSelectionModel(this._addon);
      return this._addon;
    }
    return null;
  }
}
