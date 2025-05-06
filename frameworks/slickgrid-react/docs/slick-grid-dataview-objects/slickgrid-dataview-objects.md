##### index
- [Grid, DataView objects through reactGridCreated](#grid--dataview-objects-through-reactGridcreated)
- [Grid, DataView objects & Services via `instances` bindable](#grid--dataview-objects--services-through-instances-bindable)

In some cases you might want a feature that is not yet available in `slickgrid-react` but exists in the original `SlickGrid`, what should you do? Fear not, we got you covered. `slickgrid-react` exposes the SlickGrid `Grid` and `DataView` objects through Event Aggregators, these objects are created when slickgrid-react initialize the grid (with `defineGrid()`). So if you subscribe to the Event Aggregator, you will get the SlickGrid and DataView objects and from there you can call any of the SlickGrid features.

**The preferred way is now to use the `SlickgridReactInstance` via the `instances` bindable as shown [here](#grid--dataview-objects--services-through-instances-bindable)**

### Grid & DataView objects through `reactGridCreated`
Since version `2.x`, we can now access the Slick `Grid` & `DataView` objects directly from the `SlickgridReactInstance` through the `onReactGridCreated` Event Dispatch, for example:

##### Component
```tsx
import { SlickgridReactInstance, Column, GridOption } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [isAutoEdit, setIsAutoEdit] = useState(false);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /** Change dynamically `autoEdit` grid options */
  function setAutoEdit(isAutoEdit) {
    setIsAutoEdit(isAutoEdit);
    reactGridRef.current?.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
    return true;
  }

  function collapseAllGroups() {
    reactGridRef.current?.collapseAllGroups();
  }

  function expandAllGroups() {
    reactGridRef.current?.expandAllGroups();
  }

  return !options ? '' : (
    <div id='demo-container' className='container-fluid'>
      <div className='col-sm-6'>
        <label className="me-1">autoEdit setting:</label>
        <span id='radioAutoEdit'>
          <label className='radio-inline control-label me-1' htmlFor='radioTrue'>
            <input
              type='radio'
              name='inlineRadioOptions'
              id='radioTrue'
              defaultChecked={isAutoEdit}
              onInput={() => setAutoEdit(true)}
            />{' '}
            ON (single-click)
          </label>
          <label className='radio-inline control-label' htmlFor='radioFalse'>
            <input
              type='radio'
              name='inlineRadioOptions'
              id='radioFalse'
              onInput={() => setAutoEdit(false)}
            />{' '}
            OFF (double-click)
          </label>
        </span>
      </div>

      <div className='col-sm-12'>
        <SlickgridReact
          gridId='grid3'
          columns={columns}
          options={options}
          dataset={dataset}
          onReactGridCreated={e => { reactGridReady(e.detail); }}
          onCellChange={e => { onCellChanged(e.detail.eventData, e.detail.args); }}
          onClick={e => { onCellClicked(e.detail.eventData, e.detail.args); }}
          onValidationError={e => { onCellValidationError(e.detail.eventData, e.detail.args); }}
        />
      </div>
    </div>
  );
}
```

### Grid & DataView objects & Services through `instances` bindable
You could also get all the Service instances via the new `instances` bindable property

##### Component
```tsx
import { SlickgridReactInstance, Column, GridOption } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const [isAutoEdit, setIsAutoEdit] = useState(false);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => defineGrid());

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /** Change dynamically `autoEdit` grid options */
  function setAutoEdit(isAutoEdit: boolean) {
    setIsAutoEdit(isAutoEdit);
    reactGridRef.current?.slickGrid.setOptions({ autoEdit: isAutoEdit }); // change the grid option dynamically
    return true;
  }

  render() {
    return (
      <SlickgridReact gridId="grid1"
        columns={columns}
        options={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)}
      />
    );
  }
}
```

### SlickGrid Events (original SlickGrid)
You have access to all original SlickGrid events which you can subscribe, for more info refer to the [Docs - Grid & DataView Events](../events/grid-dataview-events.md)

### Usage
There's already all the necessary information on how to use this on the [Docs - Grid & DataView Events](../events/grid-dataview-events.md) page, so I suggest you to head over to that Wiki page on how to use the `SlickGrid` and `DataView` objects
