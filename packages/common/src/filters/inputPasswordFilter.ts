import type { TranslaterService } from '../services/translater.service.js';
import { InputFilter } from './inputFilter.js';

export class InputPasswordFilter extends InputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputType = 'password';
  }
}
