import type { SlickGrid } from '../core/slickGrid.js';

export interface SlickPlugin {
  pluginName: string;
  init: (grid: SlickGrid) => void;
  destroy: () => void;
}
