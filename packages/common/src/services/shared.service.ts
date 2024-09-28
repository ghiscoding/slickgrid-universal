import type { SlickDataView, SlickGrid } from '../core/index';
import type { Column, CurrentPagination, GridOption } from '../interfaces/index';
import type { SlickGroupItemMetadataProvider } from '../extensions/slickGroupItemMetadataProvider';

export class SharedService {
  protected _allColumns!: Column[];
  protected _gridOptions!: GridOption;
  protected _visibleColumns!: Column[];
  protected _hierarchicalDataset: any[] | undefined;
  protected _externalRegisteredResources!: any[];

  // --
  // public

  /** Current Pagination (when Pagination is enabled) */
  currentPagination: CurrentPagination | null = null;

  /** SlickGrid DataView object */
  dataView!: SlickDataView;

  /** when `preParseDateColumns` grid option is enabled, did we already parsed all dates? */
  isItemsDateParsed = false;

  /** Frozen column id for reference if we ever show/hide column from ColumnPicker/GridMenu afterward */
  frozenVisibleColumnId: string | number = '';

  /** Grid Container HTML Element */
  gridContainerElement!: HTMLElement;

  /** GroupItemMetadataProvider */
  groupItemMetadataProvider?: SlickGroupItemMetadataProvider;

  /** Boolean to know if the columns were ever reordered or not since the grid was created. */
  hasColumnsReordered = false;

  /** Boolean to know if user want to hide header row after 1st page load */
  hideHeaderRowAfterPageLoad = false;

  /** SlickGrid Grid object */
  slickGrid!: SlickGrid;

  // --
  // GETTERs / SETTERs

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
    return this.slickGrid?.getColumns() ?? [];
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._gridOptions || this.slickGrid?.getOptions() || {};
  }

  /** Setter for the Grid Options pulled through the Grid Object */
  set gridOptions(gridOptions: GridOption) {
    this._gridOptions = gridOptions;
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
