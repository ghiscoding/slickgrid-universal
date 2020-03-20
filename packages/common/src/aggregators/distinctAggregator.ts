import { Aggregator } from './../interfaces/aggregator.interface';

export class DistinctAggregator implements Aggregator {
  private _field: number | string;
  private _distinctValues: any[];

  constructor(field: number | string) {
    this._field = field;
  }

  init(): void {
    this._distinctValues = [];
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : undefined;
    if (this._distinctValues.indexOf(val) === -1 && val !== undefined) {
      this._distinctValues.push(val);
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals.avg === undefined) {
      groupTotals.distinct = {};
    }
    groupTotals.distinct[this._field] = this._distinctValues;
  }
}
