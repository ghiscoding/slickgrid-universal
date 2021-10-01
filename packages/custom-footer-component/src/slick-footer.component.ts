import * as moment_ from 'moment-mini';
const moment = (moment_ as any)['default'] || moment_; // patch to fix rollup "moment has no default export" issue, document here https://github.com/rollup/rollup/issues/670

import {
  Constants,
  CustomFooterOption,
  GetSlickEventType,
  GridOption,
  Locale,
  Metrics,
  MetricTexts,
  PubSubService,
  sanitizeTextByAvailableSanitizer,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  Subscription,
  TranslaterService,
} from '@slickgrid-universal/common';
import { BindingHelper } from '@slickgrid-universal/binding';

declare const Slick: SlickNamespace;
export class SlickFooterComponent {
  protected _bindingHelper: BindingHelper;
  protected _enableTranslate = false;
  protected _eventHandler!: SlickEventHandler;
  protected _footerElement!: HTMLDivElement;
  protected _isLeftFooterOriginallyEmpty = true;
  protected _isLeftFooterDisplayingSelectionRowCount = false;
  protected _isRightFooterOriginallyEmpty = true;
  protected _selectedRowCount = 0;
  protected _subscriptions: Subscription[] = [];

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  /** Getter for the grid uid */
  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }
  get gridUidSelector(): string {
    return this.gridUid ? `.${this.gridUid}` : '';
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return (this.grid && this.grid.getOptions) ? this.grid.getOptions() : {};
  }

  get locales(): Locale {
    // get locales provided by user in main file or else use default English locales via the Constants
    return this.gridOptions?.locales ?? Constants.locales;
  }

  set metrics(metrics: Metrics) {
    this.renderMetrics(metrics);
  }

  get leftFooterText(): string {
    return document.querySelector(`.slick-custom-footer${this.gridUidSelector} .left-footer`)?.textContent ?? '';
  }
  set leftFooterText(text: string) {
    this.renderLeftFooterText(text);
  }

  get rightFooterText(): string {
    return document.querySelector(`.slick-custom-footer${this.gridUidSelector} .right-footer`)?.textContent ?? '';
  }
  set rightFooterText(text: string) {
    this.renderRightFooterText(text);
  }

  constructor(protected readonly grid: SlickGrid, protected readonly customFooterOptions: CustomFooterOption, protected readonly pubSubService: PubSubService, protected readonly translaterService?: TranslaterService) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid} `;
    this._eventHandler = new Slick.EventHandler();
    this._enableTranslate = this.gridOptions?.enableTranslate ?? false;
    this._isLeftFooterOriginallyEmpty = !(this.gridOptions.customFooterOptions?.leftFooterText);
    this._isRightFooterOriginallyEmpty = !(this.gridOptions.customFooterOptions?.rightFooterText);
    this.registerOnSelectedRowsChangedWhenEnabled(customFooterOptions);

    if (this._enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }
    this.translateCustomFooterTexts();

    if (this._enableTranslate && this.pubSubService?.subscribe) {
      const translateEventName = this.translaterService?.eventName ?? 'onLanguageChange';
      this._subscriptions.push(
        this.pubSubService.subscribe(translateEventName, () => this.translateCustomFooterTexts())
      );
    }
  }

  dispose() {
    // also dispose of all Subscriptions
    this.pubSubService.unsubscribeAll(this._subscriptions);

    this._bindingHelper.dispose();
    this._footerElement?.remove();
    this._eventHandler.unsubscribeAll();
  }

  /**
   * We could optionally display a custom footer below the grid to show some metrics (last update, item count with/without filters)
   * It's an opt-in, user has to enable "showCustomFooter" and it cannot be used when there's already a Pagination since they display the same kind of info
   */
  renderFooter(gridParentContainerElm: HTMLElement) {
    // execute translation when enabled or use defined text or locale
    this.translateCustomFooterTexts();

    // we create and the custom footer in the DOM but only when there's no Pagination
    this.createFooterContainer(gridParentContainerElm);
  }

  /** Render element attribute values */
  renderMetrics(metrics: Metrics) {
    // get translated text & last timestamp
    const lastUpdateTimestamp = moment(metrics.endTime).format(this.customFooterOptions.dateFormat);
    this._bindingHelper.setElementAttributeValue('span.last-update-timestamp', 'textContent', lastUpdateTimestamp);
    this._bindingHelper.setElementAttributeValue('span.item-count', 'textContent', metrics.itemCount);
    this._bindingHelper.setElementAttributeValue('span.total-count', 'textContent', metrics.totalItemCount);

    // locale text changes
    if (this.customFooterOptions.metricTexts?.lastUpdate) {
      this._bindingHelper.addElementBinding(this.customFooterOptions.metricTexts, 'lastUpdate', 'span.text-last-update', 'textContent');
    }
    this._bindingHelper.addElementBinding(this.customFooterOptions.metricTexts, 'items', 'span.text-items', 'textContent');
    this._bindingHelper.addElementBinding(this.customFooterOptions.metricTexts, 'of', 'span.text-of', 'textContent');
  }

  /** Render the left side footer text */
  renderLeftFooterText(text: string) {
    this._bindingHelper.setElementAttributeValue('div.left-footer', 'textContent', text);
  }

  /** Render the right side footer text */
  renderRightFooterText(text: string) {
    this._bindingHelper.setElementAttributeValue('div.right-footer', 'textContent', text);
  }

  /** Translate all Custom Footer Texts (footer with metrics) */
  translateCustomFooterTexts() {
    if (this.gridOptions.enableTranslate && this.translaterService?.translate) {
      this.customFooterOptions.metricTexts = this.customFooterOptions.metricTexts || {};
      for (const propName of Object.keys(this.customFooterOptions.metricTexts)) {
        if (propName.lastIndexOf('Key') > 0) {
          const propNameWithoutKey = propName.substring(0, propName.lastIndexOf('Key'));
          this.customFooterOptions.metricTexts[propNameWithoutKey as keyof MetricTexts] = this.translaterService.translate(this.customFooterOptions.metricTexts[propName as keyof MetricTexts] || ' ');
        }
      }

      // when we're display row selection count on left footer, we also need to translate that text with its count
      if (this._isLeftFooterDisplayingSelectionRowCount) {
        this.leftFooterText = `${this._selectedRowCount} ${this.customFooterOptions.metricTexts!.itemsSelected}`;
      }
    } else if (this.locales) {
      this.customFooterOptions.metricTexts = this.customFooterOptions.metricTexts || {};
      this.customFooterOptions.metricTexts.lastUpdate = this.customFooterOptions.metricTexts.lastUpdate || this.locales?.TEXT_LAST_UPDATE || 'TEXT_LAST_UPDATE';
      this.customFooterOptions.metricTexts.items = this.customFooterOptions.metricTexts.items || this.locales?.TEXT_ITEMS || 'TEXT_ITEMS';
      this.customFooterOptions.metricTexts.itemsSelected = this.customFooterOptions.metricTexts.itemsSelected || this.locales?.TEXT_ITEMS_SELECTED || 'TEXT_ITEMS_SELECTED';
      this.customFooterOptions.metricTexts.of = this.customFooterOptions.metricTexts.of || this.locales?.TEXT_OF || 'TEXT_OF';
    }
  }

  // --
  // protected functions
  // --------------------

  /** Create the Footer Container */
  protected createFooterContainer(gridParentContainerElm: HTMLElement) {
    const footerElm = document.createElement('div');
    footerElm.className = `slick-custom-footer ${this.gridUid}`;
    footerElm.style.width = '100%';
    footerElm.style.height = `${this.customFooterOptions.footerHeight || 20}px`;

    const leftFooterElm = document.createElement('div');
    leftFooterElm.className = `left-footer ${this.customFooterOptions.leftContainerClass}`;
    leftFooterElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, this.customFooterOptions.leftFooterText || '');

    const rightFooterElm = this.createFooterRightContainer();

    footerElm.appendChild(leftFooterElm);
    footerElm.appendChild(rightFooterElm);
    this._footerElement = footerElm;

    if (gridParentContainerElm?.appendChild && this._footerElement) {
      gridParentContainerElm.appendChild(this._footerElement);
    }
  }

  /** Create the Right Section Footer */
  protected createFooterRightContainer(): HTMLDivElement {
    const rightFooterElm = document.createElement('div');
    rightFooterElm.className = `right-footer ${this.customFooterOptions.rightContainerClass || ''}`;

    if (!this._isRightFooterOriginallyEmpty) {
      rightFooterElm.innerHTML = sanitizeTextByAvailableSanitizer(this.gridOptions, this.customFooterOptions.rightFooterText || '');
    } else if (!this.customFooterOptions.hideMetrics) {
      rightFooterElm.classList.add('metrics');
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
        // add carriage return which will add a space before the span
        rightFooterElm.appendChild(document.createTextNode('\r\n'));

        const textOfElm = document.createElement('span');
        textOfElm.className = 'text-of';
        textOfElm.textContent = ` ${this.customFooterOptions.metricTexts?.of ?? 'of'} `;
        rightFooterElm.appendChild(textOfElm);

        // add another carriage return which will add a space after the span
        rightFooterElm.appendChild(document.createTextNode('\r\n'));

        const totalCountElm = document.createElement('span');
        totalCountElm.className = 'total-count';
        totalCountElm.textContent = `${this.metrics?.totalItemCount ?? '0'}`;

        rightFooterElm.appendChild(totalCountElm);
      }

      // add carriage return which will add a space before the span
      rightFooterElm.appendChild(document.createTextNode('\r\n'));

      const textItemsElm = document.createElement('span');
      textItemsElm.className = 'text-items';
      textItemsElm.textContent = ` ${this.customFooterOptions.metricTexts?.items ?? 'items'} `;
      rightFooterElm.appendChild(textItemsElm);
    }

    return rightFooterElm;
  }

  /** Create the Right Section Last Update Timestamp */
  protected createFooterLastUpdate(): HTMLSpanElement {
    // get translated text & last timestamp
    const lastUpdateText = this.customFooterOptions?.metricTexts?.lastUpdate ?? 'Last Update';
    const lastUpdateTimestamp = moment(this.metrics?.endTime).format(this.customFooterOptions.dateFormat);

    const lastUpdateElm = document.createElement('span');
    lastUpdateElm.className = 'text-last-update';
    lastUpdateElm.textContent = lastUpdateText;

    const lastUpdateTimestampElm = document.createElement('span');
    lastUpdateTimestampElm.className = 'last-update-timestamp';
    lastUpdateTimestampElm.textContent = lastUpdateTimestamp;

    const separatorElm = document.createElement('span');
    separatorElm.className = 'separator';
    separatorElm.textContent = ` ${this.customFooterOptions.metricSeparator || ''} `;

    const lastUpdateContainerElm = document.createElement('span');
    lastUpdateContainerElm.appendChild(lastUpdateElm);
    lastUpdateContainerElm.appendChild(document.createTextNode('\r\n'));
    lastUpdateContainerElm.appendChild(lastUpdateTimestampElm);
    lastUpdateContainerElm.appendChild(separatorElm);

    return lastUpdateContainerElm;
  }

  /**
   * When user has row selections enabled and does not have any custom text shown on the left side footer,
   * we will show the row selection count on the bottom left side of the footer (by subscribing to the SlickGrid `onSelectedRowsChanged` event).
   * @param customFooterOptions
   */
  protected registerOnSelectedRowsChangedWhenEnabled(customFooterOptions: CustomFooterOption) {
    const isRowSelectionEnabled = this.gridOptions.enableCheckboxSelector || this.gridOptions.enableRowSelection;
    if (isRowSelectionEnabled && customFooterOptions && (!customFooterOptions.hideRowSelectionCount && this._isLeftFooterOriginallyEmpty)) {
      this._isLeftFooterDisplayingSelectionRowCount = true;
      const selectedCountText = customFooterOptions.metricTexts?.itemsSelected ?? this.locales?.TEXT_ITEMS_SELECTED ?? 'TEXT_ITEMS_SELECTED';
      customFooterOptions.leftFooterText = `0 ${selectedCountText}`;

      const onSelectedRowsChangedHandler = this.grid.onSelectedRowsChanged;
      (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onSelectedRowsChangedHandler>>).subscribe(onSelectedRowsChangedHandler, (_e, args) => {
        this._selectedRowCount = args.rows.length;
        const selectedCountText2 = customFooterOptions.metricTexts?.itemsSelected ?? this.locales?.TEXT_ITEMS_SELECTED ?? 'TEXT_ITEMS_SELECTED';
        this.leftFooterText = `${this._selectedRowCount} ${selectedCountText2}`;
      });
    }
  }
}
