import type { SlickDataView } from '../core/slickDataView.js';
import type { SlickGrid } from '../core/slickGrid.js';
import type { SlickGroupItemMetadataProvider } from '../extensions/slickGroupItemMetadataProvider.js';
import type { Column, CurrentPagination, ExternalResource, ExternalResourceConstructor, GridOption } from '../interfaces/index.js';
import { getTreeDataOptionPropName } from './utilities.js';

export class SharedService {
  protected _allColumns!: Column[];
  protected _gridOptions!: GridOption;
  protected _hierarchicalDataset: any[] | undefined;
  protected _hierarchicalItemsIndex?: { dataset: any[]; itemsById: Map<number | string, any> };
  protected _externalRegisteredResources!: any[];

  // --
  // public

  /** Current Pagination (when Pagination is enabled) */
  currentPagination: CurrentPagination | null = null;

  /** SlickGrid DataView object */
  dataView!: SlickDataView;

  /** when `preParseDateColumns` grid option is enabled, did we already parsed all dates? */
  isItemsDateParsed = false;

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
  get columns(): Column[] {
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
  get externalRegisteredResources(): Array<ExternalResource | ExternalResourceConstructor> {
    return this._externalRegisteredResources;
  }
  /** Setter for knowing if user want to hide header row after 1st page load */
  set externalRegisteredResources(externalRegisteredResources: Array<ExternalResource | ExternalResourceConstructor>) {
    this._externalRegisteredResources = externalRegisteredResources;
  }

  /** Getter for the Hierarchical Tree Data dataset when the feature is enabled */
  get hierarchicalDataset(): any[] | undefined {
    return this._hierarchicalDataset;
  }

  /** Getter for the Hierarchical Tree Data dataset when the feature is enabled */
  set hierarchicalDataset(hierarchicalDataset: any[] | undefined) {
    this._hierarchicalDataset = hierarchicalDataset;
  }

  /**
   * Find an item of the hierarchical (tree) dataset by its id.
   * The lookup index is built on first use and rebuilt when the dataset is replaced or when an id is missing (e.g. lazily loaded children).
   */
  getHierarchicalItemById(itemId: number | string): any {
    const hierarchicalDataset = this.hierarchicalDataset ?? [];
    if (this._hierarchicalItemsIndex?.dataset !== hierarchicalDataset || !this._hierarchicalItemsIndex.itemsById.has(itemId)) {
      this._hierarchicalItemsIndex = { dataset: hierarchicalDataset, itemsById: this.indexHierarchicalItems(hierarchicalDataset) };
    }
    return this._hierarchicalItemsIndex.itemsById.get(itemId);
  }

  /** Index all hierarchical items by id, the first item found (depth-first) wins when ids are duplicated */
  protected indexHierarchicalItems(hierarchicalDataset: any[]): Map<number | string, any> {
    const idPropName = this.gridOptions.datasetIdPropertyName || 'id';
    const childrenPropName = getTreeDataOptionPropName(this.gridOptions.treeDataOptions, 'childrenPropName');
    const itemsById = new Map<number | string, any>();
    const stack = hierarchicalDataset.slice().reverse();

    while (stack.length > 0) {
      const item = stack.pop();
      if (item && !itemsById.has(item[idPropName])) {
        itemsById.set(item[idPropName], item);
      }
      const children = item?.[childrenPropName];
      if (Array.isArray(children)) {
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push(children[i]);
        }
      }
    }
    return itemsById;
  }
}
