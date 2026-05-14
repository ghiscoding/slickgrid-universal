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

```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function defineGrid() {
    this.columns = [
      { id: 'firstName', field: 'firstName', name: 'First Name' },
      { id: 'lastName', field: 'lastName', name: 'Last Name' },
      { id: 'age', field: 'age', name: 'Age' },
    ];
  }

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  // toggle column visibility & then update columns to show changes in the grid
  function toggleColumnVisibility(columnName: string) {
    this.aureliaGrid.slickGrid.updateColumnById(columnName, { hidden: true });
    this.aureliaGrid.slickGrid.updateColumns();
  }

  // get all columns (including `hidden` columns)
  function getAllColumns() {
    this.aureliaGrid.slickGrid.getColumns();
  }

  // get only the visible columns
  function getOnlyVisibleColumns() {
    this.aureliaGrid.slickGrid.getVisibleColumns();
  }
 return !options ? '' : (
    <div>
        <SlickgridReact
          gridId='grid3'
          columns={columns}
          options={options}
          dataset={dataset}
          onReactGridCreated={e => { reactGridReady(e.detail); }}
        />
    </div>
  );
}
```
