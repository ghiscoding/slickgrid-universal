import * as DOMPurify from 'dompurify';
import * as moment_ from 'moment-mini';
const moment = moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import {
  Constants,
  CustomFooterOption,
  GridOption,
  Locale,
  Metrics,
  SharedService,
  SlickGrid,
  TranslaterService,
} from '@slickgrid-universal/common';
import { BindingHelper } from '../services/binding.helper';

export class SlickFooterComponent {
  private _bindingHelper: BindingHelper;
  private _domPurifyOptions: any = {};
  private _footerElement: HTMLDivElement;
  private _customFooterOptions: CustomFooterOption;
  private _metrics: Metrics = {
    // TODO might want to replace this approach
    startTime: undefined,
    endTime: undefined,
    itemCount: 0,
    totalItemCount: undefined
  };
  showCustomFooter = false;

  get grid(): SlickGrid {
    return this.sharedService.grid;
  }

  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }

  get gridOptions(): GridOption {
    return this.sharedService?.gridOptions || {};
  }

  get locales(): Locale {
    // get locales provided by user in main file or else use default English locales via the Constants
    return this.sharedService.gridOptions && this.sharedService.gridOptions.locales || Constants.locales;
  }

  set metrics(metrics: Metrics) {
    this._metrics.startTime = metrics.startTime;
    this._metrics.endTime = metrics.endTime;
    this._metrics.itemCount = metrics.itemCount;
    this._metrics.totalItemCount = metrics.totalItemCount;
  }

  constructor(private sharedService: SharedService, private translaterService?: TranslaterService) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid} `;
  }

  /** Add some DOM Element bindings */
  addBindings() {
    // TODO replace by binding setter instead of bindings
    this._bindingHelper.addElementBinding(this._metrics, 'itemCount', 'span.item-count', 'textContent');
    this._bindingHelper.addElementBinding(this._metrics, 'totalItemCount', 'span.total-count', 'textContent');
    this._bindingHelper.addElementBinding(this._metrics, 'endTime', 'span.last-update', 'textContent');
  }

  /**
   * We could optionally display a custom footer below the grid to show some metrics (last update, item count with/without filters)
   * It's an opt-in, user has to enable "showCustomFooter" and it cannot be used when there's already a Pagination since they display the same kind of info
   */
  optionallyShowCustomFooterWithMetrics(gridParentContainerElm: HTMLElement): boolean {
    if (this.gridOptions) {
      if (this.gridOptions.enableTranslate) {
        this.translateCustomFooterTexts();
      } else if (this.gridOptions.customFooterOptions) {
        const customFooterOptions = this.gridOptions.customFooterOptions;
        customFooterOptions.metricTexts = customFooterOptions.metricTexts || {};
        customFooterOptions.metricTexts.lastUpdate = customFooterOptions.metricTexts.lastUpdate || this.locales && this.locales.TEXT_LAST_UPDATE || 'TEXT_LAST_UPDATE';
        customFooterOptions.metricTexts.items = customFooterOptions.metricTexts.items || this.locales && this.locales.TEXT_ITEMS || 'TEXT_ITEMS';
        customFooterOptions.metricTexts.of = customFooterOptions.metricTexts.of || this.locales && this.locales.TEXT_OF || 'TEXT_OF';
      }

      // we will display the custom footer only when there's no Pagination
      if (!this.gridOptions.enablePagination && this.gridOptions?.showCustomFooter) {
        this.showCustomFooter = this.gridOptions?.showCustomFooter ?? false;
        this._customFooterOptions = this.gridOptions.customFooterOptions || {};
        this.renderFooter(gridParentContainerElm);
        this.addBindings();
        return true;
      }
    }

    this.showCustomFooter = false;
    return false;
  }

  renderFooter(gridParentContainerElm: HTMLElement) {
    const footerElm = document.createElement('div');
    footerElm.className = `slick-custom-footer row ${this.gridUid}`;
    footerElm.style.width = '100%';
    footerElm.style.height = `${this._customFooterOptions.footerHeight || 20}px`;

    const leftFooterElm = document.createElement('div');
    leftFooterElm.className = `left-footer ${this._customFooterOptions.leftContainerClass}`;
    leftFooterElm.innerHTML = DOMPurify.sanitize(this._customFooterOptions.leftFooterText || '', this._domPurifyOptions).toString();

    const metricsElm = document.createElement('div');
    metricsElm.className = 'metrics';

    if (!this._customFooterOptions?.hideMetrics) {
      const rightFooterElm = this.renderFooterRightContainer();
      if (rightFooterElm) {
        metricsElm.appendChild(rightFooterElm);
      }
    }

    footerElm.appendChild(leftFooterElm);
    footerElm.appendChild(metricsElm);
    this._footerElement = footerElm;

    if (gridParentContainerElm?.append && this._footerElement) {
      gridParentContainerElm.append(this._footerElement);
      this.addBindings();
    }
  }

  renderFooterRightContainer(): HTMLDivElement {
    const rightFooterElm = document.createElement('div');
    rightFooterElm.className = `right-footer metrics ${this._customFooterOptions.rightContainerClass}`;

    const lastUpdateElm = document.createElement('span');
    lastUpdateElm.className = 'timestamp';

    if (!this._customFooterOptions.hideLastUpdateTimestamp) {
      const footerLastUpdateElm = this.renderFooterLastUpdate();
      if (footerLastUpdateElm) {
        lastUpdateElm.appendChild(footerLastUpdateElm);
      }
    }

    const itemCountElm = document.createElement('span');
    itemCountElm.className = 'item-count';
    itemCountElm.textContent = `${this.metrics?.itemCount ?? ''}`;

    // last update elements
    rightFooterElm.appendChild(lastUpdateElm);
    rightFooterElm.appendChild(itemCountElm);

    // total count element (unless hidden)
    if (!this._customFooterOptions.hideTotalItemCount) {
      const textOfElm = document.createElement('span');
      textOfElm.textContent = ` ${this._customFooterOptions?.metricTexts?.of ?? ''} `;
      rightFooterElm.appendChild(textOfElm);

      const totalCountElm = document.createElement('span');
      totalCountElm.className = 'total-count';
      totalCountElm.textContent = `${this.metrics?.totalItemCount ?? ''} items`;

      rightFooterElm.appendChild(totalCountElm);
    }

    const textItemsElm = document.createElement('span');
    textItemsElm.textContent = ` ${this._customFooterOptions?.metricTexts?.items ?? ''} `;
    rightFooterElm.appendChild(textItemsElm);

    return rightFooterElm;
  }

  renderFooterLastUpdate(): HTMLSpanElement {
    const lastUpdateElm = document.createElement('span');
    lastUpdateElm.className = 'last-update';
    lastUpdateElm.textContent = moment(this.metrics?.endTime).format(this._customFooterOptions.dateFormat);

    const separatorElm = document.createElement('span');
    separatorElm.className = 'separator';
    separatorElm.textContent = ` ${this._customFooterOptions.metricSeparator} `;

    const lastUpdateContainerElm = document.createElement('span');
    lastUpdateContainerElm.appendChild(lastUpdateElm);
    lastUpdateContainerElm.appendChild(separatorElm);

    return lastUpdateContainerElm;
  }

  // --
  // private functions
  // --------------------

  /** Translate all Custom Footer Texts (footer with metrics) */
  private translateCustomFooterTexts() {
    if (this.translaterService && this.translaterService.translate && this.translaterService.getCurrentLocale && this.translaterService.getCurrentLocale()) {
      const customFooterOptions = this.gridOptions?.customFooterOptions || {};
      customFooterOptions.metricTexts = customFooterOptions.metricTexts || {};
      for (const propName of Object.keys(customFooterOptions.metricTexts)) {
        if (propName.lastIndexOf('Key') > 0) {
          const propNameWithoutKey = propName.substring(0, propName.lastIndexOf('Key'));
          customFooterOptions.metricTexts[propNameWithoutKey] = this.translaterService.translate(customFooterOptions.metricTexts[propName] || ' ');
        }
      }
    }
  }
}
