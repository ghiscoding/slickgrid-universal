import { isNumber } from '@slickgrid-universal/utils';
import type { Aggregator } from './../interfaces/aggregator.interface.js';
import type { GroupTotals } from './../interfaces/grouping.interface.js';
import { BaseAggregator } from './baseAggregator.js';

export class SumAggregator extends BaseAggregator implements Aggregator {
  private _sum = 0;
  private _itemCount = 0;

  constructor(field: number | string) {
    super(field);
    this._type = 'sum' as const;
  }

  init(item?: any, isTreeAggregator = false): void {
    this._isTreeAggregator = isTreeAggregator;
    this._isInitialized = true;
    this._sum = 0;
    this._itemCount = 0;

    // when dealing with Tree Data structure, we also need to keep sum & itemCount refs
    if (isTreeAggregator) {
      if (!item.__treeTotals) {
        item.__treeTotals = {};
      }
      if (item.__treeTotals[this._type] === undefined) {
        item.__treeTotals[this._type] = {};
        item.__treeTotals.count = {};
      }
      item.__treeTotals['count'][this._field] = 0;
      item.__treeTotals[this._type][this._field] = 0;
    }
  }

  accumulate(item: any, isTreeParent = false): void {
    const val = item?.hasOwnProperty(this._field) ? item[this._field] : null;

    // when dealing with Tree Data structure, we need keep only the new sum (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular summation
      if (isNumber(val)) {
        this._sum += parseFloat(val as any);
      }
    } else {
      if (isTreeParent) {
        if (!item.__treeTotals) {
          item.__treeTotals = {};
        }
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        this._sum = parseFloat(item.__treeTotals[this._type][this._field] ?? 0);
        this._itemCount = item.__treeTotals['count'][this._field] ?? 0;
      } else if (isNumber(val)) {
        this._sum = parseFloat(val as any);
        this._itemCount = 1;
      }
    }
  }

  storeResult(groupTotals: GroupTotals): void {
    if (!groupTotals || groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);
    let sum = this._sum;
    let itemCount = this._itemCount;

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final sum
    if (this._isTreeAggregator) {
      sum += groupTotals[this._type][this._field] as number;
      itemCount += groupTotals['count'][this._field] as number;
      groupTotals['count'][this._field] = itemCount;
    }
    groupTotals[this._type][this._field] = sum;
  }

  protected addGroupTotalPropertiesWhenNotExist(groupTotals: any): void {
    if (groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    if (this._isTreeAggregator && groupTotals['count'] === undefined) {
      groupTotals['count'] = {};
    }
  }
}
