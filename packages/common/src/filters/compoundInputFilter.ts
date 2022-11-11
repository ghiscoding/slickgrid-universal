import { TranslaterService } from '../services';
import { InputFilter } from './inputFilter';

export class CompoundInputFilter extends InputFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService: TranslaterService) {
    super(translaterService);
    this.inputType = 'text';
    super.inputFilterType = 'compound';
  }
}
