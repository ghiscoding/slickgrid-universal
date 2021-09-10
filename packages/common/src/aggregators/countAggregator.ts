import type { Aggregator } from './../interfaces/aggregator.interface';

export class CountAggregator implements Aggregator {
  private _field: number | string;
  private _count = 0;
  private _type = 'count';

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get result(): number {
    return this._count;
  }

  get type(): string {
    return this._type;
  }

  init(): void {
    this._count = 0;
  }

  storeResult(groupTotals: any) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    this._count = groupTotals.group.rows.length;
    groupTotals[this._type][this._field] = this._count;
  }
}
