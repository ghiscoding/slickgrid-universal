### Demo
[Demo](https://ghiscoding.github.io/slickgrid-universal/#/example03) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example03.ts)

### Description

For column visibility, you can define the `hidden` property in your column definitions to initially hide some columns. You could also toggle the `hidden` property at any point in time (see below for more code usage).

### initially hidden columns

Let's start by demoing how to initially hide some column(s) by using the `hidden` property.

##### define columns

```ts
this.columns = [
  { id: 'firstName', field: 'firstName', name: 'First Name' },
  { id: 'lastName', field: 'lastName', name: 'Last Name' },
  { id: 'age', field: 'age', name: 'Age', hidden: true }, // column initially hidden
];
```

### change visibility afterward

At any point in time, you could toggle the `hidden` property by using `grid.updateColumnById()` and make sure to also call `grid.updateColumns()` so that the UI is also updated.

##### define columns

###### View
```ts
export class MyExample {
  angularGrid: AngularGridInstance;
  columns: Column[];

  defineGrid() {
    this.columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ];
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  // toggle column visibility & then update columns to show changes in the grid
  toggleColumnVisibility(columnName: string) {
    this.angularGrid.slickGrid.updateColumnById(columnName, { hidden: true });
    this.angularGrid.slickGrid.updateColumns();
  }

  // get all columns (including `hidden` columns)
  getAllColumns() {
    this.angularGrid.slickGrid.getColumns();
  }

  // get only the visible columns
  getOnlyVisibleColumns() {
    this.angularGrid.slickGrid.getVisibleColumns();
  }
}
```

###### ViewModel
```html
<angular-slickgrid gridId="grid2"
          [columns]="columns"
          [options]="gridOptions"
          [dataset]="dataset"
          (onAngularGridCreated)="angularGridReady($event.detail">
</angular-slickgrid>
```