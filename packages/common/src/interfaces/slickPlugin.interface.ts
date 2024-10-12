import type { SlickGrid } from '../core/index.js';

export interface SlickPlugin {
  pluginName: string;
  init: (grid: SlickGrid) => void;
  destroy: () => void;
}