import { GlobalGridOptions } from './global-grid-options.js';
import type { GridOption } from './interfaces/gridOption.interface.js';

export class SlickgridConfig {
  options: Partial<GridOption>;

  constructor() {
    this.options = GlobalGridOptions;
  }
}
