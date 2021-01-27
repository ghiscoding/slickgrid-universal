import 'slickgrid/plugins/slick.autotooltips';

import { SharedService } from '../services/shared.service';
import { SlickAutoTooltips, Extension, SlickNamespace } from '../interfaces/index';

// using external SlickGrid JS libraries
declare const Slick: SlickNamespace;

export class AutoTooltipExtension implements Extension {
  private _addon: SlickAutoTooltips | null;

  constructor(private readonly sharedService: SharedService) { }

  dispose() {
    if (this._addon && this._addon.destroy) {
      this._addon.destroy();
      this._addon = null;
    }
  }

  /** Get the instance of the SlickGrid addon (control or plugin). */
  getAddonInstance(): SlickAutoTooltips | null {
    return this._addon;
  }

  /** Register the 3rd party addon (plugin) */
  register(): SlickAutoTooltips | null {
    if (this.sharedService && this.sharedService.slickGrid && this.sharedService.gridOptions) {
      const options = this.sharedService.gridOptions.autoTooltipOptions;
      this._addon = new Slick.AutoTooltips(options);
      if (this._addon) {
        this.sharedService.slickGrid.registerPlugin<SlickAutoTooltips>(this._addon);
      }

      return this._addon;
    }
    return null;
  }
}
