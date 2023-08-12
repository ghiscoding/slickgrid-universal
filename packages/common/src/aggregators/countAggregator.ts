import type { SlickGroupTotals } from 'slickgrid';
import type { Aggregator } from './../interfaces/aggregator.interface';

export class CountAggregator implements Aggregator {
  private _field: number | string;
  private _type = 'count' as const;

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
  }

  storeResult(groupTotals: SlickGroupTotals & { count: Record<number | string, number>; }) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = groupTotals.group.rows.length;
  }
}
