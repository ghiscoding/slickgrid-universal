import { TranslaterService } from '../services/translater.service';
import { InputFilter } from './inputFilter';

export class InputPasswordFilter extends InputFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService: TranslaterService) {
    super(translaterService);
    this.inputType = 'password';
  }
}
