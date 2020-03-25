import { TranslaterService } from '../services/translater.service';
import { CompoundInputFilter } from './compoundInputFilter';

export class CompoundInputPasswordFilter extends CompoundInputFilter {
  /** Initialize the Filter */
  constructor(protected translaterService: TranslaterService) {
    super(translaterService);
    this.inputType = 'password';
  }
}
