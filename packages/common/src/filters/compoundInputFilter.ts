import { InputFilter } from './inputFilter';
import { TranslaterService } from '../services';

export class CompoundInputFilter extends InputFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService: TranslaterService) {
    super(translaterService);
    this.inputType = 'text';
    this.inputFilterType = 'compound';
  }
}
