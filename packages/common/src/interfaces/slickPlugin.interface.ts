import type { SlickGrid } from '../core/index';

export interface SlickPlugin {
  pluginName: string;
  init: (grid: SlickGrid) => void;
  destroy: () => void;
}