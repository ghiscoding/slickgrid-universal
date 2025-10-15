import type { TranslaterService } from '../services/translater.service.js';
import { SliderFilter } from './sliderFilter.js';

export class SingleSliderFilter extends SliderFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.sliderType = 'single';
  }
}
