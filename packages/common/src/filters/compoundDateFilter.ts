import type { TranslaterService } from '../services/translater.service.js';
import { DateFilter } from './dateFilter.js';

export class CompoundDateFilter extends DateFilter {
  /** Initialize the Filter */
  constructor(protected readonly translaterService?: TranslaterService | undefined) {
    super(translaterService);
    this.inputFilterType = 'compound';
  }
}
