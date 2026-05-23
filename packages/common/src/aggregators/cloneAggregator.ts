import type { Aggregator } from './../interfaces/aggregator.interface.js';
import type { GroupTotals } from './../interfaces/grouping.interface.js';
import { BaseAggregator } from './baseAggregator.js';

export class CloneAggregator extends BaseAggregator implements Aggregator {
  private _data = '';

  constructor(field: number | string) {
    super(field);
    this._type = 'clone' as const;
  }

  init(_item?: any, isTreeAggregator = false): void {
    this._data = '';
    this._isInitialized = true;
    if (isTreeAggregator) {
      throw new Error('[Slickgrid-Universal] CloneAggregator is not currently supported for use with Tree Data');
    }
  }

  accumulate(item: any): void {
    const val = item && item.hasOwnProperty(this._field) ? item[this._field] : null;
    if (val !== null && val !== '') {
      this._data = val;
    }
  }

  storeResult(groupTotals: GroupTotals): void {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._data;
  }
}
