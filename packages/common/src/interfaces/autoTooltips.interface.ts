import { AutoTooltipOption } from './autoTooltipOption.interface';
import { SlickGrid } from './slickGrid.interface';

export interface AutoTooltips {
  pluginName: 'AutoTooltips';

  /** Constructor of the AutoTooltipOption 3rd party plugin, it can optionally receive options */
  constructor: (options: AutoTooltipOption) => void;

  /** Initialize the AutoTooltips 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the AutoTooltips 3rd party plugin */
  destroy(): void;
}
