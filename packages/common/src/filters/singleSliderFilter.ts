import { SliderFilter } from './sliderFilter';
import type { TranslaterService } from '../services';

export class SingleSliderFilter extends SliderFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService) {
    super(translaterService);
    this.sliderType = 'single';
  }
}
