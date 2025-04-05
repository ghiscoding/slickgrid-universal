import type { GridOption } from './models/gridOption.interface.js';
import { GlobalGridOptions } from './global-grid-options.js';

export class SlickgridConfig {
  options: Partial<GridOption>;

  constructor() {
    this.options = GlobalGridOptions;
  }
}
