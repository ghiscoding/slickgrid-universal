import type { SlickDataView, SlickGrid } from '../core/index.js';

export class DataWrapperService {
  protected _dataView?: SlickDataView;
  protected _grid!: SlickGrid;

  init(grid: SlickGrid): void {
    this._grid = grid;
    if (grid.hasDataView()) {
      this._dataView = grid.getData<SlickDataView>();
    }
  }

  getDataItem(row: number): any {
    return this._dataView ? this._dataView.getItem(row) : this._grid.getDataItem(row);
  }

  getDataItems(): any[] {
    return this._dataView ? this._dataView.getItems() : this._grid.getData<any[]>();
  }

  getDataLength(): number {
    return this._dataView ? this._dataView.getItemCount() : this._grid.getDataLength();
  }

  setDataItems(items: any[]): void {
    this._dataView ? this._dataView.setItems(items) : this._grid.setData(items);
  }
}
