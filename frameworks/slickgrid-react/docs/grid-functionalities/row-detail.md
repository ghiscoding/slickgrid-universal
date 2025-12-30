#### index
- [Usage](#usage)
- [Changing Addon Options Dynamically](#changing-addon-options-dynamically)
- [Calling Addon Methods Dynamically](#calling-addon-methods-dynamically)
- [Row Detail - Preload Component - Loading Spinner](#row-detail---preload-component-loading-spinner)
- [Row Detail - View Component](#row-detail---view-component)
- [Access Parent Component (grid) from the Child Component (row detail)](#access-parent-component-grid-from-the-child-component-row-detail)
- Troubleshooting
  - [Adding a Column dynamically is removing the Row Selection column, why is that?](#adding-a-column-dynamically-is-removing-the-row-selection-column-why-is-that)

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react-demos/#/Example19) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example19.ts)

### Description
A Row Detail allows you to open a detail panel which can contain extra and/or more detailed information about a row. For example, we have a user list but we want to display detailed information about this user (his full address, account info, last purchasers, ...) but these are extra details that we don't want to display this in the user grid (for performance and real estate reasons)... so a Row Detail is perfect for that use case.

> **NOTE** Please note that because of the complexity behind Row Detail, the following features might not mix well and possibly cause UI problems with Row Detail (use at your risk):
> - Pagination
> - Tree Data
> - RowSpan

> **NOTE 2** Also please note that because SlickGrid is using its built-in Virtual Scroll feature by default (for perf reasons), this will call render and re-render multiple times and that happens whenever the Row Detail gets out of the grid viewport.
> For this reason, you should avoid using dynamic elements (i.e. form inputs) because whenever a re-render kicks in, it will reset and re-render these elements as if nothing happened.
> So you should consider using Row Detail mainly for showing static data (hence where its name comes from "Row Detail" to show more detailed info) and even though it works with dynamic elements, you have to know its limitation.

##### NOTE
There is currently a known problem with Row Detail when loading the Row Detail Components, it currently shows console warnings (see below), however these are just warnings and they don't show up in Production code. If anyone knows how to fix it please provide a Pull Request as a contribution (please note that the suggestion to use `root.render()` does NOT work as intended hence why we call `createRoot()` every time a row detail is rendered).

> You are calling ReactDOMClient.createRoot() on a container that has already been passed to createRoot() before. Instead, call root.render() on the existing root instead if you want to update it.

## Usage

> Starting from version 10, Row Detail is now an optional package and must be installed separately (`@slickgrid-universal/react-row-detail`)

##### Component
```tsx
import { ReactSlickRowDetailView } from '@slickgrid-universal/react-row-detail'; // for v10 and above
import { SlickRowDetailView } from 'slickgrid-react'; // for v9 and below

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [detailViewRowCount, setDetailViewRowCount] = useState(8);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    setColumns([ /*...*/ ]);
    setOptions({
      enableRowDetailView: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      preRegisterExternalExtensions: (pubSubService) => {
        // for v10 and above
        const rowDetail = new ReactSlickRowDetailView(pubSubService as EventPubSubService);

        // for v9 and below
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);

        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        // We can load the "process" asynchronously via Fetch, Promise, ...
        process: (item) => http.get(`api/item/${item.id}`),

        // load only once and reuse the same item detail without calling process method
        loadOnce: true,

        // limit expanded row to only 1 at a time
        singleRowExpand: false,

        // false by default, clicking anywhere on the row will open the detail view
        // when set to false, only the "+" icon would open the row detail
        // if you use editor or cell navigation you would want this flag set to false (default)
        useRowClick: true,

        // how many grid rows do we want to use for the row detail panel (this is only set once and will be used for all row detail)
        // also note that the detail view adds an extra 1 row for padding purposes
        // so if you choose 4 panelRows, the display will in fact use 5 rows
        panelRows: detailViewRowCount,

        // you can override the logic for showing (or not) the expand icon
        // for example, display the expand icon only on every 2nd row
        // expandableOverride: (row: number, dataContext: any, grid: any) => (dataContext.id % 2 === 1),

        // Preload View Template
        preloadComponent: Example19Preload,

        // ViewModel Template to load when row detail data is ready
        viewComponent: Example19DetailView,

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parentRef: this
      }
    });
  }

  return !options ? null : (
    <SlickgridReact gridId="grid40"
        columns={columns}
        options={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)} />
  );
}
```

### Changing Addon Options Dynamically
Row Detail is an addon (commonly known as a plugin and are opt-in addon), because this is not built-in SlickGrid and instead are opt-in, we need to get the instance of that addon object. Once we have the instance, we can use `getOptions` and `setOptions` to get/set any of the addon options, adding `rowDetail` with intellisense should give you this info.

#### Examples
- Dynamically change the Detail View Row Count (how many grid rows do we want to use for the row detail panel)
```ts
function changeDetailViewRowCount() {
  if (reactGridRef.current?.extensionService) {
    const rowDetailInstance = reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    const options = rowDetailInstance.getOptions();
    options.panelRows = detailViewRowCount; // change number of rows dynamically
    rowDetailInstance.setOptions(options);
  }
}
```

### Calling Addon Methods Dynamically
Same as previous paragraph, after we get the SlickGrid addon instance, we can call any of the addon methods, adding `rowDetail` with intellisense should give you this info.

#### Examples
- Dynamically close all Row Detail Panels
```ts
function closeAllRowDetail() {
  if (reactGridRef.current?.extensionService) {
    const rowDetailInstance = reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    rowDetailInstance.collapseAll();
  }
}
```
- Dynamically close a single Row Detail by it's grid index
This requires a bit more work, you can call the method `collapseDetailView(item)` but it requires to pass the row item object (data context) and it feasible but it's just more work as can be seen below.
```ts
closeRowDetail(gridRowIndex: number) {
  if (reactGridRef.current?.extensionService) {
    const rowDetailInstance = reactGridRef.current.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
    const item = reactGridRef.current.gridService.getDataItemByRowIndex(gridRowIndex);
    rowDetailInstance.collapseDetailView(item);
  }
}
```

### Row Detail - Preload Component (loading spinner)
Most of the time we would get data asynchronously, during that time we can show a loading spinner to the user via the `preloadComponent` grid option. We could use this simple Preload Component example as shown below

###### Preload Component
```tsx
import { forwardRef } from 'react';

export const Example19Preload = forwardRef((props: any, ref: any) => {
  return (
    <div ref={ref} className="container-fluid" style={{ marginTop: '10px' }}>
      <h4>
        <i className="mdi mdi-sync mdi-spin font-50px"></i>
        Loading...
      </h4>
    </div>
  );
});
```

### Row Detail - ViewModel
Same concept as the preload, we pass a React Component to the `viewComponent` that will be used to render our Row Detail.

###### Row Detail Component
```tsx
import React from 'react';
import type { SlickDataView, SlickGrid, SlickRowDetailView } from 'slickgrid-react';

import './example19-detail-view.scss';

interface Props {
  model: {
    duration: Date;
    percentComplete: number;
    // ...
  };
  addon: SlickRowDetailView;
  grid: SlickGrid;
  dataView: SlickDataView;
  parentRef: any;
}
interface State { assignee: string; }

const ExampleDetail: React.FC = (props: Props) => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [assignee, setAssignee] = useState(props.model?.assignee || '');
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  // ...
  //

  return !options ? null : (
    <div className="container-fluid" style={{ marginTop: '10px' }}>
      <h3>{props.model.title}</h3>
      <div className="row">
        <div className="col-3 detail-label"><label>Assignee:</label> <input className="form-control" value={assignee} onInput={($event) => assigneeChanged(($event.target as HTMLInputElement).value)} /></div>
        <div className="col-3 detail-label"><label>Reporter:</label> <span>{props.model.reporter}</span></div>
        <div className="col-3 detail-label"><label>Duration:</label> <span>{props.model.duration?.toISOString?.()}</span></div>
        <div className="col-3 detail-label"><label>% Complete:</label> <span>{props.model.percentComplete}</span></div>
      </div>

      <div className="row">
        <div className="col-3 detail-label"><label>Start:</label> <span>{props.model.start?.toISOString()}</span></div>
        <div className="col-3 detail-label"><label>Finish:</label> <span>{props.model.finish?.toISOString()}</span></div>
        <div className="col-3 detail-label"><label>Effort Driven:</label> <i className={props.model.effortDriven ? 'mdi mdi-check' : ''}></i>
        </div>
      </div>

      <hr />

      <div className="col-sm-8">
        <h4>
          Find out who is the Assignee
          <small>
            <button className="btn btn-primary btn-sm" onClick={() => alertAssignee(props.model.assignee)} data-test="assignee-btn">
              Click Me
            </button>
          </small>
        </h4>
      </div>

      <div className="col-sm-4">
        <button className="btn btn-primary btn-danger btn-sm" onClick={() => deleteRow(props.model)} data-test="delete-btn">
          Delete Row
        </button>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => callParentMethod(props.model)} data-test="parent-btn">
          Call Parent Method
        </button>
      </div>
    </div>
  );
}
```

###### Grid Definition
```tsx
import { ReactSlickRowDetailView } from '@slickgrid-universal/react-row-detail'; // for v10 and above
import { SlickRowDetailView } from 'slickgrid-react'; // for v9 and below

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  // ...

  function defineGrid() {
    setOptions({
      enableRowDetailView: true,
      preRegisterExternalExtensions: (pubSubService) => {
        // for v10 and above
        const rowDetail = new ReactSlickRowDetailView(pubSubService as EventPubSubService);

        // for v9 and below
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);

        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        // We can load the "process" asynchronously via Fetch, Promise, ...
        process: (item) => http.get(`api/item/${item.id}`),

        // ...

        // Preload Component
        preloadComponent: Example19Preload,

        // Row Detail Component to load when row detail data is ready
        viewComponent: Example19DetailView,

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parentRef: this
      }
    });
  }

  return !options ? null : (
    <SlickgridReact gridId="grid40"
        columns={columns}
        options={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)} />
  );
}
```

### Access Parent Component (grid) from the Child Component (row detail)
The Row Detail provides you access to the following references (SlickGrid, DataView, Parent Component and the Addon (3rd party plugin)), however please note that all of these references are available from the start **except** the Parent Component instance, for that one you need to reference it inside your Row Detail Grid Options like so:

```ts
import { ReactSlickRowDetailView } from '@slickgrid-universal/react-row-detail'; // for v10 and above
import { SlickRowDetailView } from 'slickgrid-react'; // for v9 and below

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [flashAlertType, setFlashAlertType] = useState<'warning' | 'success' | 'info'>('info');
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  // Parent Component (grid)
  function defineGrid() {
    setOptions({
      enableRowDetailView: true,
      preRegisterExternalExtensions: (pubSubService) => {
        // for v10 and above
        const rowDetail = new ReactSlickRowDetailView(pubSubService as EventPubSubService);

        // for v9 and below
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);

        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        // ...
        // ViewComponent Template to load when row detail data is ready
        viewComponent: CustomDetailView,

        // Optionally pass your Parent Component reference to your Child Component (row detail component)
        parentRef: this  // <-- THIS REFERENCE
      }
    });
  }

  // a Parent Method that we want to access
  function showFlashMessage(message: string, alertType = 'info') {
    setFlashAlertType(alertType);
  }
}
```

Then in our Child Component, we can do some action on the Grid, the DataView or even call a method form the Parent Component (the `showFlashMessage` in our demo), with that in mind, here is the code of the Child Component

##### View
```tsx
<div class="container-fluid">
  <h3>{props.model.title}</h3>

    <-- delete a row using the DataView & SlickGrid objects -->
    <button class="btn btn-primary btn-danger btn-sm" onClick={deleteRow(props.model)} data-test="delete-btn">
      Delete Row
    </button>

    <!-- calling a Parent Component method -->
    <button class="btn btn-default btn-sm" onClick={callParentMethod(props.model)} data-test="parent-btn">
      Call Parent Method
    </button>
</div>
```

##### Component
```tsx
import React from 'react';
import type { SlickDataView, SlickGrid, SlickRowDetailView } from 'slickgrid-react';

import './example19-detail-view.scss';

interface Props {
  model: {
    assignee: string;
  }
}

const Example: React.FC = (props: Props) => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [assignee, setAssignee] = useState(props.model?.assignee || '');
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function assigneeChanged(newAssignee: string) {
    setAssignee(newAssignee);
  }

  function alertAssignee(name: string) {
    if (typeof name === 'string') {
      alert(`Assignee on this task is: ${name.toUpperCase()}`);
    } else {
      alert('No one is assigned to this task.');
    }
  }

  function deleteRow(model: any) {
    if (confirm(`Are you sure that you want to delete ${model.title}?`)) {
      // you first need to collapse all rows (via the 3rd party addon instance)
      props.addon.collapseAll();

      // then you can delete the item from the dataView
      props.dataView.deleteItem(model.rowId);

      props.parentRef!.showFlashMessage(`Deleted row with ${model.title}`, 'danger');
    }
  }

  function callParentMethod(model: any) {
    props.parentRef!.showFlashMessage(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }

  render() {
    // ...
  }
}
```

## Troubleshooting
### Adding a Column dynamically is removing the Row Selection column, why is that?
The reason is because the Row Selection (checkbox) plugin is a special column and Slickgrid-React is adding an extra column dynamically for the Row Selection checkbox and that is **not** reflected in your local copy of `columnDefinitions`. To address this issue, you need to get the Slickgrid-React internal copy of all columns (including the extra columns), you can get it via `getAllColumnDefinitions()` from the Grid Service and then you can use to that array and that will work.

```ts
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function addNewColumn() {
    const newColumn = { /*...*/ };

    const allColumns = reactGridRef.current?.gridService.getAllColumnDefinitions();
    allColumns.push(newColumn);

    setColumns(allColumns.slice()); // or use spread operator [...cols]
  }
}
```

## Row Detail with Inner Grid

You can also add an inner grid inside a Row Detail, however there are a few things to know off and remember. Any time a Row Detail is falling outside the main grid viewport, it will be unmounted and until it comes back into the viewport which is then remounted. The process of unmounting and remounting means that Row Detail previous states aren't preserved, however you could use Grid State & Presets to overcome this problem.

##### Component

Main Grid Component

```tsx
import { ReactSlickRowDetailView } from '@slickgrid-universal/react-row-detail'; // for v10 and above
import { SlickRowDetailView } from 'slickgrid-react'; // for v9 and below
import React from 'react';
import { type Column, ExtensionName, type GridOption, SlickgridReact, type SlickgridReactInstance, SlickRowDetailView, } from 'slickgrid-react';

import { Preload } from './preload';
import { type Distributor, InnerGridComponent, type OrderData } from './inner-grid';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function getRowDetailInstance() {
    return reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView);
  }

  function defineGrid() {
    setColumns([ /*...*/]);
    setOptions({
      enableRowDetailView: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      preRegisterExternalExtensions: (pubSubService) => {
        // for v10 and above
        const rowDetail = new ReactSlickRowDetailView(pubSubService as EventPubSubService);

        // for v9 and below
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);

        // Row Detail View is a special case because of its requirement to create extra column definition dynamically
        // so it must be pre-registered before SlickGrid is instantiated, we can do so via this option
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        process: (item: any) => simulateServerAsyncCall(item),
        loadOnce: false, // IMPORTANT, you can't use loadOnce with inner grid because only HTML template are re-rendered, not JS events
        panelRows: 10,
        preloadComponent: PreloadComponent,
        viewComponent:  InnerGridComponent,
      },
    });
  }

  return !options ? '' : (
    <div id="demo-container" className="container-fluid">
      <SlickgridReact gridId="grid45"
        columns={columns}
        options={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)}
      />
    </div >
  );
}
```

Now, let's define our Inner Grid Component

```tsx
import { ReactSlickRowDetailView } from '@slickgrid-universal/react-row-detail'; // for v10 and above
import { SlickRowDetailView } from 'slickgrid-react'; // for v9 and below
import React from 'react';
import { type Column, type GridOption, type GridState, type RowDetailViewProps, SlickgridReact, type SlickgridReactInstance } from 'slickgrid-react';

import type MainGrid from './MainGrid';

export interface Distributor { /* ... */ }
export interface OrderData { /* ... */ }

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [innerGridClass, setInnerGridClass] = useState('innergrid');
  const [options, setOptions] = useState<GridOption>();
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    setColumns([
      { id: 'orderId', field: 'orderId', name: 'Order ID', filterable: true, sortable: true },
      { id: 'shipCity', field: 'shipCity', name: 'Ship City', filterable: true, sortable: true },
      { id: 'freight', field: 'freight', name: 'Freight', filterable: true, sortable: true, type: 'number' },
      { id: 'shipName', field: 'shipName', name: 'Ship Name', filterable: true, sortable: true },
    ]);

    // OPTIONALLY reapply Grid State as Presets before unmounting the compoment
    const gridStateStr = sessionStorage.getItem(`gridstate_${innerGridClass.value}`);
    let gridState: GridState | undefined;
    if (gridStateStr) {
      gridState = JSON.parse(gridStateStr);
    }

    setOptions({
      autoResize: {
        container: `.${innerGridClass}`,
      },
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      datasetIdPropertyName: 'orderId', // reapply grid state presets
      presets: gridState,
    });
  }

  // OPTIONALLY save Grid State before unmounting the compoment
  function handleBeforeGridDestroy() {
    if (props.model.isUsingInnerGridStatePresets) {
      const gridState = reactGridRef.current?.gridStateService.getCurrentGridState();
      sessionStorage.setItem(`gridstate_${innerGridClass}`, JSON.stringify(gridState));
    }
  }

  return !options ? null : (
    <div className={`${innerGridClass}`}>
      <h4>Order Details (id: {props.model.id})</h4>
      <div className="container-fluid">
        {!showGrid ? '' : <SlickgridReact gridId={`innergrid-${props.model.id}`}
          columns={innerColDefs}
          options={innerGridOptions}
          dataset={innerDataset}
          onReactGridCreated={$event => reactGridReady($event.detail)}
          onBeforeGridDestroy={() => handleBeforeGridDestroy()}
        />}
      </div>
    </div>
  );
}
```
