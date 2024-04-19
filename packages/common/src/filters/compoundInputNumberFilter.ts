import { InputFilter } from './inputFilter';
import type { TranslaterService } from '../services/translater.service';

export class CompoundInputNumberFilter extends InputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService) {
    super(translaterService);
    this.inputType = 'number';
    this.inputFilterType = 'compound';
  }
}
