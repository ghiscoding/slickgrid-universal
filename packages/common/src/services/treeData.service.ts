import { SlickDataView, GridOption, SlickEventHandler, SlickGrid, SlickNamespace, GetSlickEventType, OnClickEventArgs, SlickEventData } from '../interfaces/index';
import { SharedService } from './shared.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

export class TreeDataService {
  private _grid: SlickGrid;
  private _eventHandler: SlickEventHandler;

  constructor(private sharedService: SharedService) {
    this._eventHandler = new Slick.EventHandler();
  }

  get dataset(): any[] {
    return this.dataView?.getItems();
  }

  get datasetHierarchical(): any[] | undefined {
    return this.sharedService.hierarchicalDataset;
  }

  /** Getter of SlickGrid DataView object */
  get dataView(): SlickDataView {
    return (this._grid?.getData && this._grid.getData()) as SlickDataView;
  }

  /** Getter of the SlickGrid Event Handler */
  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get gridOptions(): GridOption {
    return this._grid?.getOptions() || {};
  }

  dispose() {
    // unsubscribe all SlickGrid events
    if (this._eventHandler?.unsubscribeAll) {
      this._eventHandler.unsubscribeAll();
    }
  }

  init(grid: SlickGrid) {
    this._grid = grid;

    // subscribe to the SlickGrid event and call the backend execution
    const onClickHandler = grid.onClick;
    if (onClickHandler) {
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onClickHandler>>).subscribe(onClickHandler, this.handleOnCellClick.bind(this));
    }
  }

  handleOnCellClick(event: SlickEventData, args: OnClickEventArgs) {
    if (event && args) {
      const targetElm: any = event.target || {};
      const treeDataOptions = this.gridOptions.treeDataOptions;
      const collapsedPropName = treeDataOptions && treeDataOptions.collapsedPropName || '__collapsed';
      const idPropName = this.gridOptions.datasetIdPropertyName ?? 'id';

      if (targetElm && targetElm.className) {
        const hasToggleClass = targetElm.className.indexOf('toggle') >= 0 || false;
        if (hasToggleClass) {
          const item = this.dataView.getItem(args.row);
          if (item) {
            item[collapsedPropName] = !item[collapsedPropName] ? true : false;
            this.dataView.updateItem(item[idPropName], item);
            this._grid.invalidate();
          }
          event.stopImmediatePropagation();
        }
      }
    }
  }

  toggleTreeDataCollapse(collapsing: boolean) {
    if (this.gridOptions) {
      const treeDataOptions = this.gridOptions.treeDataOptions;

      if (this.gridOptions.enableTreeData) {
        const items: any[] = this.dataView.getItems() || [];
        const collapsedPropName = treeDataOptions && treeDataOptions.collapsedPropName || '__collapsed';
        items.forEach((item: any) => item[collapsedPropName] = collapsing);
        this.dataView.setItems(items);
        this._grid.invalidate();
      }
    }
  }
}
