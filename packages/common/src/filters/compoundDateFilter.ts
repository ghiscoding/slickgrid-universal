import type { TranslaterService } from '../services';
import { DateFilter } from './dateFilter';

export class CompoundDateFilter extends DateFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService) {
    super(translaterService);
    this.inputFilterType = 'compound';
  }
}
