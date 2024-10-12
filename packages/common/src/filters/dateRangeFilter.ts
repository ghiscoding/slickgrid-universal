import { DateFilter } from './dateFilter.js';
import type { TranslaterService } from '../services/translater.service.js';

export class DateRangeFilter extends DateFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputFilterType = 'range';
  }
}
