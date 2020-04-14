import { Aggregator } from './../interfaces/aggregator.interface';

export class SumAggregator implements Aggregator {
  private _sum: number = 0;
  private _field: number | string;
  private _type = 'sum';

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
    this._sum = 0;
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '' && !isNaN(val)) {
      this._sum += parseFloat(val);
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals.sum === undefined) {
      groupTotals.sum = {};
    }
    groupTotals.sum[this._field] = this._sum;
  }
}
