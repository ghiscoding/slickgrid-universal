import { SlickGridUniversal } from './slickGridUniversal.interface';

export interface SlickPlugin {
  pluginName: string;
  init: (grid: SlickGridUniversal) => void;
  destroy: () => void;
}