import { InputFilter } from './inputFilter.js';
import type { TranslaterService } from '../services/translater.service.js';

export class CompoundInputPasswordFilter extends InputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputType = 'password';
    this.inputFilterType = 'compound';
  }
}
