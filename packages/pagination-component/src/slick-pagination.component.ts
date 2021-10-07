import {
  Constants,
  getTranslationPrefix,
  GridOption,
  Locale,
  PaginationService,
  PubSubService,
  ServicePagination,
  SharedService,
  SlickGrid,
  Subscription,
  TranslaterService,
} from '@slickgrid-universal/common';
import { BindingHelper } from '@slickgrid-universal/binding';

export class SlickPaginationComponent {
  protected _bindingHelper: BindingHelper;
  protected _paginationElement!: HTMLDivElement;
  protected _enableTranslate = false;
  protected _subscriptions: Subscription[] = [];
  currentPagination: ServicePagination;
  firstButtonClasses = '';
  lastButtonClasses = '';
  prevButtonClasses = '';
  nextButtonClasses = '';

  // text translations (handled by i18n or by custom locale)
  textItemsPerPage = 'items per page';
  textItems = 'items';
  textOf = 'of';
  textPage = 'Page';

  constructor(protected readonly paginationService: PaginationService, protected readonly pubSubService: PubSubService, protected readonly sharedService: SharedService, protected readonly translaterService?: TranslaterService) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid} `;

    this.currentPagination = this.paginationService.getFullPagination();
    this._enableTranslate = this.gridOptions?.enableTranslate ?? false;

    if (this._enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }
    this.translatePaginationTexts();

    if (this._enableTranslate && this.pubSubService?.subscribe) {
      const translateEventName = this.translaterService?.eventName ?? 'onLanguageChange';
      this._subscriptions.push(
        this.pubSubService.subscribe(translateEventName, () => this.translatePaginationTexts())
      );
    }

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object
    this._subscriptions.push(
      this.pubSubService.subscribe('onPaginationRefreshed', (paginationChanges: ServicePagination) => {
        for (const key of Object.keys(paginationChanges)) {
          (this.currentPagination as any)[key] = (paginationChanges as any)[key];
        }
        this.updatePageButtonsUsability();
        const pageFromToElm = document.querySelector<HTMLSpanElement>(`.${this.gridUid} span.page-info-from-to`);
        if (pageFromToElm?.style) {
          pageFromToElm.style.display = (this.currentPagination.totalItems === 0) ? 'none' : '';
        }
      })
    );
  }

  get availablePageSizes(): number[] {
    return this.paginationService.availablePageSizes || [];
  }

  get dataFrom(): number {
    return this.paginationService.dataFrom;
  }

  get dataTo(): number {
    return this.paginationService.dataTo;
  }

  get itemsPerPage(): number {
    return this.paginationService.itemsPerPage;
  }
  set itemsPerPage(count: number) {
    this.paginationService.changeItemPerPage(count);
  }

  get pageCount(): number {
    return this.paginationService.pageCount;
  }

  get pageNumber(): number {
    return this.paginationService.pageNumber;
  }
  set pageNumber(_page: number) {
    // the setter has to be declared but we won't use it, instead we will use the "changeToCurrentPage()" to only update the value after ENTER keydown event
  }

  get grid(): SlickGrid {
    return this.sharedService.slickGrid;
  }

  get gridOptions(): GridOption {
    return this.sharedService.gridOptions;
  }

  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }

  get locales(): Locale {
    // get locales provided by user in main file or else use default English locales via the Constants
    return this.gridOptions?.locales ?? Constants.locales;
  }

  get totalItems() {
    return this.paginationService.totalItems;
  }

  get isLeftPaginationDisabled(): boolean {
    return this.pageNumber === 1 || this.totalItems === 0;
  }

  get isRightPaginationDisabled(): boolean {
    return this.pageNumber === this.pageCount || this.totalItems === 0;
  }

  dispose() {
    // also dispose of all Subscriptions
    this.pubSubService.unsubscribeAll(this._subscriptions);

    this._bindingHelper.dispose();
    this._paginationElement.remove();
  }

  renderPagination(gridParentContainerElm: HTMLElement) {
    const paginationElm = this.createPaginationContainer();
    const divNavContainerElm = document.createElement('div');
    divNavContainerElm.className = 'slick-pagination-nav';
    const leftNavigationElm = this.createPageNavigation('Page navigation', [
      { liClass: 'page-item seek-first', aClass: 'page-link icon-seek-first', ariaLabel: 'First Page' },
      { liClass: 'page-item seek-prev', aClass: 'page-link icon-seek-prev', ariaLabel: 'Previous Page' },
    ]);
    const pageNumberSectionElm = this.createPageNumberSection();
    const rightNavigationElm = this.createPageNavigation('Page navigation', [
      { liClass: 'page-item seek-next', aClass: 'page-link icon-seek-next', ariaLabel: 'Next Page' },
      { liClass: 'page-item seek-end', aClass: 'page-link icon-seek-end', ariaLabel: 'Last Page' },
    ]);
    paginationElm.appendChild(divNavContainerElm);
    divNavContainerElm.appendChild(leftNavigationElm);
    divNavContainerElm.appendChild(pageNumberSectionElm);
    divNavContainerElm.appendChild(rightNavigationElm);

    const paginationSettingsElm = this.createPaginationSettingsSection();
    paginationElm.appendChild(divNavContainerElm);
    paginationElm.appendChild(paginationSettingsElm);
    this._paginationElement.appendChild(paginationElm);
    if (gridParentContainerElm?.appendChild && this._paginationElement) {
      gridParentContainerElm.appendChild(this._paginationElement);
    }

    this.renderPageSizes();
    this.addBindings();
    this.addEventListeners();
    this.updatePageButtonsUsability();
  }

  /** Render and fill the Page Sizes <select> element */
  renderPageSizes() {
    const selectElm = document.querySelector<HTMLSelectElement>(`.${this.gridUid} .items-per-page`);
    if (selectElm && Array.isArray(this.availablePageSizes)) {
      for (const option of this.availablePageSizes) {
        const opt = document.createElement('option');
        opt.value = `${option}`;
        opt.text = `${option}`;
        selectElm.appendChild(opt);
      }
    }
  }

  /** Add some DOM Element bindings */
  addBindings() {
    this._bindingHelper.addElementBinding(this, 'firstButtonClasses', 'li.page-item.seek-first', 'className');
    this._bindingHelper.addElementBinding(this, 'prevButtonClasses', 'li.page-item.seek-prev', 'className');
    this._bindingHelper.addElementBinding(this, 'lastButtonClasses', 'li.page-item.seek-end', 'className');
    this._bindingHelper.addElementBinding(this, 'nextButtonClasses', 'li.page-item.seek-next', 'className');
    this._bindingHelper.addElementBinding(this.currentPagination, 'dataFrom', 'span.item-from', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'dataTo', 'span.item-to', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'totalItems', 'span.total-items', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageCount', 'span.page-count', 'textContent');
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageNumber', 'input.page-number', 'value', 'change', this.changeToCurrentPage.bind(this));
    this._bindingHelper.addElementBinding(this.currentPagination, 'pageSize', 'select.items-per-page', 'value');

    // locale text changes
    this._bindingHelper.addElementBinding(this, 'textItems', 'span.text-items', 'textContent');
    this._bindingHelper.addElementBinding(this, 'textItemsPerPage', 'span.text-item-per-page', 'textContent');
    this._bindingHelper.addElementBinding(this, 'textOf', 'span.text-of', 'textContent');
    this._bindingHelper.addElementBinding(this, 'textPage', 'span.text-page', 'textContent');
  }

  /** Add some DOM Element event listeners */
  addEventListeners() {
    this._bindingHelper.bindEventHandler('.icon-seek-first', 'click', this.changeToFirstPage.bind(this) as EventListener);
    this._bindingHelper.bindEventHandler('.icon-seek-end', 'click', this.changeToLastPage.bind(this) as EventListener);
    this._bindingHelper.bindEventHandler('.icon-seek-next', 'click', this.changeToNextPage.bind(this) as EventListener);
    this._bindingHelper.bindEventHandler('.icon-seek-prev', 'click', this.changeToPreviousPage.bind(this) as EventListener);
    this._bindingHelper.bindEventHandler('select.items-per-page', 'change', (event: & { target: any }) => this.itemsPerPage = +(event?.target?.value ?? 0));
  }

  changeToFirstPage(event: MouseEvent) {
    if (!this.isLeftPaginationDisabled) {
      this.paginationService.goToFirstPage(event);
    }
  }

  changeToLastPage(event: MouseEvent) {
    if (!this.isRightPaginationDisabled) {
      this.paginationService.goToLastPage(event);
    }
  }

  changeToNextPage(event: MouseEvent) {
    if (!this.isRightPaginationDisabled) {
      this.paginationService.goToNextPage(event);
    }
  }

  changeToPreviousPage(event: MouseEvent) {
    if (!this.isLeftPaginationDisabled) {
      this.paginationService.goToPreviousPage(event);
    }
  }

  changeToCurrentPage(pageNumber: number) {
    this.paginationService.goToPageNumber(+pageNumber);
  }

  /** Translate all the texts shown in the UI, use ngx-translate service when available or custom locales when service is null */
  translatePaginationTexts() {
    if (this._enableTranslate && this.translaterService?.translate) {
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      this.textItemsPerPage = this.translaterService.translate(`${translationPrefix}ITEMS_PER_PAGE`);
      this.textItems = this.translaterService.translate(`${translationPrefix}ITEMS`);
      this.textOf = this.translaterService.translate(`${translationPrefix}OF`);
      this.textPage = this.translaterService.translate(`${translationPrefix}PAGE`);
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
  protected createPaginationContainer() {
    const paginationContainerElm = document.createElement('div');
    paginationContainerElm.className = `slick-pagination-container ${this.gridUid} pager`;
    paginationContainerElm.id = 'pager';
    paginationContainerElm.style.width = '100%';

    const paginationElm = document.createElement('div');
    paginationElm.className = 'slick-pagination';
    paginationContainerElm.appendChild(paginationElm);
    this._paginationElement = paginationContainerElm; // keep internal ref

    return paginationElm;
  }

  protected createPageNavigation(navAriaLabel: string, liElements: Array<{ liClass: string, aClass: string, ariaLabel: string }>) {
    const navElm = document.createElement('nav');
    navElm.ariaLabel = navAriaLabel;
    const ulElm = document.createElement('ul');
    ulElm.className = 'pagination';

    for (const li of liElements) {
      const liElm = document.createElement('li');
      liElm.className = li.liClass;
      const aElm = document.createElement('a');
      aElm.className = li.aClass;
      aElm.setAttribute('aria-label', li.ariaLabel);
      liElm.appendChild(aElm);
      ulElm.appendChild(liElm);
    }
    navElm.appendChild(ulElm);

    return navElm;
  }

  protected createPageNumberSection() {
    const divElm = document.createElement('div');
    divElm.className = 'slick-page-number';
    const spanTextPageElm = document.createElement('span');
    spanTextPageElm.className = 'text-page';
    spanTextPageElm.textContent = 'Page';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control page-number';
    input.dataset.test = 'page-number-input';
    input.setAttribute('aria-label', 'Page Number');
    input.value = '1';
    input.size = 1;
    const spanTextOfElm = document.createElement('span');
    spanTextOfElm.className = 'text-of';
    spanTextOfElm.textContent = 'of';
    const spanPageCountElm = document.createElement('span');
    spanPageCountElm.className = 'page-count';
    spanPageCountElm.dataset.test = 'page-count';
    divElm.appendChild(spanTextPageElm);
    divElm.appendChild(document.createTextNode(' '));
    divElm.appendChild(input);
    divElm.appendChild(document.createTextNode(' '));
    divElm.appendChild(spanTextOfElm);
    divElm.appendChild(document.createTextNode(' '));
    divElm.appendChild(spanPageCountElm);

    return divElm;
  }

  protected createPaginationSettingsSection() {
    const spanContainerElm = document.createElement('span');
    spanContainerElm.className = 'slick-pagination-settings';
    const selectElm = document.createElement('select');
    selectElm.id = 'items-per-page-label';
    selectElm.className = 'items-per-page';
    selectElm.setAttribute('aria-label', 'Items per Page Select');
    const spanItemPerPageElm = document.createElement('span');
    spanItemPerPageElm.className = 'text-item-per-page';
    spanItemPerPageElm.textContent = 'items per page';
    const spanPaginationCount = document.createElement('span');
    spanPaginationCount.className = 'slick-pagination-count';
    const spanInfoFromToElm = document.createElement('span');
    spanInfoFromToElm.className = 'page-info-from-to';
    const spanItemFromElm = document.createElement('span');
    spanItemFromElm.className = 'item-from';
    spanItemFromElm.dataset.test = 'item-from';
    spanItemFromElm.setAttribute('aria-label', 'Page Item From');
    const spanItemToElm = document.createElement('span');
    spanItemToElm.className = 'item-to';
    spanItemToElm.dataset.test = 'item-to';
    spanItemToElm.setAttribute('aria-label', 'Page Item To');
    const spanOfElm = document.createElement('span');
    spanOfElm.className = 'text-of';
    spanOfElm.textContent = 'of';
    const spanInfoTotalElm = document.createElement('span');
    spanInfoTotalElm.className = 'page-info-total-items';
    const spanTotalItem = document.createElement('span');
    spanTotalItem.className = 'total-items';
    spanTotalItem.dataset.test = 'total-items';
    const spanTextItemsElm = document.createElement('span');
    spanTextItemsElm.className = 'text-items';
    spanTextItemsElm.textContent = 'items';

    spanContainerElm.appendChild(selectElm);
    spanContainerElm.appendChild(document.createTextNode(' '));
    spanContainerElm.appendChild(spanItemPerPageElm);
    spanContainerElm.appendChild(document.createTextNode(', '));
    spanInfoFromToElm.appendChild(spanItemFromElm);
    spanInfoFromToElm.appendChild(document.createTextNode('-'));
    spanInfoFromToElm.appendChild(spanItemToElm);
    spanInfoFromToElm.appendChild(document.createTextNode(' '));
    spanInfoFromToElm.appendChild(spanOfElm);
    spanInfoFromToElm.appendChild(document.createTextNode(' '));
    spanPaginationCount.appendChild(spanInfoFromToElm);
    spanContainerElm.appendChild(spanPaginationCount);
    spanInfoTotalElm.appendChild(spanTotalItem);
    spanInfoTotalElm.appendChild(document.createTextNode(' '));
    spanInfoTotalElm.appendChild(spanTextItemsElm);
    spanInfoTotalElm.appendChild(document.createTextNode(' '));
    spanPaginationCount.appendChild(spanInfoTotalElm);

    return spanContainerElm;
  }

  protected updatePageButtonsUsability() {
    this.firstButtonClasses = this.isLeftPaginationDisabled ? 'page-item seek-first disabled' : 'page-item seek-first';
    this.prevButtonClasses = this.isLeftPaginationDisabled ? 'page-item seek-prev disabled' : 'page-item seek-prev';
    this.lastButtonClasses = this.isRightPaginationDisabled ? 'page-item seek-end disabled' : 'page-item seek-end';
    this.nextButtonClasses = this.isRightPaginationDisabled ? 'page-item seek-next disabled' : 'page-item seek-next';
  }
}
