import type { Aggregator } from './../interfaces/aggregator.interface';

export class MinAggregator implements Aggregator {
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

  get result(): number | null {
    return this._min;
  }

  get type(): string {
    return this._type;
  }

  init(item?: any, isTreeAggregator = false) {
    this._min = null;

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

    // when dealing with Tree Data structure, we need keep only the new min (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular minmation
      if (this._min === null || val < this._min) {
        this._min = parseFloat(val);
      }
    } else {
      if (isParentTreeAccumlate) {
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        const parentMin = item.__treeTotals[this._type][this._field] !== null ? parseFloat(item.__treeTotals[this._type][this._field]) : null;
        if (this._min === null || parentMin === null || parentMin < this._min) {
          this._min = parentMin;
        }
      } else if (this.isNumber(val)) {
        if (this._min === null || val < this._min) {
          this._min = parseFloat(val);
        }
      }
    }
  }

  storeResult(groupTotals: any) {
    let min = this._min;
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final min
    if (this._isTreeAggregator && min !== null) {
      const parentMin = groupTotals[this._type][this._field];
      if (parentMin < min) {
        min = parentMin;
      }
    }
    groupTotals[this._type][this._field] = min;
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
