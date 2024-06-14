import { InputFilter } from './inputFilter';
import type { TranslaterService } from '../services';

export class CompoundInputFilter extends InputFilter {
  /**
   * Initialize the Filter
   */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputType = 'text';
    this.inputFilterType = 'compound';
  }
}
