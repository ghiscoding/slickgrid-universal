import type { SlickGroupTotals } from '../core/slickCore';
import type { Aggregator } from './../interfaces/aggregator.interface';

export class DistinctAggregator implements Aggregator {
  private _isInitialized = false;
  private _field: number | string;
  private _distinctValues: any[] = [];
  private _type = 'distinct' as const;

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get type(): string {
    return this._type;
  }

  init(_item?: any, isTreeAggregator = false): void {
    this._distinctValues = [];
    this._isInitialized = true;
    if (isTreeAggregator) {
      throw new Error('[Slickgrid-Universal] CloneAggregator is not currently supported for use with Tree Data');
    }
  }

  accumulate(item: any): void {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : undefined;
    if (this._distinctValues.indexOf(val) === -1 && val !== undefined) {
      this._distinctValues.push(val);
    }
  }

  storeResult(groupTotals: SlickGroupTotals & { distinct: Record<number | string, any>; }): void {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._distinctValues;
  }
}
