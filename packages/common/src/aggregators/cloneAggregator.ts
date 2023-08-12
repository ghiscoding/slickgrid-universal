import type { SlickGroupTotals } from 'slickgrid';
import type { Aggregator } from './../interfaces/aggregator.interface';

export class CloneAggregator implements Aggregator {
  private _field: number | string;
  private _data = '';
  private _type = 'clone' as const;

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
    this._data = '';
  }

  accumulate(item: any) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;
    if (val !== null && val !== '') {
      this._data = val;
    }
  }

  storeResult(groupTotals: SlickGroupTotals & { clone: Record<number | string, string>; }) {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    groupTotals[this._type][this._field] = this._data;
  }
}
