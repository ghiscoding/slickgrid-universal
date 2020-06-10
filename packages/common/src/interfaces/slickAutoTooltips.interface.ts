import { AutoTooltipOption } from './autoTooltipOption.interface';
import { SlickGrid } from './slickGrid.interface';

export interface SlickAutoTooltips {
  pluginName: 'AutoTooltips';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: AutoTooltipOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;
}
