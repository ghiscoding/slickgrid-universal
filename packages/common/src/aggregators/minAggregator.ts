import { Aggregator } from './../interfaces/aggregator.interface';

export class MinAggregator implements Aggregator {
  private _min: number | null;
  private _field: number | string;
  private _type = 'min';

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get type(): string {
    return this._type;
  }

  init() {
    this._min = null;
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '' && !isNaN(val)) {
      if (this._min === null || val < this._min) {
        this._min = parseFloat(val);
      }
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._min;
  }
}
