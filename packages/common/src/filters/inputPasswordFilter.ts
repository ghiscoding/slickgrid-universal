import { InputFilter } from './inputFilter';
import type { TranslaterService } from '../services/translater.service';

export class InputPasswordFilter extends InputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputType = 'password';
  }
}
