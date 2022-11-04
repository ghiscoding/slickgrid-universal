import { TranslaterService } from '../services';
import { SliderFilter } from './sliderFilter';

export class SingleSliderFilter extends SliderFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService: TranslaterService) {
    super(translaterService);
    super.sliderType = 'single';
  }
}
