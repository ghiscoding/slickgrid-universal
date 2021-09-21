import type { Aggregator } from './../interfaces/aggregator.interface';

export class AvgAggregator implements Aggregator {
  private _isTreeAggregator = false;
  private _nonNullCount = 0;
  private _result = 0;
  private _sum = 0;
  private _field: number | string;
  private _type = 'avg';

  constructor(field: number | string) {
    this._field = field;
  }

  get field(): number | string {
    return this._field;
  }

  get result(): number {
    return this._result;
  }

  get type(): string {
    return this._type;
  }

  init(item?: any, isTreeAggregator = false) {
    this._sum = 0;
    this._nonNullCount = 0;

    // when dealing with Tree Data structure, we also need to clear any parent totals
    this._isTreeAggregator = isTreeAggregator;
    if (isTreeAggregator) {
      if (!item.__treeTotals || item.__treeTotals[this._type] === undefined) {
        item.__treeTotals = { [this._type]: {}, __avgSum: {}, __itemCount: {} };
      }
      item.__treeTotals[this._type][this._field] = 0;
      item.__treeTotals['__avgSum'][this._field] = 0;
      item.__treeTotals['__itemCount'][this._field] = 0;
    }
  }

  accumulate(item: any, isParentTreeAccumlate = false, childCount = 0) {
    const val = (item && item.hasOwnProperty(this._field)) ? item[this._field] : null;

    // when dealing with Tree Data structure, we need keep only the new sum (without doing any addition)
    if (!this._isTreeAggregator) {
      // not a Tree structure, we'll do a regular summation
      this._nonNullCount++;
      this._sum += parseFloat(val);
    } else {
      this._nonNullCount = childCount;
      if (isParentTreeAccumlate) {
        this.addGroupTotalPropertiesWhenNotExist(item.__treeTotals);
        // item.__treeTotals['__itemCount'][this._field] = this._nonNullCount;
        this._sum = parseFloat(item.__treeTotals['__avgSum'][this._field] ?? 0);
      } else if (this.isNumber(val)) {
        this._sum = parseFloat(val);
      }
    }
  }

  storeResult(groupTotals: any) {
    let sum = this._sum;
    this.addGroupTotalPropertiesWhenNotExist(groupTotals);

    // when dealing with Tree Data, we also need to take the parent's total and add it to the final sum
    if (this._isTreeAggregator) {
      sum += groupTotals['__avgSum'][this._field];
      groupTotals['__avgSum'][this._field] = sum;
    }
    // console.log(sum, this._nonNullCount, sum / this._nonNullCount);
    this._result = sum / this._nonNullCount;
    groupTotals[this._type][this._field] = this._result;
    if (this._isTreeAggregator) {
      groupTotals['__itemCount'][this._field] = this._nonNullCount;
    }
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
