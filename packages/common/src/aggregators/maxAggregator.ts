import { Aggregator } from './../interfaces/aggregator.interface';

export class MaxAggregator implements Aggregator {
  private _max: number | null;
  private _field: number | string;
  private _type = 'max';

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get type(): string {
    return this._type;
  }

  init(): void {
    this._max = null;
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '' && !isNaN(val)) {
      if (this._max === null || val > this._max) {
        this._max = parseFloat(val);
      }
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._max;
  }
}
