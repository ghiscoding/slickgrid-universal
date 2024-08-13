import { isNumber } from '@slickgrid-universal/utils';

import type { Aggregator, GroupTotals } from './../interfaces';

export class CountAggregator implements Aggregator {
  private _isInitialized = false;
  private _isTreeAggregator = false;
  private _field: number | string;
  private _count = 0;
  private _type = 'count';

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  get type(): string {
    return this._type;
  }

  init(item?: any, isTreeAggregator = false): void {
    this._count = 0;
    this._isInitialized = true;
    this._isTreeAggregator = isTreeAggregator;

    // when dealing with Tree Data structure, we also need to keep sum & itemCount refs
    if (isTreeAggregator) {
      if (!item.__treeTotals) {
        item.__treeTotals = {};
      }
      if (item.__treeTotals[this._type] === undefined) {
        item.__treeTotals[this._type] = {};
      }
      item.__treeTotals[this._type][this._field] = 0;
    }
  }

  accumulate(item: any, isTreeParent = false): void {
    const val = item?.hasOwnProperty(this._field) ? item[this._field] : null;

    // when dealing with Tree Data structure, we need keep only the new sum (without doing any addition)
    if (this._isTreeAggregator) {
      if (isTreeParent) {
        if (!item.__treeTotals) {
          item.__treeTotals = {};
        }
        if (item.__treeTotals[this._type] === undefined) {
          item.__treeTotals[this._type] = {};
        }
        this._count = item.__treeTotals[this._type][this._field] ?? 0;
      } else if (isNumber(val)) {
        this._count = 1;
      }
    }
  }

  storeResult(groupTotals: GroupTotals<number | number[]>): void {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    let itemCount = this._count;

    if (this._isTreeAggregator) {
      // when dealing with Tree Data, we also need to take the parent's total and add it to the final count
      itemCount += groupTotals[this._type][this._field] as number;
    } else {
      itemCount = (groupTotals.group?.rows as number[])?.length ?? 0;
    }
    groupTotals[this._type][this._field] = itemCount;
  }
}