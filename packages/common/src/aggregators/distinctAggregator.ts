import type { Aggregator } from './../interfaces/aggregator.interface.js';
import type { GroupTotals } from './../interfaces/grouping.interface.js';
import { BaseAggregator } from './baseAggregator.js';

export class DistinctAggregator extends BaseAggregator implements Aggregator {
  private _distinctValues: any[] = [];

  constructor(field: number | string) {
    super(field);
    this._type = 'distinct' as const;
  }

  init(_item?: any, isTreeAggregator = false): void {
    this._distinctValues = [];
    this._isInitialized = true;
    if (isTreeAggregator) {
      throw new Error('[Slickgrid-Universal] CloneAggregator is not currently supported for use with Tree Data');
    }
  }

  accumulate(item: any): void {
    const val = item && item.hasOwnProperty(this._field) ? item[this._field] : undefined;
    if (this._distinctValues.indexOf(val) === -1 && val !== undefined) {
      this._distinctValues.push(val);
    }
  }

  storeResult(groupTotals: GroupTotals<any[]>): void {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._distinctValues;
  }
}
