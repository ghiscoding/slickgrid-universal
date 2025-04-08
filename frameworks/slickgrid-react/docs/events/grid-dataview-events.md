SlickGrid has a nice amount of events, see the full list of [Available Events](Available-Events.md), which you can use by simply hook a `subscribe` to them (the `subscribe` are a custom `SlickGrid Event`). There are 2 options to get access to all these events (For the first 2 you will have to get access to the `Grid` and the `DataView` objects which are exposed in `Slickgrid-React`):

**From the list below, the number 1. is by far the easiest and preferred way**

### Example event in the rendered template

##### Component
Hook yourself to the Changed event of the bindable grid object.

```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const graphqlService = new GraphqlService();

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    // populate the grid
  }

  function onCellClicked(e, args) {
    // do something
  }

  function onCellChanged(e, args) {
    setUpdatedObject(args.item);
    reactGridRef.current?.resizerService.resizeGrid(10);
  }

  function onMouseEntered(e, args) {
    // do something
  }

  return !options ? null : (
      <SlickgridReact
          gridId='grid3'
          columns={columns}
          options={options}
          dataset={dataset}
          onReactGridCreated={e => { reactGridReady(e.detail); }}
          onCellChange={e => { onCellChanged(e.detail.eventData, e.detail.args); }}
          onClick={e => { onCellClicked(e.detail.eventData, e.detail.args); }}
          onMouseEnter={e => onMouseEntered(e.detail.eventData, e.detail.args)}
          onValidationError={e => { onCellValidationError(e.detail.eventData, e.detail.args); }}
        />
    );
  }
}
```

#### How to use Grid/Dataview Events
Once the `Grid` and `DataView` are ready, see all [Available Events](../events/available-events.md). See below for the `gridChanged(grid)` and `dataviewChanged(dataview)` functions.
- The `GridExtraUtils` is to bring easy access to common functionality like getting a `column` from it's `row` and `cell` index.
- The example shown below is subscribing to `onClick` and ask the user to confirm a delete, then will delete it from the `DataView`.
- Technically, the `Grid` and `DataView` are created at the same time by `slickgrid-react`, so it's ok to call the `dataViewObj` within some code of the `gridObjChanged()` function since `DataView` object will already be available at that time.

**Note** The example below is demonstrated with `bind` with event `Changed` hook on the `grid` and `dataview` objects. However you can also use the `EventAggregator` as shown earlier. It's really up to you to choose the way you want to call these objects.

##### Component
```tsx
import { inject, bindable } from 'react-framework';
import { Editors, Formatters, GridExtraUtils } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const graphqlService = new GraphqlService();

  useEffect(() => {
    defineGrid();

    return () => {
      // don't forget to unsubscribe to the Slick Grid Events
      onCellChangeSubscriber.unsubscribe();
      onCellClickSubscriber.unsubscribe();
    };
  }, []);

  function defineGrid() {
    setColumns([
      { id: 'delete', field: 'id', formatter: Formatters.deleteIcon, maxWidth: 30 }
      // ...
    ]);

    setOptions({
      editable: true,
      enableCellNavigation: true,
      autoEdit: true
    });
  }

  function subscribeToSomeGridEvents(grid) {
    onCellChangeSubscriber = grid.onCellChange.subscribe((e, args) => {
      console.log('onCellChange', args);
      // for example, CRUD with WebAPI calls
    });

    onCellClickSubscriber = grid.onClick.subscribe((e, args) => {
      const column = GridExtraUtils.getColumnDefinitionAndData(args);

      if (column.columnDef.id === 'delete') {
        if (confirm('Are you sure?')) {
          reactGridRef.current?.deleteItem(column.dataContext.id);
          reactGridRef.current?.refresh();
        }
      }
    });
  }

  return !options ? null : (
    <SlickgridReact gridId="grid12"
      columns={columns}
      options={options}
      dataset={dataset}
      onReactGridCreated={$event => reactGridReady($event.detail)}
      onGridStateChanged={$event => gridStateChanged($event.detail)}
    />
  );
}
```
