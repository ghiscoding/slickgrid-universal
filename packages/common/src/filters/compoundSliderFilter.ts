import { SliderFilter } from './sliderFilter';
import type { TranslaterService } from '../services';

export class CompoundSliderFilter extends SliderFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.sliderType = 'compound';
  }
}
