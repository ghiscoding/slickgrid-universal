import { TranslaterService } from '../services/translater.service';
import { CompoundInputFilter } from './compoundInputFilter';

export class CompoundInputNumberFilter extends CompoundInputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService: TranslaterService) {
    super(translaterService);
    this.inputType = 'number';
  }
}
