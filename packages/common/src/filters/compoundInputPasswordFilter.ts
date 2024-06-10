import { InputFilter } from './inputFilter';
import type { TranslaterService } from '../services/translater.service';

export class CompoundInputPasswordFilter extends InputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputType = 'password';
    this.inputFilterType = 'compound';
  }
}
