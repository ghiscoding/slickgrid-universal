import * as moment_ from 'moment-mini';
const moment = moment_['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import {
  Constants,
  CustomFooterOption,
  GridOption,
  Locale,
  Metrics,
  SlickGrid,
  TranslaterService,
  sanitizeTextByAvailableSanitizer,
} from '@slickgrid-universal/common';
import { BindingHelper } from '../services/binding.helper';

export class SlickFooterComponent {
  private _bindingHelper: BindingHelper;
  private _footerElement: HTMLDivElement;

  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this.grid && this.grid.getOptions) ? this.grid.getOptions() : {};
  }

  get locales(): Locale {
    // get locales provided by user in main file or else use default English locales via the Constants
    return this.gridOptions.locales || Constants.locales;
  }

  set metrics(metrics: Metrics) {
    this.renderMetrics(metrics);
  }

  constructor(private grid: SlickGrid, private customFooterOptions: CustomFooterOption, private translaterService?: TranslaterService) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid} `;
  }

  dispose() {
    this._bindingHelper.dispose();
    this._footerElement?.remove();
  }

  /**
   * We could optionally display a custom footer below the grid to show some metrics (last update, item count with/without filters)
   * It's an opt-in, user has to enable "showCustomFooter" and it cannot be used when there's already a Pagination since they display the same kind of info
   */
  renderFooter(gridParentContainerElm: HTMLElement) {
    if (this.gridOptions.enableTranslate) {
      this.translateCustomFooterTexts();
    } else {
      this.customFooterOptions.metricTexts = this.customFooterOptions.metricTexts || {};
      this.customFooterOptions.metricTexts.lastUpdate = this.customFooterOptions.metricTexts.lastUpdate || this.locales?.TEXT_LAST_UPDATE || 'TEXT_LAST_UPDATE';
      this.customFooterOptions.metricTexts.items = this.customFooterOptions.metricTexts.items || this.locales?.TEXT_ITEMS || 'TEXT_ITEMS';
      this.customFooterOptions.metricTexts.of = this.customFooterOptions.metricTexts.of || this.locales?.TEXT_OF || 'TEXT_OF';
    }

    // we create and the custom footer in the DOM but only when there's no Pagination
    this.createFooterContainer(gridParentContainerElm);
  }

  /** Render element attribute values */
  renderMetrics(metrics: Metrics) {
    // get translated text & last timestamp
    const lastUpdateText = this.customFooterOptions?.metricTexts?.lastUpdate ?? '';
    const lastUpdateTimestamp = moment(metrics.endTime).format(this.customFooterOptions.dateFormat);
    this._bindingHelper.setElementAttributeValue('span.last-update', 'textContent', `${lastUpdateText} ${lastUpdateTimestamp}`);
    this._bindingHelper.setElementAttributeValue('span.item-count', 'textContent', metrics.itemCount);
    this._bindingHelper.setElementAttributeValue('span.total-count', 'textContent', metrics.totalItemCount);
  }

  // --
  // private functions
  // --------------------

  /** Create the Footer Container */
  private createFooterContainer(gridParentContainerElm: HTMLElement) {
    const footerElm = document.createElement('div');
    footerElm.className = `slick-custom-footer ${this.gridUid}`;
    footerElm.style.width = '100%';
    footerElm.style.height = `${this.customFooterOptions.footerHeight || 20}px`;

    const leftFooterElm = document.createElement('div');
    leftFooterElm.className = `left-footer ${this.customFooterOptions.leftContainerClass}`;
    leftFooterElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, this.customFooterOptions.leftFooterText || '');

    const metricsElm = document.createElement('div');
    metricsElm.className = 'metrics';

    if (!this.customFooterOptions.hideMetrics) {
      const rightFooterElm = this.createFooterRightContainer();
      if (rightFooterElm) {
        metricsElm.appendChild(rightFooterElm);
      }
    }

    footerElm.appendChild(leftFooterElm);
    footerElm.appendChild(metricsElm);
    this._footerElement = footerElm;

    if (gridParentContainerElm?.appendChild && this._footerElement) {
      gridParentContainerElm.appendChild(this._footerElement);
    }
  }

  /** Create the Right Section Footer */
  private createFooterRightContainer(): HTMLDivElement {
    const rightFooterElm = document.createElement('div');
    rightFooterElm.className = `right-footer metrics ${this.customFooterOptions.rightContainerClass || ''}`;

    const lastUpdateElm = document.createElement('span');
    lastUpdateElm.className = 'timestamp';

    if (!this.customFooterOptions.hideLastUpdateTimestamp) {
      const footerLastUpdateElm = this.createFooterLastUpdate();
      if (footerLastUpdateElm) {
        lastUpdateElm.appendChild(footerLastUpdateElm);
      }
    }

    const itemCountElm = document.createElement('span');
    itemCountElm.className = 'item-count';
    itemCountElm.textContent = `${this.metrics?.itemCount ?? '0'}`;

    // last update elements
    rightFooterElm.appendChild(lastUpdateElm);
    rightFooterElm.appendChild(itemCountElm);

    // total count element (unless hidden)
    if (!this.customFooterOptions.hideTotalItemCount) {
      const textOfElm = document.createElement('span');
      textOfElm.textContent = ` ${this.customFooterOptions.metricTexts?.of ?? 'of'} `;
      rightFooterElm.appendChild(textOfElm);

      const totalCountElm = document.createElement('span');
      totalCountElm.className = 'total-count';
      totalCountElm.textContent = `${this.metrics?.totalItemCount ?? '0'}`;

      rightFooterElm.appendChild(totalCountElm);
    }

    const textItemsElm = document.createElement('span');
    textItemsElm.textContent = ` ${this.customFooterOptions.metricTexts?.items ?? 'items'} `;
    rightFooterElm.appendChild(textItemsElm);

    return rightFooterElm;
  }

  /** Create the Right Section Last Update Timestamp */
  private createFooterLastUpdate(): HTMLSpanElement {
    // get translated text & last timestamp
    const lastUpdateText = this.customFooterOptions?.metricTexts?.lastUpdate ?? 'Last Update';
    const lastUpdateTimestamp = moment(this.metrics?.endTime).format(this.customFooterOptions.dateFormat);

    const lastUpdateElm = document.createElement('span');
    lastUpdateElm.className = 'last-update';
    lastUpdateElm.textContent = `${lastUpdateText} ${lastUpdateTimestamp}`;

    const separatorElm = document.createElement('span');
    separatorElm.className = 'separator';
    separatorElm.textContent = ` ${this.customFooterOptions.metricSeparator || ''} `;

    const lastUpdateContainerElm = document.createElement('span');
    lastUpdateContainerElm.appendChild(lastUpdateElm);
    lastUpdateContainerElm.appendChild(separatorElm);

    return lastUpdateContainerElm;
  }

  /** Translate all Custom Footer Texts (footer with metrics) */
  private translateCustomFooterTexts() {
    if (this.translaterService?.translate) {
      this.customFooterOptions.metricTexts = this.customFooterOptions.metricTexts || {};
      for (const propName of Object.keys(this.customFooterOptions.metricTexts)) {
        if (propName.lastIndexOf('Key') > 0) {
          const propNameWithoutKey = propName.substring(0, propName.lastIndexOf('Key'));
          this.customFooterOptions.metricTexts[propNameWithoutKey] = this.translaterService.translate(this.customFooterOptions.metricTexts[propName] || ' ');
        }
      }
    }
  }
}
