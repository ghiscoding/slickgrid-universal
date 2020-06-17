import { BindingService } from './services/binding.service';
import { PaginationService, SharedService, SlickGrid } from '@slickgrid-universal/common';

export class PaginationRenderer {
  private _observers: BindingService[] = [];
  private _paginationElement: JQuery<HTMLElement>;

  constructor(private paginationService: PaginationService, private sharedService: SharedService) { }

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

  dispose() {
    this._observers = [];
    this.paginationService.dispose();
    // const firstPageElm = document.querySelector<HTMLButtonElement>('.icon-seek-first');
    // firstPageElm.removeEventListener('click', (event: MouseEvent) => console.log('clicked first page', event));
  }

  renderPagination(gridParentContainerElm: HTMLElement) {
    const paginationTemplate = require('./slick-pagination.html');

    if (paginationTemplate) {
      this._paginationElement = $(paginationTemplate);
      this._paginationElement.addClass([this.gridUid, 'pager']);
      this._paginationElement.appendTo(gridParentContainerElm);
    }

    this.addBindings();
  }

  addBindings() {
    const firstPageElm = document.querySelector<HTMLButtonElement>(`.${this.gridUid} .icon-seek-first`);
    const prevPageElm = document.querySelector<HTMLButtonElement>(`.${this.gridUid} .icon-seek-prev`);
    const nextPageElm = document.querySelector<HTMLButtonElement>(`.${this.gridUid} .icon-seek-next`);
    const lastPageElm = document.querySelector<HTMLButtonElement>(`.${this.gridUid} .icon-seek-end`);
    if (firstPageElm?.addEventListener) {
      firstPageElm.addEventListener('click', this.changeToFirstPage.bind(this));
      firstPageElm.disabled = true;
    }
    if (prevPageElm?.addEventListener) {
      prevPageElm.addEventListener('click', this.changeToPreviousPage.bind(this));
    }
    if (nextPageElm?.addEventListener) {
      nextPageElm.addEventListener('click', this.changeToNextPage.bind(this));
    }
    if (lastPageElm?.addEventListener) {
      lastPageElm.addEventListener('click', this.changeToLastPage.bind(this));
    }
    // let observer = this._observers.find((bind) => bind.property === variableName);
    // if (!observer) {
    //   observer = new BindingService({ variable: window[this._className], property: variableName });
    //   this._observers.push(observer);
    // }
  }

  changeToFirstPage(event: MouseEvent) {
    console.log('clicked first page');
    this.paginationService.goToFirstPage(event);
  }

  changeToLastPage(event: any) {
    console.log('clicked last page');
    this.paginationService.goToLastPage(event);
  }

  changeToNextPage(event: any) {
    console.log('clicked next page');
    this.paginationService.goToNextPage(event);
  }

  changeToPreviousPage(event: any) {
    console.log('clicked previous page');
    this.paginationService.goToPreviousPage(event);
  }

  changeToCurrentPage(event: any) {
    let pageNumber = 1;
    if (event && event.target && event.target.value) {
      pageNumber = +(event.target.value);
    }
    this.paginationService.goToPageNumber(pageNumber, event);
  }
}
