import { isNumber } from '@slickgrid-universal/utils';

import type { Aggregator } from './../interfaces/aggregator.interface.js';
import type { GroupTotals } from './../interfaces/grouping.interface.js';

export class MaxAggregator implements Aggregator {
  private _isInitialized = false;
  private _isTreeAggregator = false;
  private _max: number | null = null;
  private _field: number | string;
  private _type = 'max';

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
    this._max = null;
    this._isInitialized = true;

    // when dealing with Tree Data structure, we also need to clear any parent totals
    this._isTreeAggregator = isTreeAggregator;
    if (isTreeAggregator) {
      if (!item.__treeTotals) {
        item.__treeTotals = {};
      }
      if (item.__treeTotals[this._type] === undefined) {
        item.__treeTotals[this._type] = {};
      }
      item.__treeTotals[this._type][this._field] = null;
    }
  }

  accumulate(item: any, isTreeParent = false): void {
    const val = item?.hasOwnProperty(this._field) ? item[this._field] : null;

    // when dealing with Tree Data structure, we need keep only the new max (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular maximation
      this.keepMaxValueWhenFound(val);
    } else {
      if (isTreeParent) {
        if (!item.__treeTotals) {
          item.__treeTotals = {};
        }
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        const parentMax =
          item.__treeTotals[this._type][this._field] !== null ? parseFloat(item.__treeTotals[this._type][this._field]) : null;
        if (parentMax !== null && isNumber(parentMax) && (this._max === null || parentMax > this._max)) {
          this._max = parentMax;
        }
      } else if (isNumber(val)) {
        this.keepMaxValueWhenFound(val);
      }
    }
  }

  storeResult(groupTotals: GroupTotals): void {
    let max = this._max;
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final max
    if (this._isTreeAggregator && max !== null) {
      const parentMax = groupTotals[this._type][this._field] as number;
      if (isNumber(parentMax) && parentMax > max) {
        max = parentMax;
      }
    }
    groupTotals[this._type][this._field] = max;
  }

  protected addGroupTotalPropertiesWhenNotExist(groupTotals: GroupTotals): void {
    if (groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
  }

  protected keepMaxValueWhenFound(val: any): void {
    if (isNumber(val)) {
      if (this._max === null || val > this._max) {
        this._max = parseFloat(val as any);
      }
    }
  }
}
