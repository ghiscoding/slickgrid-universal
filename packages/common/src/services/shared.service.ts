import type { SlickDataView, SlickGrid } from '../core/index';
import type { Column, CurrentPagination, GridOption } from '../interfaces/index';
import type { SlickGroupItemMetadataProvider } from '../extensions/slickGroupItemMetadataProvider';

export class SharedService {
  protected _allColumns!: Column[];
  protected _dataView!: SlickDataView;
  protected _groupItemMetadataProvider!: SlickGroupItemMetadataProvider;
  protected _grid!: SlickGrid;
  protected _gridContainerElm!: HTMLElement;
  protected _gridOptions!: GridOption;
  protected _hasColumnsReordered = false;
  protected _currentPagination!: CurrentPagination;
  protected _visibleColumns!: Column[];
  protected _hideHeaderRowAfterPageLoad = false;
  protected _hierarchicalDataset: any[] | undefined;
  protected _externalRegisteredResources!: any[];
  protected _frozenVisibleColumnId!: string | number;

  isItemsDateParsed = false;

  // --
  // public

  /** Getter for All Columns  in the grid (hidden/visible) */
  get allColumns(): Column[] {
    return this._allColumns;
  }
  /** Setter for All Columns  in the grid (hidden/visible) */
  set allColumns(allColumns: Column[]) {
    this._allColumns = allColumns;
  }

  /** Getter for the Column Definitions pulled through the Grid Object */
  get columnDefinitions(): Column[] {
    return this._grid?.getColumns() ?? [];
  }

  /** Getter for the Current Pagination (when Pagination is enabled) */
  get currentPagination(): CurrentPagination {
    return this._currentPagination;
  }

  /** Setter for the Current Pagination (when Pagination is enabled) */
  set currentPagination(currentPagination: CurrentPagination) {
    this._currentPagination = currentPagination;
  }

  /** Getter for SlickGrid DataView object */
  get dataView(): SlickDataView {
    return this._dataView;
  }
  /** Setter for SlickGrid DataView object */
  set dataView(dataView: SlickDataView) {
    this._dataView = dataView;
  }

  /** Setter to keep the frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward */
  get frozenVisibleColumnId(): string | number {
    return this._frozenVisibleColumnId;
  }
  /** Getter to keep the frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward */
  set frozenVisibleColumnId(columnId: string | number) {
    this._frozenVisibleColumnId = columnId;
  }

  /** Setter to know if the columns were ever reordered or not since the grid was created. */
  get hasColumnsReordered(): boolean {
    return this._hasColumnsReordered;
  }
  /** Getter to know if the columns were ever reordered or not since the grid was created. */
  set hasColumnsReordered(isColumnReordered: boolean) {
    this._hasColumnsReordered = isColumnReordered;
  }

  /** Getter for SlickGrid Grid object */
  get slickGrid(): SlickGrid {
    return this._grid;
  }
  /** Setter for SlickGrid Grid object */
  set slickGrid(grid: SlickGrid) {
    this._grid = grid;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridContainerElement(): HTMLElement {
    return this._gridContainerElm;
  }

  /** Setter for the Grid Options pulled through the Grid Object */
  set gridContainerElement(gridContainerElm: HTMLElement) {
    this._gridContainerElm = gridContainerElm;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._gridOptions || this._grid?.getOptions() || {};
  }

  /** Setter for the Grid Options pulled through the Grid Object */
  set gridOptions(gridOptions: GridOption) {
    this._gridOptions = gridOptions;
  }

  /** Getter for the Grid Options */
  get groupItemMetadataProvider(): SlickGroupItemMetadataProvider {
    return this._groupItemMetadataProvider;
  }
  /** Setter for the Grid Options */
  set groupItemMetadataProvider(groupItemMetadataProvider: SlickGroupItemMetadataProvider) {
    this._groupItemMetadataProvider = groupItemMetadataProvider;
  }

  /** Getter to know if user want to hide header row after 1st page load */
  get hideHeaderRowAfterPageLoad(): boolean {
    return this._hideHeaderRowAfterPageLoad;
  }
  /** Setter for knowing if user want to hide header row after 1st page load */
  set hideHeaderRowAfterPageLoad(hideHeaderRowAfterPageLoad: boolean) {
    this._hideHeaderRowAfterPageLoad = hideHeaderRowAfterPageLoad;
  }

  /** Getter to know if user want to hide header row after 1st page load */
  get externalRegisteredResources(): any[] {
    return this._externalRegisteredResources;
  }
  /** Setter for knowing if user want to hide header row after 1st page load */
  set externalRegisteredResources(externalRegisteredResources: any[]) {
    this._externalRegisteredResources = externalRegisteredResources;
  }

  /** Getter for the Visible Columns in the grid */
  get visibleColumns(): Column[] {
    return this._visibleColumns;
  }
  /** Setter for the Visible Columns in the grid */
  set visibleColumns(visibleColumns: Column[]) {
    this._visibleColumns = visibleColumns;
  }

  /** Getter for the Hierarchical Tree Data dataset when the feature is enabled */
  get hierarchicalDataset(): any[] | undefined {
    return this._hierarchicalDataset;
  }

  /** Getter for the Hierarchical Tree Data dataset when the feature is enabled */
  set hierarchicalDataset(hierarchicalDataset: any[] | undefined) {
    this._hierarchicalDataset = hierarchicalDataset;
  }
}
