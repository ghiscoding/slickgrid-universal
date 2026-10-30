import { ResizerService, type GridSize } from '@slickgrid-universal/common';
import { getOffset } from '@slickgrid-universal/utils';
import type { SalesforceGridOption } from './salesforce-grid-option.interface.js';

/** Salesforce tab visibility recovery, isolated from the shared grid resizer. */
export class SalesforceResizerService extends ResizerService {
  protected _intervalId?: any;
  protected _intervalRetryDelay = 200;
  protected _isStopResizeIntervalRequested = false;
  protected _cResizeCheckRequired = false;

  get intervalRetryDelay(): number {
    return this._intervalRetryDelay;
  }
  set intervalRetryDelay(delay: number) {
    this._intervalRetryDelay = delay;
  }

  override get gridOptions(): SalesforceGridOption {
    return super.gridOptions;
  }

  override dispose(): void {
    clearInterval(this._intervalId);
    super.dispose();
  }

  protected override async resizeGridOnFirstLoad(): Promise<GridSize | undefined> {
    const size = await super.resizeGridOnFirstLoad();
    this.resizeGridWhenStylingIsBrokenUntilCorrected();
    return size;
  }

  requestStopOfAutoFixResizeGrid(isStopRequired = true): void {
    this._isStopResizeIntervalRequested = isStopRequired;
  }

  /**
   * Just check if the grid is still shown in the DOM/UI (visible to the end user and not hidden by a parent element, e.g. Tab, Accordion, etc.)
   * @returns is grid shown
   */
  protected isGridVisibleInUI(): boolean {
    return !!document.querySelector<HTMLDivElement>(`${this.gridUidSelector}`)?.offsetParent;
  }

  /**
   * Patch for SalesForce, some issues arise when having a grid inside a Tab and user clicks in a different Tab without waiting for the grid to be rendered
   * in ideal world, we would simply call a resize when user comes back to the Tab with the grid (tab focused) but this is an extra step and we might not always have this event available.
   * The grid seems broken, the header titles seems to be showing up behind the grid data and the rendering seems broken.
   * Why it happens? Because SlickGrid can resize problem when the DOM element is hidden and that happens when user doesn't wait for the grid to be fully rendered and go in a different Tab.
   *
   * So the patch is to call a grid resize if the following 2 conditions are met
   *   1- header row is Y coordinate 0 (happens when user is not in current Tab)
   *   2- header titles are lower than the viewport of dataset (this can happen when user change Tab and DOM is not shown),
   * for these cases we'll resize until it's no longer true or until we reach a max time limit (70min)
   */
  protected resizeGridWhenStylingIsBrokenUntilCorrected(): void {
    // how many time we want to check before really stopping the resize check?
    // We do this because user might be switching to another tab too quickly for the resize be really finished, so better recheck few times to make sure
    const autoFixResizeTimeout = this.gridOptions?.autoFixResizeTimeout ?? 5 * 60 * 60; // interval is 200ms, so (5 * 60 * 60 = 60min)
    const autoFixResizeRequiredGoodCount = this.gridOptions?.autoFixResizeRequiredGoodCount ?? 5;

    const headerElm = this._gridContainerElm.querySelector<HTMLDivElement>(`${this.gridUidSelector} .slick-header`);
    const viewportElm = this._gridContainerElm.querySelector<HTMLDivElement>(`${this.gridUidSelector} .slick-viewport`);
    let intervalExecutionCounter = 0;
    let resizeGoodCount = 0;

    if (headerElm && viewportElm && this.gridOptions.autoFixResizeWhenBrokenStyleDetected) {
      const dataLn = this.dataView.getItemCount();
      const columns = this._grid.getColumns() || [];

      this._intervalId = setInterval(async () => {
        if (!this.isGridVisibleInUI()) {
          this._cResizeCheckRequired = true; // needs to be resized when it becomes visible again
        }
        const headerTitleRowHeight = 44; // this one is set by SASS/CSS so let's hard code it
        const headerPos = getOffset(headerElm);
        let headerOffsetTop = headerPos.top;

        // make sure that there's actual window sizes difference before executing a recalc, otherwise there's no need to go further
        if (
          this.isGridVisibleInUI() &&
          (this._cResizeCheckRequired ||
            !this._lastWindowSize ||
            this._lastWindowSize.height !== window.innerHeight ||
            this._lastWindowSize.width !== window.innerWidth)
        ) {
          if (this.gridOptions?.enableFiltering && this.gridOptions.headerRowHeight) {
            headerOffsetTop += this.gridOptions.headerRowHeight; // filter row height
          }
          if (this.gridOptions?.createPreHeaderPanel && this.gridOptions.showPreHeaderPanel && this.gridOptions.preHeaderPanelHeight) {
            headerOffsetTop += this.gridOptions.preHeaderPanelHeight; // header grouping titles row height
          }
          headerOffsetTop += headerTitleRowHeight; // header title row height

          const viewportPos = getOffset(viewportElm);
          const viewportOffsetTop = viewportPos.top;

          // if header row is Y coordinate 0 (happens when user is not in current Tab) or when header titles are lower than the viewport of dataset (this can happen when user change Tab and DOM is not shown)
          // another resize condition could be that if the grid location is at coordinate x/y 0/0, we assume that it's in a hidden tab and we'll need to resize whenever that tab becomes active
          // for these cases we'll resize until it's no longer true or until we reach a max time limit (70min)
          const containerElmOffset = getOffset(this._gridContainerElm);
          let isResizeRequired =
            headerPos?.top === 0 ||
            headerOffsetTop - viewportOffsetTop > 2 ||
            (containerElmOffset.left === 0 && containerElmOffset.top === 0)
              ? true
              : false;

          // another condition for a required resize is when the grid is hidden (not in current tab) then its "rightPx" rendered range will be 0px
          // if that's the case then we know the grid is still hidden and we need to resize it whenever it becomes visible (when its "rightPx" becomes greater than 0 then it's visible)
          const renderedRangeRightPx = this._grid.getRenderedRange()?.rightPx ?? 0;
          if (!isResizeRequired && dataLn > 0 && renderedRangeRightPx === 0 && columns.length > 1) {
            isResizeRequired = true;
          }

          // user could choose to manually stop the looped of auto resize fix
          if (this._isStopResizeIntervalRequested) {
            isResizeRequired = false;
            intervalExecutionCounter = autoFixResizeTimeout;
          }

          // visible grid (shown to the user and not hidden in another Tab will have an offsetParent defined)
          if (this.isGridVisibleInUI() && (isResizeRequired || containerElmOffset.left === 0 || containerElmOffset.top === 0)) {
            await this.resizeGrid();
            if (resizeGoodCount < 5) {
              this._grid.updateColumns(); // also refresh header titles after grid becomes visible in new tab, this fixes an issue observed in Salesforce
            }

            // make sure the grid is still visible after doing the resize
            if (this.isGridVisibleInUI()) {
              isResizeRequired = false;
              this._cResizeCheckRequired = false;
            }
          }

          // make sure the grid is still visible after optionally doing a resize
          // if it visible then we can consider it a good resize (it might not be visible if user quickly switch to another Tab)
          if (this.isGridVisibleInUI()) {
            resizeGoodCount++;
          }

          if (
            this.isGridVisibleInUI() &&
            !isResizeRequired &&
            (resizeGoodCount >= autoFixResizeRequiredGoodCount || intervalExecutionCounter++ >= autoFixResizeTimeout)
          ) {
            clearInterval(this._intervalId); // stop the interval if we don't need resize or if we passed let say 70min
          }
        }
      }, this.intervalRetryDelay);
    }
  }
}
