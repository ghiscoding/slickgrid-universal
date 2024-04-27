import type { SlickGroupTotals } from '../core/slickCore';
import type { Aggregator } from './../interfaces/aggregator.interface';

export class CloneAggregator implements Aggregator {
  private _isInitialized = false;
  private _field: number | string;
  private _data = '';
  private _type = 'clone' as const;

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get isInitialized() {
    return this._isInitialized;
  }

  get type(): string {
    return this._type;
  }

  init(_item?: any, isTreeAggregator = false): void {
    this._data = '';
    this._isInitialized = true;
    if (isTreeAggregator) {
      throw new Error('[Slickgrid-Universal] CloneAggregator is not currently supported for use with Tree Data');
    }
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '') {
      this._data = val;
    }
  }

  storeResult(groupTotals: SlickGroupTotals & { clone: Record<number | string, string>; }) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._data;
  }
}
