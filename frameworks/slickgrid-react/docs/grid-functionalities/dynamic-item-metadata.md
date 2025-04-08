SlickGrid is very flexible and it allows you to change or add CSS Class(es) dynamically (or on page load) by changing it's `Item Metadata` (see [SlickGrid Wiki - Item Metadata](providing-grid-data.md)). There is also a Stack Overflow [answer](https://stackoverflow.com/a/19985148/1212166), which this code below is based from.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react/#/slickgrid/Example11) / [Demo Component](https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example11.tsx)

### Dynamically Change CSS Classes
##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /**
   * Change the Duration Rows Background Color
   * You need to get previous SlickGrid DataView Item Metadata and override it
   */
  function changeDurationBackgroundColor() {
    reactGridRef.current?.dataView.getItemMetadata = updateItemMetadataForDurationOver50(reactGridRef.current?.dataView.getItemMetadata);

    // also re-render the grid for the styling to be applied right away
    reactGridRef.current?.slickGrid.invalidate();
    reactGridRef.current?.slickGrid.render();
  }

  /**
   * Override the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 50
   * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
   */
  function updateItemMetadataForDurationOver50(previousItemMetadata: any) {
    const newCssClass = 'duration-bg';

    return (rowNumber: number) => {
      const item = reactGridRef.current?.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      // our condition to check Duration over 50
      if (meta && item && item.duration) {
        const duration = +item.duration; // convert to number
        if (duration > 50) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        }
      }

      return meta;
    };
  }

  return !options ? null : (
    <button class="btn btn-default" onClick={() => changeDurationBackgroundColor()}>Highlight Rows with Duration over 50</button>
    <SlickgridReact gridId="grid1"
      columns={columns}
      options={options}
      dataset={dataset}
      onReactGridCreated={$event => reactGridReady($event.detail)}
    />
  );
}
```

### On Page Load
Or if you want to apply the styling right after the page load

##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;

    // if you want to change background color of Duration over 50 right after page load,
    // you would put the code here, also make sure to re-render the grid for the styling to be applied right away
    reactGrid.dataView.getItemMetadata = updateItemMetadataForDurationOver50(reactGrid.dataView.getItemMetadata);
    reactGrid.slickGrid.invalidate();
    reactGrid.slickGrid.render();
  }

  /**
   * Change the SlickGrid Item Metadata, we will add a CSS class on all rows with a Duration over 50
   * For more info, you can see this SO https://stackoverflow.com/a/19985148/1212166
   */
  function updateItemMetadataForDurationOver50(previousItemMetadata: any) {
    const newCssClass = 'duration-bg';

    return (rowNumber: number) => {
      const item = reactGridRef.current?.dataView.getItem(rowNumber);
      let meta = {
        cssClasses: ''
      };
      if (typeof previousItemMetadata === 'object') {
        meta = previousItemMetadata(rowNumber);
      }

      if (meta && item && item.duration) {
        const duration = +item.duration; // convert to number
        if (duration > 50) {
          meta.cssClasses = (meta.cssClasses || '') + ' ' + newCssClass;
        }
      }

      return meta;
    };
  }
}
```
