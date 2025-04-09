#### index
- CRUD Methods
  - [Add Item](#add-an-item-row)
  - [Delete Item](#delete-an-item-row)
  - [Update Item](#update-an-item-row)
  - [Upsert Item](#upsert-an-item-row)
  - [Default Option Flags](#crud-default-option-flags)
- [Highlight a Row](#highlight-a-row-item)

### Description
When working with the grid, you might want to Add / Update or Hightlight an item row from the Datagrid.

**Note:** This is strictly a client side event, you still have to implement any backend change yourself.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react/#/slickgrid/Example11) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example11.tsx)

## CRUD Methods
### Add an Item (row)
Please note that you need to provide the `id` by yourself and remember that it has to be **unique**, else the `Slickgrid DataView` will throw you an error in the console.

##### Component
```tsx
import { SlickgridReactInstance} from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    setColumns([/*...*/]);
    setOptions({/*...*/});
  }

  function addNewItem() {
    const newItem = {
      id: dataset.length + 1, // it's up to you to decide on what the ID will be, as long as it's unique
      // ... your item properties
    };

    // add the item to the grid
    reactGridRef.current?.gridService.addItem(newItem);
  }

  return !options ? null : (
    <SlickgridReact gridId="grid1"
      columns={columns}
      options={options}
      dataset={dataset}
      onReactGridCreated={$event => reactGridReady($event.detail)}
      onGridStateChanged={$event => gridStateChanged($event.detail)}
    />
  );
}
```

#### Add Item Position (top/bottom)
When adding an item, you can add it on top (default) of the grid or at the bottom of the grid. In order to change that, you can use the `position` property.
```ts
// add the item to the end of grid
reactGridRef.current?.gridService.addItem(newItem, { position: 'bottom' });
```

#### Change default flags
When adding an item, you have access to change any of the default flags through the second argument of `addItem` method.
```tsx
// add the item to the end of grid
reactGridRef.current?.gridService.addItem(newItem, {
  // the defaults are shown below
  highlightRow: true, // do we want to highlight the row after the insert
  position: 'top',    // which position of the grid to add the item
  resortGrid: false,  // do we want to resort the grid after the insert
  selectRow: false,   // do we want to select the row after the insert
  triggerEvent: true  // do we want to trigger an event after the insert
});
```

### Delete an Item (row)
To delete a row, you can use `deleteItem(s)` and the pass the entire object(s) or use `deleteItemById(s) in which you need to provide the object `id` to delete and the method will find it in the grid and remove it from the grid. Also please note that it's only deleting from the grid (by removing it from the DataView), meaning that it won't remove it from your database.

##### Component
```tsx
import { SlickgridReactInstance} from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {}

  function removeItem(itemId: number | string) {
    // remove the item from the grid
    reactGridRef.current?.gridService.deleteItemById(itemId);

    // or multiple Ids passed as an array (number or string)
    // reactGridRef.current?.gridService.deleteItemByIds([1, 2]); // e.g. remove user id 1 and 2
  }
}
```

#### Change default flags
When adding an item, you have access to change any of the default flags through the second argument of `addItem` method.
```tsx
// add the item to the end of grid
reactGridRef.current?.gridService.deleteItemById(123, {
  // the defaults are shown below
  triggerEvent: true  // do we want to trigger an event after the insert
});
```

### Update an Item (row)
To update an item, you can use `updateItem(s)` and the pass the entire object(s) in this case it does not require you to know the row number, it will try to find the row by itself (it uses the "id" for that) and update the item. The other way would be to use `updateItemById` in which you need to provide the object `id` to update the item.

##### Component
```tsx
import { SlickgridReactInstance } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function updateItem(upItem) {
    reactGridRef.current?.gridService.updateItem(newItem);
  }
}
```

#### Change default flags
When adding an item, you have access to change any of the default flags through the second argument of `addItem` method.
```tsx
// add the item to the end of grid
reactGridRef.current?.gridService.updateItem(newItem, {
  // the defaults are shown below
  highlightRow: true,       // do we want to highlight the row after the update
  selectRow: false,         // do we want to select the row after the update
  scrollRowIntoView: false, // do we want to scroll the row into the viewport after the update
  triggerEvent: true        // do we want to trigger an event after the update
});
```

### Upsert an Item (row)
Upsert will do an Insert when not found or update if it found the item already exist in the grid.

##### Component
```tsx
import { SlickgridReactInstance } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function updateItem(upItem) {
    reactGridRef.current?.gridService.upsertItem(upItem);
  }
}
```

### CRUD Default Option Flags
All the CRUD methods have default option flags that can be changed which will do certain actions. The default option flags are the following for each of the CRUD method (`upsert` will use the flags of the insert or the update depending on which method it calls).
```tsx
const GridServiceDeleteOptionDefaults: GridServiceDeleteOption = {
  triggerEvent: true  // do we want to trigger an event after the insert
};

const GridServiceInsertOptionDefaults: GridServiceInsertOption = {
  highlightRow: true, // do we want to highlight the row after the insert
  position: 'top',    // which position of the grid to add the item
  resortGrid: false,  // do we want to resort the grid after the insert
  selectRow: false,   // do we want to select the row after the insert
  triggerEvent: true  // do we want to trigger an event after the insert
};

const GridServiceUpdateOptionDefaults: GridServiceUpdateOption = {
  highlightRow: true,       // do we want to highlight the row after the update
  selectRow: false,         // do we want to select the row after the update
  scrollRowIntoView: false, // do we want to scroll the row into the viewport after the update
  triggerEvent: true        // do we want to trigger an event after the update
};
```

## Highlight a row item
Highlighting a row is customizable with SASS, you can change the highlighted color and/or animation by changing the [SASS variables](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) `$row-highlight-background-color` and/or `$row-highlight-fade-animation`
Take a look at all the available [SASS variables](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss).

##### Component
```tsx
import { SlickgridReactInstance } from 'slickgrid-react';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef();

  useEffect(() => defineGrid(), []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function updateItem(rowNumber) {
    const fadingDelay = 2000; // in milliseconds

    // you can pass an optional fading delay (1500ms by default)
    reactGridRef.current?.gridService.highlightRow(rowNumber, fadingDelay);
  }
}
```
