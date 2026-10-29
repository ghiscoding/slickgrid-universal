##### index
- [Usage Demo](#usage)
- [Resize by Content - Grid Options](#resize-by-content---grid-options)
- [Resize by Content - Column Options](#resize-by-content---column-options)

### Demo
[Demo](https://ghiscoding.github.io/slickgrid-universal/#/example14) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example14.ts)

### Description
The default of Slickgrid-Universal is to fit all columns in the container viewport and for the most part that is a good resize to use and it's fast. However if your grid has a lot of columns then doing a fit to viewport is not exactly great, you have lot of columns a few of these columns will become too small (we strongly suggest adding `minWidth` to every column) and you'll start seeing ellipsis to a few of these columns.

The Auto-Resize by Cell Content will fix the problem described in previous paragraph, however it will come with a cost. It will read through all the cell content of all your items (because this could slow down the grid a lot, there's a default to not go over a 1000 rows but that could be overridden if you wish). For that reason the **resize by cell content** is an **opt-in** feature.

How does it work? It loops through the dataset (spread evenly when there are more items than the max count to inspect) and keeps all distinct formatted texts in the sample for each column, it then measures these texts with a canvas (using the font of a cell in that column) to find the widest one and finally adds the cell padding (read from the `.slick-cell` CSS). You can optionally include the column header title width (via `resizeByContentOptions.includeHeaderWidth`) so that a column is never narrower than its title.

There are a few configuration options you can use
- extra padding (`resizeExtraWidthPadding`)
- padding (`resizeByContentOptions.cellPaddingWidthInPx`, `resizeByContentOptions.formatterPaddingWidthInPx`)
- max width threshold (`resizeMaxWidthThreshold`)
- include header width (`resizeByContentOptions.includeHeaderWidth`)
... and more

### Usage

```ts
defineGrid() {
  this.columns = [
    { id: 'action', field: 'action', name: 'Action', width: 50, maxWidth: 50 },
    { id: 'firstName', field: 'firstName', name: 'First Name', mindWidth: 100 },
    { id: 'lastName', field: 'lastName', name: 'First Name', mindWidth: 100, resizeExtraWidthPadding: 10 },
    // ...
  ];

  this.gridOptions = {
    // ...
    enableAutoResize: true,

    // resizing by cell content is opt-in
    // we first need to disable the 2 default flags to disable autoFit/autosize
    autoFitColumnsOnFirstLoad: false,
    enableAutoSizeColumns: false,

    // then enable resize by content with these 2 flags
    autosizeColumnsByCellContentOnFirstLoad: true,
    enableAutoResizeColumnsByCellContent: true,
  };
}
```

### Resize by Content - Grid Options
There a few grid options that you can change to override the default resize options. We listed the grid options below for the resize and they should all be there but just in case, you should also check the [GridOption](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) and [ResizeByContentOption](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/resizeByContentOption.interface.ts) interface.

```ts
export interface GridOption {
  //...

  /**
   * defaults to true, do we want to resize the grid by content only on the first page or anytime the data changes?
   * Requires `enableAutoResizeColumnsByCellContent` to be set.
   * Also don't get confused with `autosizeColumnsByCellContentOnFirstLoad` that flag won't block resize by content after the first load while `resizeByContentOnlyOnFirstLoad`
   */
  resizeByContentOnlyOnFirstLoad?: boolean;

  /** Resize by Content multiple options */
  resizeByContentOptions?: ResizeByContentOption;
}
```
and

```ts
export interface ResizeByContentOption {
  /** defaults to false, if a column `width` is provided (or was previously calculated) should we recalculate it or not when resizing by cell content? */
  alwaysRecalculateColumnWidth?: boolean;

  /**
   * Cell padding width (including borders) to add to the calculation when resizing columns by their cell text content.
   * When not provided, it will be read from the `.slick-cell` CSS (padding-left/right & border-left/right widths).
   */
  cellPaddingWidthInPx?: number;

  /** Defaults to 0, extra padding width to add to the calculation of a column that has an Editor when the grid is editable. */
  formatterPaddingWidthInPx?: number;

  /**
   * Defaults to false, should we also include the column header title width (incl. sort & header menu icons) when resizing columns by their cell content?
   * When enabled, a column will never become narrower than its header title.
   */
  includeHeaderWidth?: boolean;

  /**
   * Defaults to 1000, maximum count of rows to inspect when calculating all column widths by their cell content.
   * When the dataset is larger, the rows are sampled evenly across the whole dataset (instead of only reading the first rows).
   */
  sampleSize?: number;

  /**
   * Defaults to 5000, maximum count of rows to inspect when resizing a single column by its content
   * (via the header menu "Resize by Content" command and/or double-click on the column resize handle).
   */
  singleColumnSampleSize?: number;
}
```

### Resize by Content - Column Options
We listed the column definition options below for the resize and they should all be there but just in case, you should also check the [Column](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/column.interface.ts) interface.

```ts
export interface Column {
  /** defaults to false, if a column `width` is provided (or was previously calculated) should we recalculate it or not when resizing by cell content? */
  resizeAlwaysRecalculateWidth?: boolean;

  /** no defaults, what is the column max width threshold to not go over when resizing columns by their cell content */
  resizeMaxWidthThreshold?: number;

  /** no defaults, what is optional extra width padding to add to the calculation when resizing columns by their cell content */
  resizeExtraWidthPadding?: number;
}
```
