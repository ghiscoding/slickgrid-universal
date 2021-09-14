import type { Aggregator } from './../interfaces/aggregator.interface';

export class MaxAggregator implements Aggregator {
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

  get result(): number | null {
    return this._max;
  }

  get type(): string {
    return this._type;
  }

  init(item?: any, isTreeAggregator = false) {
    this._max = null;

    // when dealing with Tree Data structure, we also need to clear any parent totals
    this._isTreeAggregator = isTreeAggregator;
    if (isTreeAggregator) {
      if (!item.__treeTotals || item.__treeTotals[this._type] === undefined) {
        item.__treeTotals = { [this._type]: {} };
      }
    }
  }

  accumulate(item: any, isParentTreeAccumlate = false) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;

    // when dealing with Tree Data structure, we need keep only the new max (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular maxmation
      if (this._max === null || val > this._max) {
        this._max = parseFloat(val);
      }
    } else {
      if (isParentTreeAccumlate) {
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        const parentMax = item.__treeTotals[this._type][this._field] !== null ? parseFloat(item.__treeTotals[this._type][this._field]) : null;
        if (this._max === null || parentMax === null || parentMax > this._max) {
          this._max = parentMax;
        }
      } else if (this.isNumber(val)) {
        if (this._max === null || val > this._max) {
          this._max = parseFloat(val);
        }
      }
    }
  }

  storeResult(groupTotals: any) {
    let max = this._max;
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final max
    if (this._isTreeAggregator && max !== null) {
      const parentMax = groupTotals[this._type][this._field];
      if (parentMax > max) {
        max = parentMax;
      }
    }
    groupTotals[this._type][this._field] = max;
  }

  protected addGroupTotalPropertiesWhenNotExist(groupTotals: any) {
    if (!groupTotals) {
      groupTotals = {};
    }
    if (groupTotals[this._type] === undefined) {
      groupTotals[this._type] = {};
    }
  }

  protected isNumber(value: any) {
    return (value === null || value === undefined || value === '') ? false : !isNaN(+value);
  }
}
