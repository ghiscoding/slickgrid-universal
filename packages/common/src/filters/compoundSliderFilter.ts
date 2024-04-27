import { SliderFilter } from './sliderFilter';
import type { TranslaterService } from '../services';

export class CompoundSliderFilter extends SliderFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService) {
    super(translaterService);
    this.sliderType = 'compound';
  }
}
