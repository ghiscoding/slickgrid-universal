import { isNumber } from '@slickgrid-universal/utils';

import type { Aggregator, GroupTotals } from './../interfaces';

export class MinAggregator implements Aggregator {
  private _isInitialized = false;
  private _isTreeAggregator = false;
  private _min: number | null = null;
  private _field: number | string;
  private _type = 'min';

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
    this._min = null;
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

    // when dealing with Tree Data structure, we need keep only the new min (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular minimation
      this.keepMinValueWhenFound(val);
    } else {
      if (isTreeParent) {
        if (!item.__treeTotals) {
          item.__treeTotals = {};
        }
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        const parentMin = item.__treeTotals[this._type][this._field] !== null ? parseFloat(item.__treeTotals[this._type][this._field]) : null;
        if (parentMin !== null && isNumber(parentMin) && (this._min === null || parentMin < this._min)) {
          this._min = parentMin;
        }
      } else if (isNumber(val)) {
        this.keepMinValueWhenFound(val);
      }
    }
  }

  storeResult(groupTotals: GroupTotals): void {
    let min = this._min;
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final min
    if (this._isTreeAggregator && min !== null) {
      const parentMin = groupTotals[this._type][this._field] as number;
      if (isNumber(parentMin) && parentMin < min) {
        min = parentMin;
      }
    }
    groupTotals[this._type][this._field] = min;
  }

  protected addGroupTotalPropertiesWhenNotExist(groupTotals: any): void {
    if (groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
  }

  protected keepMinValueWhenFound(val: any): void {
    if (isNumber(val)) {
      if (this._min === null || val < this._min) {
        this._min = parseFloat(val as any);
      }
    }
  }
}