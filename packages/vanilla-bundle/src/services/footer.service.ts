import * as moment_ from 'moment-mini';
const moment = moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import { Constants, CustomFooterOption, GridOption, Locale, Metrics, SharedService, TranslaterService } from '@slickgrid-universal/common';

export class FooterService {
  showCustomFooter = false;
  customFooterOptions: CustomFooterOption;
  metrics: Metrics;

  constructor(private sharedService: SharedService, private translaterService?: TranslaterService) { }

  get gridOptions(): GridOption {
    return this.sharedService?.gridOptions || {};
  }

  get locales(): Locale {
    // get locales provided by user in main file or else use default English locales via the Constants
    return this.sharedService.gridOptions && this.sharedService.gridOptions.locales || Constants.locales;
  }

  /**
   * We could optionally display a custom footer below the grid to show some metrics (last update, item count with/without filters)
   * It's an opt-in, user has to enable "showCustomFooter" and it cannot be used when there's already a Pagination since they display the same kind of info
   */
  optionallyShowCustomFooterWithMetrics(metrics: Metrics): any | null {
    if (this.gridOptions) {
      this.metrics = metrics;
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
      if (!this.gridOptions.enablePagination) {
        this.showCustomFooter = this.gridOptions.hasOwnProperty('showCustomFooter') ? (this.gridOptions.showCustomFooter as boolean) : false;
        this.customFooterOptions = this.gridOptions.customFooterOptions || {};
        if (this.showCustomFooter) {
          return $(this.renderFooter());
        }
      }
    }
    return null;
  }

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

  renderFooter() {
    return `<div class="slick-custom-footer row" style="width: 100%;" css="height: ${this.customFooterOptions.footerHeight || 20}px">
        <div class="left-footer ${this.customFooterOptions.leftContainerClass}">
          ${this.customFooterOptions.leftFooterText || ''}
        </div>
        <span class="metrics">${(this.metrics && !this.customFooterOptions.hideMetrics) ? this.renderFooterRightContainer() : ''}</span>
      </div>`.trim();
  }

  renderFooterRightContainer(): string {
    return `<div class="right-footer metrics ${this.customFooterOptions.rightContainerClass}">
      <!-- last update -->
      <span class="last-update">${this.customFooterOptions.hideLastUpdateTimestamp ? '' : this.renderFooterLastUpdate()}</span>
      <span class="item-count">${this.metrics?.itemCount}</span>

      <!-- total count -->
      ${this.customFooterOptions.hideTotalItemCount ? '' : this.renderFooterTotalCount()}
      ${this.customFooterOptions.metricTexts?.items || ''}
    </div>`.trim();
  }

  renderFooterTotalCount(): string {
    return `${this.customFooterOptions.metricTexts?.of || ''} <span class="total-count">${this.metrics.totalItemCount}</span>`;
  }

  renderFooterLastUpdate(): string {
    return `<span>${this.customFooterOptions.metricTexts?.lastUpdate || ''}</span>
      <span class="last-update">${moment(this.metrics.endTime).format(this.customFooterOptions.dateFormat)}</span>
      <span class="separator">${this.customFooterOptions.metricSeparator}</span>`.trim();
  }
}
