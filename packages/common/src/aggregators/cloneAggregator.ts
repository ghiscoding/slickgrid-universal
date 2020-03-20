import { Aggregator } from './../interfaces/aggregator.interface';

export class CloneAggregator implements Aggregator {
  private _field: number | string;
  private _data: any;

  constructor(field: number | string) {
    this._field = field;
  }

  init(): void {
    this._data = '';
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '') {
      this._data = val;
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals.clone === undefined) {
      groupTotals.clone = {};
    }
    groupTotals.clone[this._field] = this._data;
  }
}
