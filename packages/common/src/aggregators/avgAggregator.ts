import type { SlickGroupTotals } from 'slickgrid';
import type { Aggregator } from './../interfaces/aggregator.interface';

export class AvgAggregator<T = any> implements Aggregator {
  private _nonNullCount = 0;
  private _sum = 0;
  private _field: number | string;
  private _type = 'avg' as const;

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

  accumulate(item: T) {
    const val: any = (item && item.hasOwnProperty(this._field)) ? item[this._field as keyof T] : null;
    if (val !== null && val !== '' && !isNaN(val)) {
      this._nonNullCount++;
      this._sum += parseFloat(val);
    }
  }

  storeResult(groupTotals: SlickGroupTotals & { avg: Record<number | string, number>; }) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    if (this._nonNullCount !== 0) {
      groupTotals[this._type][this._field] = this._sum / this._nonNullCount;
    }
  }
}
