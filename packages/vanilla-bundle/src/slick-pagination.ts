import { BindingHelper } from './services/binding.helper';
import { PaginationService, SharedService, SlickGrid, ServicePagination } from '@slickgrid-universal/common';
import { EventPubSubService } from './services';

export class SlickPaginationComponent {
  private _bindingHelper: BindingHelper;
  private _paginationElement: HTMLDivElement;
  currentPagination: ServicePagination;
  firstButtonClasses = '';
  lastButtonClasses = '';
  prevButtonClasses = '';
  nextButtonClasses = '';

  constructor(private paginationService: PaginationService, private pubSubService: EventPubSubService, private sharedService: SharedService) {
    this._bindingHelper = new BindingHelper();
    this._bindingHelper.querySelectorPrefix = `.${this.gridUid}`;

    this.currentPagination = this.paginationService.getFullPagination();

    // Anytime the pagination is initialized or has changes,
    // we'll copy the data into a local object so that we can add binding to this local object

    this.pubSubService.subscribe('onPaginationRefreshed', (paginationChanges: ServicePagination) => {
      for (const key of Object.keys(paginationChanges)) {
        this.currentPagination[key] = paginationChanges[key];
      }
      this.updatePageButtonsUsability();
    });
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
  set pageNumber(page: number) {
    // the setter has to be declared but we won't use it, instead we will use the "changeToCurrentPage()" to only update the value after ENTER keydown event
  }

  get grid(): SlickGrid {
    return this.sharedService.grid;
  }

  get gridUid(): string {
    return this.grid?.getUID() ?? '';
  }

  get totalItems() {
    return this.paginationService.totalItems;
  }

  get isLeftPaginationEnabled(): boolean {
    return this.pageNumber === 1 || this.totalItems === 0;
  }

  get isRightPaginationEnabled(): boolean {
    return this.pageNumber === this.pageCount || this.totalItems === 0;
  }

  dispose() {
    this.paginationService.dispose();
    this._bindingHelper.dispose();
    this._paginationElement.remove();
  }

  renderPagination(gridParentContainerElm: HTMLElement) {
    const paginationTemplate = require('./slick-pagination.html');

    if (paginationTemplate) {
      const temp = document.createElement('div');
      temp.innerHTML = paginationTemplate;
      this._paginationElement = temp.firstChild as HTMLDivElement;
      this._paginationElement.classList.add(this.gridUid, 'pager');

      if (gridParentContainerElm && this._paginationElement) {
        gridParentContainerElm.append(this._paginationElement);
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
    if (Array.isArray(this.availablePageSizes)) {
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
    if (!this.isLeftPaginationEnabled) {
      this.paginationService.goToFirstPage(event);
    }
  }

  changeToLastPage(event: MouseEvent) {
    if (!this.isRightPaginationEnabled) {
      this.paginationService.goToLastPage(event);
    }
  }

  changeToNextPage(event: MouseEvent) {
    if (!this.isRightPaginationEnabled) {
      this.paginationService.goToNextPage(event);
    }
  }

  changeToPreviousPage(event: MouseEvent) {
    if (!this.isLeftPaginationEnabled) {
      this.paginationService.goToPreviousPage(event);
    }
  }

  changeToCurrentPage(pageNumber: number) {
    this.paginationService.goToPageNumber(+pageNumber);
  }

  private updatePageButtonsUsability() {
    this.firstButtonClasses = this.isLeftPaginationEnabled ? 'page-item seek-first disabled' : 'page-item seek-first';
    this.prevButtonClasses = this.isLeftPaginationEnabled ? 'page-item seek-prev disabled' : 'page-item seek-prev';
    this.lastButtonClasses = this.isRightPaginationEnabled ? 'page-item seek-end disabled' : 'page-item seek-end';
    this.nextButtonClasses = this.isRightPaginationEnabled ? 'page-item seek-next disabled' : 'page-item seek-next';
  }
}
