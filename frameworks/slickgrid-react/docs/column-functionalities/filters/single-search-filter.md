#### Index
- [Update Filters Dynamically](input-filter.md#update-filters-dynamically)
- [Custom Filter Predicate](input-filter.md#custom-filter-predicate)

### Description
Some users might want to have 1 main single search for filtering the grid data instead of using multiple column filters. You can see a demo of that below

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react/#/slickgrid/Example21) / [Demo Component](https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example21.tsx#L162)

### Code Sample
##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [operatorList, setOperatorList] = useState<OperatorString[]>(['=', '<', '<=', '>', '>=', '<>']);
  const reactGridRef = useRef();
  const graphqlService = new GraphqlService();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
  }

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  selectedOperatorChanged() {
    updateFilter();
  }

  selectedColumnChanged() {
    updateFilter();
  }

  searchValueChanged() {
    updateFilter();
  }

  updateFilter() {
    const fieldName = selectedColumn.field;
    const filter = {};
    const filterArg: FilterCallbackArg = {
      columnDef: selectedColumn,
      operator: selectedOperator as OperatorString, // or fix one yourself like '='
      searchTerms: [searchValue || '']
    };

    if (searchValue) {
      // pass a columnFilter object as an object which it's property name must be a column field name (e.g.: 'duration': {...} )
      filter[fieldName] = filterArg;
    }

    reactGridRef.current?.dataView.setFilterArgs({
      columnFilters: filter,
      grid: reactGridRef.current?.slickGrid
    });
    reactGridRef.current?.dataView.refresh();
  }

  return !options ? null : (
    <div className="row row-cols-lg-auto g-1 align-items-center">
      <div className="col">
        <label htmlFor="columnSelect">Single Search:</label>
      </div>
      <div className="col">
        <select className="form-select" data-test="search-column-list" name="selectedColumn" onChange={($event) => selectedColumnChanged($event)}>
          <option value="''">...</option>
          {
            columnDefinitions.map((column) =>
              <option value={column.id} key={column.id}>{column.name}</option>
            )
          }
        </select>
      </div>
      <div className="col">
        <select className="form-select" data-test="search-operator-list" name="selectedOperator" onChange={($event) => selectedOperatorChanged($event)}>
          <option value="''">...</option>
          {
            operatorList.map((operator) =>
              <option value={operator} key={operator}>{operator}</option>
            )
          }
        </select>
      </div>

      <div className="col">
        <div className="input-group">
          <input type="text"
            className="form-control"
            placeholder="search value"
            data-test="search-value-input"
            value={searchValue}
            onInput={($event) => searchValueChanged($event)} />
          <button className="btn btn-outline-secondary d-flex align-items-center pl-2 pr-2" data-test="clear-search-value"
            onClick={() => clearGridSearchInput()}>
            <span className="mdi mdi-close m-1"></span>
          </button>
        </div>
      </div>

      <hr />

      <SlickgridReact gridId="grid21"
        columnDefinitions={columns}
        gridOptions={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)}
      />
    </div >
  );
}
```

## Sample
![2019-04-16_15-42-05](https://user-images.githubusercontent.com/643976/56239148-3b530680-605e-11e9-99a2-e9a163abdd0c.gif)
