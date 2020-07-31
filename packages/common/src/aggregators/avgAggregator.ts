import { Aggregator } from './../interfaces/aggregator.interface';

export class AvgAggregator implements Aggregator {
  private _nonNullCount = 0;
  private _sum: number;
  private _field: number | string;
  private _type = 'avg';

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
    this._nonNullCount = 0;
    this._sum = 0;
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '' && !isNaN(val)) {
      this._nonNullCount++;
      this._sum += parseFloat(val);
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    if (this._nonNullCount !== 0) {
      groupTotals[this._type][this._field] = this._sum / this._nonNullCount;
    }
  }
}
