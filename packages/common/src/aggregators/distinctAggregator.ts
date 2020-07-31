import { Aggregator } from './../interfaces/aggregator.interface';

export class DistinctAggregator implements Aggregator {
  private _field: number | string;
  private _distinctValues: any[];
  private _type = 'distinct';

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
    this._distinctValues = [];
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : undefined;
    if (this._distinctValues.indexOf(val) === -1 && val !== undefined) {
      this._distinctValues.push(val);
    }
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._distinctValues;
  }
}
