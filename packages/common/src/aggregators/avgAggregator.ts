import { isNumber } from '@slickgrid-universal/utils';

import type { Aggregator } from './../interfaces/aggregator.interface.js';
import type { GroupTotals } from './../interfaces/grouping.interface.js';

export class AvgAggregator implements Aggregator {
  private _isInitialized = false;
  private _isTreeAggregator = false;
  private _nonNullCount = 0;
  private _sum = 0;
  private _field: number | string;
  private _type = 'avg';

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
    this._sum = 0;
    this._nonNullCount = 0;
    this._isInitialized = true;

    // when dealing with Tree Data structure, we also need to keep sum & itemCount refs
    // also while calculating Avg Aggregator, we could in theory skip completely SumAggregator because we kept the sum already for calculations
    this._isTreeAggregator = isTreeAggregator;
    if (isTreeAggregator) {
      if (!item.__treeTotals) {
        item.__treeTotals = {};
      }
      if (item.__treeTotals[this._type] === undefined) {
        item.__treeTotals[this._type] = {};
        item.__treeTotals.sum = {};
        item.__treeTotals.count = {};
      }
      item.__treeTotals[this._type][this._field] = 0;
      item.__treeTotals['count'][this._field] = 0;
      item.__treeTotals['sum'][this._field] = 0;
    }
  }

  accumulate(item: any, isTreeParent = false): void {
    const val = item?.hasOwnProperty(this._field) ? item[this._field] : null;

    // when dealing with Tree Data structure, we need keep only the new sum (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular summation
      if (isNumber(val)) {
        this._nonNullCount++;
        this._sum += parseFloat(val as any);
      }
    } else {
      if (isTreeParent) {
        if (!item.__treeTotals) {
          item.__treeTotals = {};
        }
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        this._sum = parseFloat(item.__treeTotals['sum'][this._field] ?? 0);
        this._nonNullCount = item.__treeTotals['count'][this._field] ?? 0;
      } else if (isNumber(val)) {
        this._sum = parseFloat(val as any);
        this._nonNullCount = 1;
      }
    }
  }

  storeResult(groupTotals: GroupTotals): void {
    let sum = this._sum;
    let itemCount = this._nonNullCount;
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final sum
    if (this._isTreeAggregator) {
      sum += groupTotals['sum'][this._field] as number;
      itemCount += groupTotals['count'][this._field] as number;

      groupTotals['sum'][this._field] = sum;
      groupTotals['count'][this._field] = itemCount;
    }

    if (itemCount !== 0) {
      groupTotals[this._type][this._field] = itemCount === 0 ? sum : sum / itemCount;
    }
  }

  protected addGroupTotalPropertiesWhenNotExist(groupTotals: any): void {
    if (groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
    if (this._isTreeAggregator && groupTotals['sum'] === undefined) {
      groupTotals['sum'] = {};
    }
    if (this._isTreeAggregator && groupTotals['count'] === undefined) {
      groupTotals['count'] = {};
    }
  }
}
