import { DateFilter } from './dateFilter';
import type { TranslaterService } from '../services';

export class DateRangeFilter extends DateFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService) {
    super(translaterService);
    this.inputFilterType = 'range';
  }
}
