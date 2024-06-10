import { type SlickDataView, SlickEventHandler, type SlickGrid, SlickEventData } from '../core/index';
import type { Column, OnEventArgs } from './../interfaces/index';

export class GridEventService {
  protected _eventHandler: SlickEventHandler;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  constructor() {
    this._eventHandler = new SlickEventHandler();
  }

  dispose(): void {
    this._eventHandler.unsubscribeAll();
  }

  /* OnBeforeEditCell Event */
  bindOnBeforeEditCell(grid: SlickGrid): void {
    const dataView = grid?.getData<SlickDataView>();

    // subscribe to this Slickgrid event of onBeforeEditCell
    this._eventHandler.subscribe(grid.onBeforeEditCell, (e, args) => {
      if (!e || !args || !grid || args.cell === undefined || !grid.getColumns || !grid.getDataItem) {
        return;
      }
      const column: Column = grid.getColumns()[args.cell];

      // if the column definition has a onBeforeEditCell property (a callback function), then run it
      if (typeof column.onBeforeEditCell === 'function') {
        // add to the output gridOptions & dataView since we'll need them inside the AJAX column.onBeforeEditCell
        const returnedArgs: OnEventArgs = {
          row: args.row!,
          cell: args.cell,
          dataView,
          grid,
          columnDef: column,
          dataContext: grid.getDataItem(args.row!)
        };

        // finally call up the Slick column.onBeforeEditCells.... function
        column.onBeforeEditCell(e instanceof SlickEventData ? e.getNativeEvent() : e, returnedArgs);
      }
    });
  }

  /* OnCellChange Event */
  bindOnCellChange(grid: SlickGrid): void {
    const dataView = grid?.getData<SlickDataView>();

    // subscribe to this Slickgrid event of onCellChange
    this._eventHandler.subscribe(grid.onCellChange, (e, args) => {
      if (!e || !args || !grid || args.cell === undefined || !grid.getColumns || !grid.getDataItem) {
        return;
      }
      const column: Column = grid.getColumns()[args.cell];

      // if the column definition has a onCellChange property (a callback function), then run it
      if (typeof column.onCellChange === 'function') {
        // add to the output gridOptions & dataView since we'll need them inside the AJAX column.onCellChange
        const returnedArgs: OnEventArgs = {
          row: args.row,
          cell: args.cell,
          dataView,
          grid,
          columnDef: column,
          dataContext: grid.getDataItem(args.row)
        };

        // finally call up the Slick column.onCellChanges.... function
        column.onCellChange(e instanceof SlickEventData ? e.getNativeEvent() : e, returnedArgs);
      }
    });
  }

  /* OnClick Event */
  bindOnClick(grid: SlickGrid): void {
    const dataView = grid?.getData<SlickDataView>();

    this._eventHandler.subscribe(grid.onClick, (e, args) => {
      if (!e || !args || !grid || args.cell === undefined || !grid.getColumns || !grid.getDataItem) {
        return;
      }
      const column: Column = grid.getColumns()[args.cell];

      // if the column definition has a onCellClick property (a callback function), then run it
      if (typeof column.onCellClick === 'function') {
        // add to the output gridOptions & dataView since we'll need them inside the AJAX column.onClick
        const returnedArgs: OnEventArgs = {
          row: args.row,
          cell: args.cell,
          dataView,
          grid,
          columnDef: column,
          dataContext: grid.getDataItem(args.row)
        };

        // finally call up the Slick column.onCellClick.... function
        column.onCellClick(e instanceof SlickEventData ? e.getNativeEvent() : e, returnedArgs);
      }
    });
  }
}
