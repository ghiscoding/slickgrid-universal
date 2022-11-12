import { TranslaterService } from '../services';
import { DateFilter } from './dateFilter';

export class DateRangeFilter extends DateFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService: TranslaterService) {
    super(translaterService);
    this.inputFilterType = 'range';
  }
}
