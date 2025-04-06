##### index
- [Global Options](#global-autoresize-options)
- [Delay a Grid Resize](#delay-a-grid-resize)
- [Last Resize Dimension](#last-resize-dimensions)
- [Pause Resizer](#pause-the-resizer-when-auto-resize-is-enabled)
- [Add Grid Min/Max Height/Width](#add-grid-minmax-heightwidth)
- [Add some Padding to the Calculation](#add-some-padding-to-the-calculation)
- [Calculate Size by Container or Window Element](#calculate-size-by-container-or-window-element)
- [Detect Resize by Container (Resize Observer) or Window](#detect-resize-by-container-or-window)
- [Resize Grid with Fixed Dimensions](#resize-the-grid-with-fixed-dimensions)
- [Troubleshooting](#troubleshooting)

### Description
Almost all grids from the demos are using the auto-resize feature, and the feature does what its name suggest, it resizes the grid to fill entirely within the container it is contained. It also automatically resizes when the user changes its browser size.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react/#/slickgrid/Example2) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example2.tsx)

### Usage
All you need to do is enable the Grid Option `enableAutoResize: true` and provide necessary information in the `autoResize`, at minimum you should provide your container an id or class name.

```ts
const columnDefinitions = [
  // ...
];

const gridOptions = {
  autoResize: {
    container: '#demo-container' // container DOM selector
  },
  enableAutoResize: true
};
```

#### AutoResize Options
There are multiple options you can pass to the `autoResize` in the Grid Options, you can see them all in the [autoResizeOption.interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/resizerOption.interface.ts)

### Delay a Grid Resize
Note that you can also delay the resize via the 1st argument to the `resizeGrid()` call.
```ts
  function openSidebar() {
    setIsSidebarOpen(true);
    const delay = 100; // delay in milliseconds
    reactGridRef.current?.resizerService.resizeGrid(delay);
  }
```

### Last Resize Dimensions
The `resizeGrid()` returns a promise with the last used resize dimensions, that might be helpful to resize and fix another grid or DOM element height/width. For example, we use that in our project to resize a sidebar element to become the same height as the main grid.
```ts
async function openSidebar() {
  setIsSidebarOpen(true);

  // resize the CPA list grid and resize the sidebar to the same height as the grid with it's pagination
  const lastDimensions = await reactGridRef.current?.resizerService.resizeGrid();
  if (lastDimensions && lastDimensions.heightWithPagination) {
    setSidebarMaxHeight(`${lastDimensions.heightWithPagination}px`);
  }
}
```
### Pause the resizer (when auto-resize is enabled)
User can pause the resizer at any time and later resume the auto-resize. This might be useful in some use case, for example if you don't want the grid to resize after a certain event, you can pause the resizer before the action.

##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [resizerPaused, setResizerPaused] = useState(false);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {}

  function togglePauseResizer() {
    const newResizerPaused() = !resizerPaused;
    setResizerPaused(newResizerPaused);
    reactGridRef.current?.resizerService.pauseResizer(resizerPaused);
  }

  render() {
    return (
      <button className="btn btn-outline-secondary btn-sm btn-icon"
        onClick={() => togglePauseResizer()}>
        Pause auto-resize: <b>{resizerPaused}</b>
      </button>

      <SlickgridReact gridId="grid1"
        columnDefinitions={columns}
        gridOptions={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)}
        onGridStateChanged={$event => gridStateChanged($event.detail)}
      />
    );
  }
}
```

### Add Grid Min/Max Height/Width
You can set some values for minimum, maximum grid height and width that will be analyzed while executing the calculate available space for the grid.

```ts
const gridOptions = {
  enableAutoResize: true,
  autoResize: {
    maxHeight: 600,
    minHeight: 250,
    maxWidth: 800,
    minWidth: 200;
  }
}
```

### Add some Padding to the Calculation
Sometime the resizer is very close to the perfect size but you can just want to remove a bit more pixels for the total calculation, you can do that by simply adding paddings as shown below

```ts
const gridOptions = {
  enableAutoResize: true,
  autoResize: {
    rightPadding: 20,  // note that there's no left option since we don't control the grid position
    bottomPadding: 25, // a good example of this usage is when the user adds Pagination, it adds a bottomPadding of about 30px
  }
}
```

### Calculate Size by Container or Window Element
The default way of calculating the available size is by the window element but in some rare case you might need to calculate by the container element.
So if you do want to calculate the size by the container, then you can write it as shown below (for more info, see Slickgrid-React issue [#175](https://github.com/ghiscoding/slickgrid-react/issues/175))

```tsx
const gridOptions = {
  enableAutoResize: true,
  autoResize: {
    calculateAvailableSizeBy: 'container'  // the 2 options would be 'container' | 'window'
  }
}
```

### Detect resize by Container or Window
The default way the grid detects a resize is by window. In other words, when the window resizes the grid calculates the width and height the grid should be and resizes to that.

It's also possible to let the grid detect a resize by the grid container element. In other words, when the grid container element resizes the grid calculates the width and height it should be and resizes to that. Technically a `ResizeObserver` is used which may not be [available](https://caniuse.com/resizeobserver) in all browsers you target, if that is the case you could install a polyfill like [resize-observer-polyfill](https://www.npmjs.com/package/resize-observer-polyfill). When detecting container resizes it could make sense to also calculate available size by container.

```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setOptions({
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        resizeDetection: 'container',  // the 2 options would be 'container' | 'window'
        calculateAvailableSizeBy: 'container'
      }
    });
  }

  // for example you could add a resize handle to the grid container (shown on the bottom right corner):
  return !options ? null : (
    <div id="demo-container" style="resize:both; overflow:auto;">
      <SlickgridReact gridId="grid1"
        columnDefinitions={columns}
        gridOptions={options}
        dataset={dataset}
        onReactGridCreated={$event => reactGridReady($event.detail)}
        onGridStateChanged={$event => gridStateChanged($event.detail)}
      />
    </div>
  );
}
```

### Resize the Grid with fixed Dimensions
You can call `resizeGrid()` method at any point in time by passing dimensions as the 2nd argument of that method, that would in terms bypass the auto-resize (if enabled that is).

##### Component
```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {}

  function togglePauseResizer() {
    const delay = 0;
    reactGridRef.current?.resizerService.gridResize(delay, { height: 800: width: 600 });
  }
}
```

## Troubleshooting
### Why is my grid not resizing?
1. Have you put your grid in a `<div>` container referenced in your `autoResize` grid options?
2. I have the container defined but it still doesn't resize, why?
#### Possible reason
This feature uses `window.resize` event and if you change the size of your DIV programmatically, it will **not** change the size of your grid, mainly because that action did not trigger a `window.resize` event. However to circumvent this issue, you can call the auto-resize of the grid manually with the `ResizerService`. For example, we change the DIV CSS classes to use a different Bootstrap container size, that won't trigger an event and we have to manually call the resize, below is the code to do that.

```tsx
const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);

  useEffect(() => defineGrid(), []);

  function defineGrid() {}

  function closeSidebar() {
    setIsSidebarOpen(false);
    reactGridRef.current?.resizerService.resizeGrid();
  }

  openSidebar() {
    setIsSidebarOpen(true);
    reactGridRef.current?.resizerService.resizeGrid();
  }
}
```

#### Possible reason 2
The resizer is **not perfect** and the DOM elements might not always show the correct height/width, in some cases certain `<div>` could show in the UI but return a height of `0px` and that will throw off the resizer. If that is your problem then search for the `clearfix` hack, this css trick [article](https://css-tricks.com/snippets/css/clear-fix/) might help you with that. In some other cases, you might just need to add some extra padding, that is why the resizer has the 2 properties built for that, `rightPadding` and `bottomPadding` that can be provided to the `autoResize` grid option.
