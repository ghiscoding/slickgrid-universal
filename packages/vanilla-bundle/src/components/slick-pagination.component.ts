import {
  Constants,
  getTranslationPrefix,
  GridOption,
  Locale,
  PaginationService,
  SharedService,
  SlickGrid,
  ServicePagination,
  TranslaterService,
  Subscription,
  PubSubService,
} from '@slickgrid-universal/common';
import { BindingHelper } from '../services/binding.helper';

export class SlickPaginationComponent {
  private _bindingHelper: BindingHelper;
  private _paginationElement: HTMLDivElement;
  private _enableTranslate = false;
  private _locales: Locale;
  private _subscriptions: Subscription[] = [];
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

  constructor(private readonly paginationService: PaginationService, private readonly pubSubService: PubSubService, private readonly sharedService: SharedService, private readonly translaterService?: TranslaterService) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid} `;

    this.currentPagination = this.paginationService.getFullPagination();
    this._enableTranslate = this.gridOptions && this.gridOptions.enableTranslate || false;
    this._locales = this.gridOptions && this.gridOptions.locales || Constants.locales;

    if (this._enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }
    this.translatePaginationTexts(this._locales);

    if (this._enableTranslate && this.pubSubService && this.pubSubService.subscribe) {
      this._subscriptions.push(
        this.pubSubService.subscribe('onLanguageChange', () => this.translatePaginationTexts(this._locales))
      );
    }

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object
    this._subscriptions.push(
      this.pubSubService.subscribe('onPaginationRefreshed', (paginationChanges: ServicePagination) => {
        for (const key of Object.keys(paginationChanges)) {
          this.currentPagination[key] = paginationChanges[key];
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
    this.paginationService.dispose();
    this._paginationElement.remove();
  }

  renderPagination(gridParentContainerElm: HTMLElement) {
    const paginationTemplate = require('./slick-pagination.component.html');

    if (paginationTemplate) {
      const temp = document.createElement('div');
      temp.innerHTML = paginationTemplate;
      this._paginationElement = temp.firstChild as HTMLDivElement;
      this._paginationElement.classList.add(this.gridUid, 'pager');
      this._paginationElement.style.width = '100%';

      if (gridParentContainerElm?.appendChild && this._paginationElement) {
        gridParentContainerElm.appendChild(this._paginationElement);
        this.renderPageSizes();
        this.addBindings();
        this.addEventListeners();
        this.updatePageButtonsUsability();
      }
    }
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
    this._bindingHelper.bindEventHandler('.icon-seek-first', 'click', this.changeToFirstPage.bind(this));
    this._bindingHelper.bindEventHandler('.icon-seek-end', 'click', this.changeToLastPage.bind(this));
    this._bindingHelper.bindEventHandler('.icon-seek-next', 'click', this.changeToNextPage.bind(this));
    this._bindingHelper.bindEventHandler('.icon-seek-prev', 'click', this.changeToPreviousPage.bind(this));
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

  // --
  // private functions
  // --------------------

  private updatePageButtonsUsability() {
    this.firstButtonClasses = this.isLeftPaginationDisabled ? 'page-item seek-first disabled' : 'page-item seek-first';
    this.prevButtonClasses = this.isLeftPaginationDisabled ? 'page-item seek-prev disabled' : 'page-item seek-prev';
    this.lastButtonClasses = this.isRightPaginationDisabled ? 'page-item seek-end disabled' : 'page-item seek-end';
    this.nextButtonClasses = this.isRightPaginationDisabled ? 'page-item seek-next disabled' : 'page-item seek-next';
  }

  /** Translate all the texts shown in the UI, use ngx-translate service when available or custom locales when service is null */
  private translatePaginationTexts(locales: Locale) {
    if (this._enableTranslate && this.translaterService?.translate) {
      const translationPrefix = getTranslationPrefix(this.gridOptions);
      this.textItemsPerPage = this.translaterService.translate(`${translationPrefix}ITEMS_PER_PAGE`);
      this.textItems = this.translaterService.translate(`${translationPrefix}ITEMS`);
      this.textOf = this.translaterService.translate(`${translationPrefix}OF`);
      this.textPage = this.translaterService.translate(`${translationPrefix}PAGE`);
    } else if (locales) {
      this.textItemsPerPage = locales.TEXT_ITEMS_PER_PAGE || 'TEXT_ITEMS_PER_PAGE';
      this.textItems = locales.TEXT_ITEMS || 'TEXT_ITEMS';
      this.textOf = locales.TEXT_OF || 'TEXT_OF';
      this.textPage = locales.TEXT_PAGE || 'TEXT_PAGE';
    }
  }
}
