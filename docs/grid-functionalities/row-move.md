### Description
Row Move feature allow you to drag a row and move it to another position in the grid.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example07) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example07.ts)

## Basic Usage
By default the lib will fallback to its default logic implementation to move the item and readjust the dataset with the updated row positions. If the default logic doesn't work for you, you can provide your own logic for `onBeforeMoveRows` and/or `onMoveRows`.

#### ViewModel
```ts
export class Example1 {
  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);

    gridContainerElm.addEventListener('onselectedrows', this.handleOnClick.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  initializeGrid() {
    // define columns
    ...

    // grid options
    this.gridOptions = {
      enableAutoResize: true,
      // ...
      enableRowMoveManager: true,
      rowMoveManager: {
        // ... list of different Row Move options        
      },
    }
  }
}
```

## List of all Row Move options

#### ViewModel
```ts
export class Example1 {
  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(500);
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid3`);

    gridContainerElm.addEventListener('onselectedrows', this.handleOnClick.bind(this));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  initializeGrid() {
    // define columns
    ...

    // grid options
    this.gridOptions = {
      enableAutoResize: true,
      // ...
      enableRowMoveManager: true,
      rowMoveManager: {
        // list of different Row Move options
        columnIndexPosition: 0,     // provide a different column position if default doesn't work for you
        // when using Row Move + Row Selection, you want to move only a single row and we will enable the following flags so it doesn't cancel row selection
        singleRowMove: true,        // allow multi-row dragging?
        disableRowSelection: true,  // should we disable row selection?
        cancelEditOnDrag: true,
        hideRowMoveShadow: false,
        // you can provide your own `onBeforeMoveRows` and/or `onMoveRows` implementation
        // or use the default implementation, however the default won't work with Tree Data
        // onBeforeMoveRows: () => {},
        // onMoveRows: () => {},
        onAfterMoveRows: (_e, args) => {
          // update dataset for the ms-select list to be updated
          this.dataset = args.updatedItems;
        },

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
    }
  }
}
```

## Provide your own callback (`onBeforeMoveRows` and `onMoveRows`)
Typical code logic when providing your own custom logic, the code below is literraly the default callback logic (it is only shown as demo and logic that can be used to get started).

#### ViewModel
```ts
export class Example1 {
  attached() {
    this.initializeGrid();
  }

  initializeGrid() {
    // define columns
    ...

    // grid options
    this.gridOptions = {
      enableAutoResize: true,
      // ...
      enableRowMoveManager: true,
      rowMoveManager: {
        onBeforeMoveRows: this.onBeforeMoveRow.bind(this),
        onMoveRows: this.onMoveRows.bind(this)
        onAfterMoveRows: (_e, args) => {
          // update dataset for the ms-select list to be updated
          this.dataset = args.updatedItems;
        },
      },
    }
  }
  
  onBeforeMoveRow(e: MouseEvent | TouchEvent, data: { rows: number[]; insertBefore: number }) {
    for (const rowIdx of data.rows) {
      // no point in moving before or after itself
      if (
        rowIdx === data.insertBefore ||
        (rowIdx === data.insertBefore - 1 && data.insertBefore - 1 !== this.aureliaGrid.dataView.getItemCount())
      ) {
        e.preventDefault(); // OR eventData.preventDefault();
        return false;
      }
    }
    return true;
  }

  onMoveRows(_e: MouseEvent | TouchEvent, args: any) {
    // rows and insertBefore references,
    // note that these references are assuming that the dataset isn't filtered at all
    // which is not always the case so we will recalcualte them and we won't use these reference afterward
    const rows = args.rows as number[];
    const insertBefore = args.insertBefore;
    const extractedRows: number[] = [];

    // when moving rows, we need to cancel any sorting that might happen
    // we can do this by providing an undefined sort comparer
    // which basically destroys the current sort comparer without resorting the dataset, it basically keeps the previous sorting
    this.aureliaGrid.dataView.sort(undefined as any, true);

    // the dataset might be filtered/sorted,
    // so we need to get the same dataset as the one that the SlickGrid DataView uses
    const tmpDataset = this.aureliaGrid.dataView.getItems();
    const filteredItems = this.aureliaGrid.dataView.getFilteredItems();

    const itemOnRight = this.aureliaGrid.dataView.getItem(insertBefore);
    const insertBeforeFilteredIdx = itemOnRight
      ? this.aureliaGrid.dataView.getIdxById(itemOnRight.id)
      : this.aureliaGrid.dataView.getItemCount();

    const filteredRowItems: any[] = [];
    rows.forEach((row) => filteredRowItems.push(filteredItems[row]));
    const filteredRows = filteredRowItems.map((item) => this.aureliaGrid.dataView.getIdxById(item.id));

    const left = tmpDataset.slice(0, insertBeforeFilteredIdx);
    const right = tmpDataset.slice(insertBeforeFilteredIdx, tmpDataset.length);

    // convert into a final new dataset that has the new order
    // we need to resort with
    rows.sort((a: number, b: number) => a - b);
    for (const filteredRow of filteredRows) {
      if (filteredRow) {
        extractedRows.push(tmpDataset[filteredRow]);
      }
    }
    filteredRows.reverse();
    for (const row of filteredRows) {
      if (row !== undefined && insertBeforeFilteredIdx !== undefined) {
        if (row < insertBeforeFilteredIdx) {
          left.splice(row, 1);
        } else {
          right.splice(row - insertBeforeFilteredIdx, 1);
        }
      }
    }

    // final updated dataset, we need to overwrite the DataView dataset (and our local one) with this new dataset that has a new order
    const finalDataset = left.concat(extractedRows.concat(right));
    this.dataset = finalDataset; // update dataset and re-render the grid
  }
}
```
