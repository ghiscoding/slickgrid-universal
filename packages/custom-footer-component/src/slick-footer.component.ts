import { format } from '@formkit/tempo';
import { BindingHelper } from '@slickgrid-universal/binding';
import type {
  CustomFooterOption,
  GridOption,
  Locale,
  Metrics,
  MetricTexts,
  SlickGrid,
  Subscription,
  TranslaterService,
} from '@slickgrid-universal/common';
import { applyHtmlToElement, Constants, createDomElement, SlickEventHandler } from '@slickgrid-universal/common';
import { type BasePubSubService } from '@slickgrid-universal/event-pub-sub';

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
    return this.grid?.getOptions() ?? {};
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

  constructor(
    protected readonly grid: SlickGrid,
    protected readonly customFooterOptions: CustomFooterOption,
    protected readonly pubSubService: BasePubSubService,
    protected readonly translaterService?: TranslaterService | undefined
  ) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid} `;
    this._eventHandler = new SlickEventHandler();
    this._enableTranslate = this.gridOptions?.enableTranslate ?? false;
    this._isLeftFooterOriginallyEmpty = !this.gridOptions.customFooterOptions?.leftFooterText;
    this._isRightFooterOriginallyEmpty = !this.gridOptions.customFooterOptions?.rightFooterText;
    this.registerOnSelectedRowsChangedWhenEnabled(customFooterOptions);

    if (this._enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
      );
    }
    this.translateCustomFooterTexts();

    if (this._enableTranslate && this.pubSubService?.subscribe) {
      const translateEventName = this.translaterService?.eventName ?? 'onLanguageChange';
      this._subscriptions.push(this.pubSubService.subscribe(translateEventName, () => this.translateCustomFooterTexts()));
    }
  }

  dispose(): void {
    // also dispose of all Subscriptions
    this._eventHandler.unsubscribeAll();
    this.pubSubService.unsubscribeAll(this._subscriptions);

    this._bindingHelper.dispose();
    this._footerElement?.remove();
  }

  /**
   * We could optionally display a custom footer below the grid to show some metrics (last update, item count with/without filters)
   * It's an opt-in, user has to enable "showCustomFooter" and it cannot be used when there's already a Pagination since they display the same kind of info
   */
  renderFooter(gridParentContainerElm: HTMLElement): void {
    // execute translation when enabled or use defined text or locale
    this.translateCustomFooterTexts();

    // we create and the custom footer in the DOM but only when there's no Pagination
    this.createFooterContainer(gridParentContainerElm);
  }

  /** Render element attribute values */
  renderMetrics(metrics: Metrics): void {
    // get translated text & last timestamp
    const lastUpdateTimestamp = metrics?.endTime ? format(metrics.endTime, this.customFooterOptions.dateFormat, 'en-US') : '';
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
  renderLeftFooterText(text: string): void {
    this._bindingHelper.setElementAttributeValue('div.left-footer', 'textContent', text);
  }

  /** Render the right side footer text */
  renderRightFooterText(text: string): void {
    this._bindingHelper.setElementAttributeValue('div.right-footer', 'textContent', text);
  }

  /** Translate all Custom Footer Texts (footer with metrics) */
  translateCustomFooterTexts(): void {
    if (this.gridOptions.enableTranslate && this.translaterService?.translate) {
      this.customFooterOptions.metricTexts = this.customFooterOptions.metricTexts || {};
      for (const propName of Object.keys(this.customFooterOptions.metricTexts)) {
        if (propName.lastIndexOf('Key') > 0) {
          const propNameWithoutKey = propName.substring(0, propName.lastIndexOf('Key'));
          this.customFooterOptions.metricTexts[propNameWithoutKey as keyof MetricTexts] = this.translaterService.translate(
            this.customFooterOptions.metricTexts[propName as keyof MetricTexts] || ' '
          );
        }
      }

      // when we're display row selection count on left footer, we also need to translate that text with its count
      if (this._isLeftFooterDisplayingSelectionRowCount) {
        this.leftFooterText = `${this._selectedRowCount} ${this.customFooterOptions.metricTexts!.itemsSelected}`;
      }
    } else if (this.locales) {
      this.customFooterOptions.metricTexts = this.customFooterOptions.metricTexts || {};
      this.customFooterOptions.metricTexts.lastUpdate ||= this.localeOrDefault('TEXT_LAST_UPDATE');
      this.customFooterOptions.metricTexts.items ||= this.localeOrDefault('TEXT_ITEMS');
      this.customFooterOptions.metricTexts.itemsSelected ||= this.localeOrDefault('TEXT_ITEMS_SELECTED');
      this.customFooterOptions.metricTexts.of ||= this.localeOrDefault('TEXT_OF');
    }
  }

  // --
  // protected functions
  // --------------------

  protected localeOrDefault(key: string): string {
    return this.locales[key as keyof Locale] || key;
  }

  /** Create the Footer Container */
  protected createFooterContainer(gridParentContainerElm: HTMLElement): void {
    const footerElm = createDomElement('div', {
      className: `slick-custom-footer ${this.gridUid}`,
      style: {
        width: '100%',
        height: `${this.customFooterOptions.footerHeight || 20}px`,
      },
    });

    const leftFooterElm = createDomElement('div', { className: `left-footer ${this.customFooterOptions.leftContainerClass}` });
    applyHtmlToElement(leftFooterElm, this.customFooterOptions.leftFooterText, this.gridOptions);
    footerElm.appendChild(leftFooterElm);
    footerElm.appendChild(this.createFooterRightContainer());
    this._footerElement = footerElm;

    if (gridParentContainerElm?.appendChild && this._footerElement) {
      gridParentContainerElm.appendChild(this._footerElement);
    }
  }

  /** Create the Right Section Footer */
  protected createFooterRightContainer(): HTMLDivElement {
    const rightFooterElm = createDomElement('div', {
      className: `right-footer ${this.customFooterOptions.rightContainerClass || ''}`,
    });

    if (!this._isRightFooterOriginallyEmpty) {
      applyHtmlToElement(rightFooterElm, this.customFooterOptions.rightFooterText, this.gridOptions);
    } else if (!this.customFooterOptions.hideMetrics) {
      rightFooterElm.classList.add('metrics');
      const lastUpdateElm = createDomElement('span', { className: 'timestamp' }, rightFooterElm);

      if (!this.customFooterOptions.hideLastUpdateTimestamp) {
        const footerLastUpdateElm = this.createFooterLastUpdate();
        if (footerLastUpdateElm) {
          lastUpdateElm.appendChild(footerLastUpdateElm);
        }
      }

      // last update elements
      rightFooterElm.appendChild(createDomElement('span', { className: 'item-count', textContent: `${this.metrics?.itemCount ?? '0'}` }));

      // total count element (unless hidden)
      if (!this.customFooterOptions.hideTotalItemCount) {
        // add carriage return which will add a space before the span
        rightFooterElm.appendChild(document.createTextNode('\r\n'));
        rightFooterElm.appendChild(
          createDomElement('span', { className: 'text-of', textContent: ` ${this.customFooterOptions.metricTexts?.of ?? 'of'} ` })
        );

        // add another carriage return which will add a space after the span
        rightFooterElm.appendChild(document.createTextNode('\r\n'));
        rightFooterElm.appendChild(
          createDomElement('span', { className: 'total-count', textContent: `${this.metrics?.totalItemCount ?? '0'}` })
        );
      }

      // add carriage return which will add a space before the span
      rightFooterElm.appendChild(document.createTextNode('\r\n'));
      rightFooterElm.appendChild(
        createDomElement('span', {
          className: 'text-items',
          textContent: ` ${this.customFooterOptions.metricTexts?.items ?? 'items'} `,
        })
      );
    }

    return rightFooterElm;
  }

  /** Create the Right Section Last Update Timestamp */
  protected createFooterLastUpdate(): HTMLSpanElement {
    // get translated text & last timestamp
    const lastUpdateText = this.customFooterOptions?.metricTexts?.lastUpdate ?? 'Last Update';
    // prettier-ignore
    const lastUpdateTimestamp = this.metrics?.endTime ? format(this.metrics?.endTime, this.customFooterOptions.dateFormat, 'en-US') : '';
    const lastUpdateContainerElm = createDomElement('span');

    lastUpdateContainerElm.appendChild(createDomElement('span', { className: 'text-last-update', textContent: lastUpdateText }));
    lastUpdateContainerElm.appendChild(document.createTextNode('\r\n'));
    lastUpdateContainerElm.appendChild(createDomElement('span', { className: 'last-update-timestamp', textContent: lastUpdateTimestamp }));
    lastUpdateContainerElm.appendChild(
      createDomElement('span', { className: 'separator', textContent: ` ${this.customFooterOptions.metricSeparator || ''} ` })
    );

    return lastUpdateContainerElm;
  }

  /**
   * When user has row selections enabled and does not have any custom text shown on the left side footer,
   * we will show the row selection count on the bottom left side of the footer (by subscribing to the SlickGrid `onSelectedRowsChanged` event).
   * @param customFooterOptions
   */
  protected registerOnSelectedRowsChangedWhenEnabled(customFooterOptions: CustomFooterOption): void {
    const isRowSelectionEnabled =
      this.gridOptions.enableCheckboxSelector || this.gridOptions.enableSelection || this.gridOptions.enableHybridSelection;
    if (isRowSelectionEnabled && customFooterOptions && !customFooterOptions.hideRowSelectionCount && this._isLeftFooterOriginallyEmpty) {
      this._isLeftFooterDisplayingSelectionRowCount = true;
      const selectedCountText = customFooterOptions.metricTexts?.itemsSelected ?? this.localeOrDefault('TEXT_ITEMS_SELECTED');
      customFooterOptions.leftFooterText = `0 ${selectedCountText}`;

      this._eventHandler.subscribe(this.grid.onSelectedRowsChanged, (_e, args) => {
        this._selectedRowCount = args.rows.length;
        const selectedCountText2 = customFooterOptions.metricTexts?.itemsSelected ?? this.localeOrDefault('TEXT_ITEMS_SELECTED');
        this.leftFooterText = `${this._selectedRowCount} ${selectedCountText2}`;
      });
    }
  }
}
