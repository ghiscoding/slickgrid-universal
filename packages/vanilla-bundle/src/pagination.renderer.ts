import { BindingService } from './services/binding.service';
import { PaginationService, SharedService, SlickGrid, ServicePagination } from '@slickgrid-universal/common';
import { EventPubSubService } from './services';

export class PaginationRenderer {
  private _observers: BindingService[] = [];
  private _paginationElement: JQuery<HTMLElement>; // TODO change this to vanilla JS
  currentPagination: ServicePagination;
  firstButtonClasses = '';
  lastButtonClasses = '';
  prevButtonClasses = '';
  nextButtonClasses = '';

  constructor(private paginationService: PaginationService, private pubSubService: EventPubSubService, private sharedService: SharedService) {
    this.currentPagination = this.paginationService.getFullPagination();
    this.pubSubService.subscribe('onPaginationChanged', (paginationChanges: ServicePagination) => {
      console.log('onPaginationChanged', paginationChanges);
      for (const key of Object.keys(paginationChanges)) {
        this.currentPagination[key] = paginationChanges[key];
      }
      // this.currentPagination.pageCount = paginationChanges.pageCount || 0;
      // this.currentPagination.pageNumber = paginationChanges.pageNumber || 0;
      // this.currentPagination.pageSize = paginationChanges.pageSize || 0;
      this.updatePageButtonsUsability();
    });

    // if there's any initial Pagination Presets, let's update the Pagination
    this.pubSubService.subscribe('onPaginationPresetsInitialized', (paginationPresets: ServicePagination) => {
      console.log('onPaginationPresetsInitialized', paginationPresets);
      for (const key of Object.keys(paginationPresets)) {
        this.currentPagination[key] = paginationPresets[key];
      }
      // this.currentPagination.pageCount = paginationPresets.pageCount || 0;
      // this.currentPagination.pageNumber = paginationPresets.pageNumber || 0;
      // this.currentPagination.pageSize = paginationPresets.pageSize;

      this.updatePageButtonsUsability();
    });
  }

  get availablePageSizes(): number[] {
    return this.paginationService.availablePageSizes;
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
    this._observers = [];
    this.paginationService.dispose();
    // firstPageElm.removeEventListener('click', (event: MouseEvent) => console.log('clicked first page', event));
  }

  renderPagination(gridParentContainerElm: HTMLElement) {
    const paginationTemplate = require('./slick-pagination.html');

    if (paginationTemplate) {
      // gridParentContainerElm.append()
      this._paginationElement = $(paginationTemplate);
      this._paginationElement.addClass([this.gridUid, 'pager']);
      this._paginationElement.appendTo(gridParentContainerElm);
    }

    this.addBindings();
    this.addEventListeners();
    this.updatePageButtonsUsability();
  }

  addBindings() {
    // element bindings
    this.addElementBinding(this, 'firstButtonClasses', 'li.page-item.seek-first', 'className');
    this.addElementBinding(this, 'prevButtonClasses', 'li.page-item.seek-prev', 'className');
    this.addElementBinding(this, 'lastButtonClasses', 'li.page-item.seek-end', 'className');
    this.addElementBinding(this, 'nextButtonClasses', 'li.page-item.seek-next', 'className');
    this.addElementBinding(this.currentPagination, 'dataFrom', 'span.item-from', 'textContent');
    this.addElementBinding(this.currentPagination, 'dataTo', 'span.item-to', 'textContent');
    this.addElementBinding(this.currentPagination, 'totalItems', 'span.total-items', 'textContent');
    this.addElementBinding(this.currentPagination, 'pageCount', 'span.page-count', 'textContent');
    this.addElementBinding(this.currentPagination, 'pageNumber', 'input.page-number', 'value', 'change', this.changeToCurrentPage.bind(this));
    this.addElementBinding(this.currentPagination, 'pageSize', 'select.items-per-page', 'value');
  }

  addEventListeners() {
    // element event listeners
    this.bindEventHandler('.icon-seek-first', 'click', this.changeToFirstPage.bind(this));
    this.bindEventHandler('.icon-seek-end', 'click', this.changeToLastPage.bind(this));
    this.bindEventHandler('.icon-seek-next', 'click', this.changeToNextPage.bind(this));
    this.bindEventHandler('.icon-seek-prev', 'click', this.changeToPreviousPage.bind(this));
    this.bindEventHandler('select.items-per-page', 'change', (event: & { target: any }) => this.itemsPerPage = +(event?.target?.value ?? 0));
  }

  changeToFirstPage(event: MouseEvent) {
    if (!this.isLeftPaginationEnabled) {
      this.paginationService.goToFirstPage(event);
    }
  }

  changeToLastPage(event: any) {
    if (!this.isRightPaginationEnabled) {
      this.paginationService.goToLastPage(event);
    }
  }

  changeToNextPage(event: any) {
    if (!this.isRightPaginationEnabled) {
      this.paginationService.goToNextPage(event);
    }
  }

  changeToPreviousPage(event: any) {
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

  addElementBinding(variable: any, property: string, selector: string, attribute: string, events?: string | string[], callback?: (val: any) => any) {
    const elm = document.querySelector<HTMLSpanElement>(`.${this.gridUid} ${selector}`);
    if (elm) {
      // before creating a new observer, first check if the variable already has an associated observer
      // if we can't find an observer then we'll create a new one for it
      let observer = this._observers.find((bind) => bind.property === variable);
      if (!observer) {
        observer = new BindingService({ variable, property });
        if (Array.isArray(events)) {
          for (const eventName of events) {
            observer.bind(elm, attribute, eventName, callback);
          }
        } else {
          observer.bind(elm, attribute, events, callback);
        }
        this._observers.push(observer);
      }
    }
  }

  bindEventHandler(selector: string, eventName: string, callback?: (event: Event) => void) {
    const elm = document.querySelector<HTMLSpanElement>(`.${this.gridUid} ${selector}`);
    if (elm?.addEventListener) {
      elm.addEventListener(eventName, callback);
    }
  }
}
