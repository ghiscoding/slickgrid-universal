import { GlobalGridOptions } from './global-grid-options';
import type { GridOption } from './models/gridOption.interface';

export class SlickgridConfig {
  options: Partial<GridOption>;

  constructor() {
    this.options = GlobalGridOptions;
  }
}
