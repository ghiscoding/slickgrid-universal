import { SliderFilter } from './sliderFilter';
import type { TranslaterService } from '../services';

export class SliderRangeFilter extends SliderFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService) {
    super(translaterService);
    this.sliderType = 'double';
  }
}
