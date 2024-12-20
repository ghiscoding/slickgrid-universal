import type {
  GridOption,
  Locale,
  BasePaginationComponent,
  PaginationService,
  PubSubService,
  PaginationMetadata,
  SlickGrid,
  Subscription,
  TranslaterService,
} from '@slickgrid-universal/common';
import { Constants, createDomElement, getTranslationPrefix } from '@slickgrid-universal/common';
import { BindingEventService, BindingHelper } from '@slickgrid-universal/binding';

export class SlickPaginationComponent implements BasePaginationComponent {
  protected _bindingHelper: BindingHelper;
  protected _bindingEventService: BindingEventService;
  protected _paginationElement!: HTMLDivElement;
  protected _enableTranslate = false;
  protected _grid!: SlickGrid;
  protected _gridContainerElm?: HTMLElement;
  protected _itemPerPageElm!: HTMLSelectElement;
  protected _spanInfoFromToElm!: HTMLSpanElement;
  protected _seekFirstElm!: HTMLLIElement;
  protected _seekPrevElm!: HTMLLIElement;
  protected _seekNextElm!: HTMLLIElement;
  protected _seekEndElm!: HTMLLIElement;
  protected _subscriptions: Subscription[] = [];
  protected _paginationService!: PaginationService;
  protected _pubSubService!: PubSubService;
  protected _translaterService?: TranslaterService;
  currentPagination = {} as PaginationMetadata;
  firstButtonClasses = '';
  lastButtonClasses = '';
  prevButtonClasses = '';
  nextButtonClasses = '';

  // text translations (handled by i18n or by custom locale)
  textItemsPerPage = 'items per page';
  textItems = 'items';
  textOf = 'of';
  textPage = 'Page';

  constructor() {
    this._bindingHelper = new BindingHelper();
    this._bindingEventService = new BindingEventService();
  }

  get availablePageSizes(): number[] {
    return this._paginationService.availablePageSizes || [];
  }

  get dataFrom(): number {
    return this._paginationService.dataFrom;
  }

  get dataTo(): number {
    return this._paginationService.dataTo;
  }

  get itemsPerPage(): number {
    return this._paginationService.itemsPerPage;
  }
  set itemsPerPage(count: number) {
    this._paginationService.changeItemPerPage(count);
  }

  get pageCount(): number {
    return this._paginationService.pageCount;
  }

  get pageNumber(): number {
    return this._paginationService.pageNumber;
  }

  /** Getter for the Grid Options pulled through the Grid Object */
  get gridOptions(): GridOption {
    return this._grid?.getOptions() ?? {};
  }

  get gridUid(): string {
    return this._grid?.getUID() || '';
  }

  get locales(): Locale {
    // get locales provided by user in main file or else use default English locales via the Constants
    return this.gridOptions?.locales ?? Constants.locales;
  }

  get totalItems(): number {
    return this._paginationService.totalItems;
  }

  get isLeftPaginationDisabled(): boolean {
    return this.pageNumber === 1 || this.totalItems === 0;
  }

  get isRightPaginationDisabled(): boolean {
    return this.pageNumber === this.pageCount || this.totalItems === 0;
  }

  init(
    grid: SlickGrid,
    paginationService: PaginationService,
    pubSubService: PubSubService,
    translaterService?: TranslaterService | undefined
  ): void {
    this._grid = grid;
    this._pubSubService = pubSubService;
    this._translaterService = translaterService;
    this._paginationService = paginationService;
    this.currentPagination = paginationService.getFullPagination();
    this._bindingHelper.querySelectorPrefix = this.gridUid ? `.${this.gridUid} ` : '';
    this._enableTranslate = this.gridOptions?.enableTranslate ?? false;

    if (this._enableTranslate && (!this._translaterService || !this._translaterService.translate)) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
      );
    }
    this.translatePaginationTexts();

    if (this._enableTranslate && this._pubSubService?.subscribe) {
      const translateEventName = this._translaterService?.eventName ?? 'onLanguageChange';
      this._subscriptions.push(this._pubSubService.subscribe(translateEventName, () => this.translatePaginationTexts()));
    }

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object
    this._subscriptions.push(
      this._pubSubService.subscribe<PaginationMetadata>('onPaginationRefreshed', (paginationChanges) => {
        Object.keys(paginationChanges).forEach(
          (key) => ((this.currentPagination as any)[key] = paginationChanges[key as keyof PaginationMetadata])
        );
        this.updatePageButtonsUsability();
        if (this._spanInfoFromToElm?.style) {
          this._spanInfoFromToElm.style.display = this.currentPagination.totalItems === 0 ? 'none' : '';
        }
      }),
      this._pubSubService.subscribe('onPaginationSetCursorBased', () => {
        this.disposeDom(); // recreate pagination component, probably only used for GraphQL E2E tests
        this.renderPagination(this._gridContainerElm!);
      })
    );
  }

  /** dispose of all Subscriptions, DOM element & bindings */
  dispose(): void {
    this._pubSubService.unsubscribeAll(this._subscriptions);
    this.disposeDom();
  }

  /** dispose of the DOM element & bindings only (regular PubSub subscription will be preserved) */
  disposeDom(): void {
    this._bindingEventService.unbindAll();
    this._bindingHelper.dispose();
    this._paginationElement.remove();
  }

  /** render the Pagination in the DOM with all events & bindings */
  renderPagination(containerElm: HTMLElement): void {
    this._gridContainerElm = containerElm;
    const paginationElm = this.createPaginationContainer();
    const divNavContainerElm = createDomElement('div', { className: 'slick-pagination-nav' });

    // left nav
    const leftNavElm = createDomElement('nav', { ariaLabel: 'Page navigation' });
    const leftUlElm = createDomElement('ul', { className: 'pagination' });
    this._seekFirstElm = createDomElement('li', { className: 'page-item seek-first' }, leftUlElm);
    this._seekFirstElm.appendChild(createDomElement('a', { className: 'page-link icon-seek-first', ariaLabel: 'First Page', role: 'button' }));
    this._seekPrevElm = createDomElement('li', { className: 'page-item seek-prev' }, leftUlElm);
    this._seekPrevElm.appendChild(createDomElement('a', { className: 'page-link icon-seek-prev', ariaLabel: 'Previous Page', role: 'button' }));
    leftNavElm.appendChild(leftUlElm);

    const pageNumberSectionElm = this.createPageNumberSection();

    // right nav
    const rightNavElm = createDomElement('nav', { ariaLabel: 'Page navigation' });
    const rightUlElm = createDomElement('ul', { className: 'pagination' });
    this._seekNextElm = createDomElement('li', { className: 'page-item seek-next' }, rightUlElm);
    this._seekNextElm.appendChild(createDomElement('a', { className: 'page-link icon-seek-next', ariaLabel: 'Next Page', role: 'button' }));
    this._seekEndElm = createDomElement('li', { className: 'page-item seek-end' }, rightUlElm);
    this._seekEndElm.appendChild(createDomElement('a', { className: 'page-link icon-seek-end', ariaLabel: 'Last Page', role: 'button' }));
    rightNavElm.appendChild(rightUlElm);

    // append both navs to container
    paginationElm.appendChild(divNavContainerElm);
    divNavContainerElm.appendChild(leftNavElm);
    divNavContainerElm.appendChild(pageNumberSectionElm);
    divNavContainerElm.appendChild(rightNavElm);

    const paginationSettingsElm = this.createPaginationSettingsSection();
    paginationElm.appendChild(divNavContainerElm);
    paginationElm.appendChild(paginationSettingsElm);
    this._paginationElement.appendChild(paginationElm);
    if (containerElm?.appendChild && this._paginationElement) {
      containerElm.appendChild(this._paginationElement);
    }

    this.renderPageSizes();
    this.addBindings();
    this.addEventListeners();
    this.updatePageButtonsUsability();
  }

  /** Render and fill the Page Sizes <select> element */
  renderPageSizes(): void {
    if (this._itemPerPageElm && Array.isArray(this.availablePageSizes)) {
      for (const option of this.availablePageSizes) {
        this._itemPerPageElm.appendChild(createDomElement('option', { value: `${option}`, text: `${option}` }));
      }
    }
  }

  /** Add some DOM Element bindings */
  addBindings(): void {
    this._bindingHelper.addElementBinding(this, 'firstButtonClasses', 'li.page-item.seek-first', 'className');
    this._bindingHelper.addElementBinding(this, 'prevButtonClasses', 'li.page-item.seek-prev', 'className');
    this._bindingHelper.addElementBinding(this, 'lastButtonClasses', 'li.page-item.seek-end', 'className');
    this._bindingHelper.addElementBinding(this, 'nextButtonClasses', 'li.page-item.seek-next', 'className');
    this._bindingHelper.addElementBinding(this.currentPagination, 'dataFrom', 'span.item-from', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'dataTo', 'span.item-to', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'totalItems', 'span.total-items', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageCount', 'span.page-count', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageSize', 'select.items-per-page', 'value');
    this._paginationService.isCursorBased
      ? this._bindingHelper.addElementBinding(this.currentPagination, 'pageNumber', 'span.page-number', 'textContent')
      : this._bindingHelper.addElementBinding(
          this.currentPagination,
          'pageNumber',
          'input.page-number',
          'value',
          'change',
          this.changeToCurrentPage.bind(this)
        );

    // locale text changes
    this._bindingHelper.addElementBinding(this, 'textItems', 'span.text-items', 'textContent');
    this._bindingHelper.addElementBinding(this, 'textItemsPerPage', 'span.text-item-per-page', 'textContent');
    this._bindingHelper.addElementBinding(this, 'textOf', 'span.text-of', 'textContent');
    this._bindingHelper.addElementBinding(this, 'textPage', 'span.text-page', 'textContent');
  }

  /** Add some DOM Element event listeners */
  addEventListeners(): void {
    this._bindingEventService.bind(this._seekFirstElm, 'click', this.changeToFirstPage.bind(this) as EventListener);
    this._bindingEventService.bind(this._seekEndElm, 'click', this.changeToLastPage.bind(this) as EventListener);
    this._bindingEventService.bind(this._seekNextElm, 'click', this.changeToNextPage.bind(this) as EventListener);
    this._bindingEventService.bind(this._seekPrevElm, 'click', this.changeToPreviousPage.bind(this) as EventListener);
    this._bindingEventService.bind(this._itemPerPageElm, 'change', this.updateItemsPerPage.bind(this));
  }

  changeToFirstPage(event: MouseEvent): void {
    if (!this.isLeftPaginationDisabled) {
      this._paginationService.goToFirstPage(event);
    }
  }

  changeToLastPage(event: MouseEvent): void {
    if (!this.isRightPaginationDisabled) {
      this._paginationService.goToLastPage(event);
    }
  }

  changeToNextPage(event: MouseEvent): void {
    if (!this.isRightPaginationDisabled) {
      this._paginationService.goToNextPage(event);
    }
  }

  changeToPreviousPage(event: MouseEvent): void {
    if (!this.isLeftPaginationDisabled) {
      this._paginationService.goToPreviousPage(event);
    }
  }

  changeToCurrentPage(pageNumber: number): void {
    this._paginationService.goToPageNumber(+pageNumber);
  }

  updateItemsPerPage(event: { target: any }): void {
    this.itemsPerPage = +(event?.target?.value ?? 0);
  }

  /** Translate all the texts shown in the UI, use ngx-translate service when available or custom locales when service is null */
  translatePaginationTexts(): void {
    if (this._enableTranslate && this._translaterService?.translate) {
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      this.textItemsPerPage = this._translaterService.translate(`${translationPrefix}ITEMS_PER_PAGE`);
      this.textItems = this._translaterService.translate(`${translationPrefix}ITEMS`);
      this.textOf = this._translaterService.translate(`${translationPrefix}OF`);
      this.textPage = this._translaterService.translate(`${translationPrefix}PAGE`);
    } else if (this.locales) {
      this.textItemsPerPage = this.locales.TEXT_ITEMS_PER_PAGE || 'TEXT_ITEMS_PER_PAGE';
      this.textItems = this.locales.TEXT_ITEMS || 'TEXT_ITEMS';
      this.textOf = this.locales.TEXT_OF || 'TEXT_OF';
      this.textPage = this.locales.TEXT_PAGE || 'TEXT_PAGE';
    }
  }

  // --
  // protected functions
  // --------------------

  /** Create the Pagination Container */
  protected createPaginationContainer(): HTMLDivElement {
    const paginationContainerElm = createDomElement('div', {
      id: 'pager',
      className: `slick-pagination-container ${this.gridUid} pager`,
      style: { width: '100%' },
    });

    const paginationElm = createDomElement('div', { className: 'slick-pagination' });
    paginationContainerElm.appendChild(paginationElm);
    this._paginationElement = paginationContainerElm; // keep internal ref

    return paginationElm;
  }

  protected createPageNumberSection(): HTMLDivElement {
    const divElm = createDomElement('div', { className: 'slick-page-number' });
    createDomElement('span', { className: 'text-page', textContent: 'Page' }, divElm);
    divElm.appendChild(document.createTextNode(' '));
    if (this._paginationService.isCursorBased) {
      // cursor based navigation cannot jump to an arbitrary page. Simply display current page number.
      createDomElement(
        'span',
        {
          className: 'page-number',
          ariaLabel: 'Page Number',
          dataset: { test: 'page-number-label' },
          textContent: '1',
        },
        divElm
      );
    } else {
      // offset based navigation can jump to any page. Allow editing of current page number.
      createDomElement(
        'input',
        {
          type: 'text',
          className: 'form-control page-number',
          ariaLabel: 'Page Number',
          value: '1',
          size: 1,
          dataset: { test: 'page-number-input' },
        },
        divElm
      );
    }

    divElm.appendChild(document.createTextNode(' '));
    createDomElement('span', { className: 'text-of', textContent: 'of' }, divElm);
    divElm.appendChild(document.createTextNode(' '));
    createDomElement('span', { className: 'page-count', dataset: { test: 'page-count' } }, divElm);

    return divElm;
  }

  protected createPaginationSettingsSection(): HTMLSpanElement {
    const spanContainerElm = createDomElement('span', { className: 'slick-pagination-settings' });
    this._itemPerPageElm = createDomElement(
      'select',
      { id: 'items-per-page-label', ariaLabel: 'Items per Page', className: 'items-per-page' },
      spanContainerElm
    );
    spanContainerElm.appendChild(document.createTextNode(' '));
    createDomElement('span', { className: 'text-item-per-page', textContent: 'items per page' }, spanContainerElm);
    spanContainerElm.appendChild(document.createTextNode(', '));

    const spanPaginationCount = createDomElement('span', { className: 'slick-pagination-count' }, spanContainerElm);
    this._spanInfoFromToElm = createDomElement('span', { className: 'page-info-from-to' }, spanPaginationCount);
    createDomElement('span', { className: 'item-from', ariaLabel: 'Page Item From', dataset: { test: 'item-from' } }, this._spanInfoFromToElm);
    this._spanInfoFromToElm.appendChild(document.createTextNode('-'));
    createDomElement('span', { className: 'item-to', ariaLabel: 'Page Item To', dataset: { test: 'item-to' } }, this._spanInfoFromToElm);
    this._spanInfoFromToElm.appendChild(document.createTextNode(' '));
    createDomElement('span', { className: 'text-of', textContent: 'of' }, this._spanInfoFromToElm);
    this._spanInfoFromToElm.appendChild(document.createTextNode(' '));
    const spanInfoTotalElm = createDomElement('span', { className: 'page-info-total-items' }, spanPaginationCount);
    createDomElement('span', { className: 'total-items', ariaLabel: 'Total Items', dataset: { test: 'total-items' } }, spanInfoTotalElm);
    spanInfoTotalElm.appendChild(document.createTextNode(' '));
    createDomElement('span', { className: 'text-items', textContent: 'items' }, spanInfoTotalElm);
    spanInfoTotalElm.appendChild(document.createTextNode(' '));

    return spanContainerElm;
  }

  protected updatePageButtonsUsability(): void {
    this.firstButtonClasses = this.isLeftPaginationDisabled ? 'page-item seek-first disabled' : 'page-item seek-first';
    this.prevButtonClasses = this.isLeftPaginationDisabled ? 'page-item seek-prev disabled' : 'page-item seek-prev';
    this.lastButtonClasses = this.isRightPaginationDisabled ? 'page-item seek-end disabled' : 'page-item seek-end';
    this.nextButtonClasses = this.isRightPaginationDisabled ? 'page-item seek-next disabled' : 'page-item seek-next';
  }
}
