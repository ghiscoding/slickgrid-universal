import { HttpClient } from '@angular/common/http';
import { Component, Input, signal, type OnInit } from '@angular/core';
import { TranslateDirective } from '@ngx-translate/core';
import { type GridOption } from '../../library';
import { type SwtCommonGridComponent } from './swt-common-grid.component';
import { Logger } from './swt-logger.service';

/**
 * Custom pagination component: It allows editing the page number manually
 *  << < Page [1] of 5 > >>
 *
 * @author Saber Chebka, saber.chebka@gmail.com
 */
@Component({
  selector: 'swt-common-grid-pagination',
  template: `
    <div class="slick-pagination">
      <div class="slick-pagination-nav">
        <nav aria-label="Page navigation">
          <ul class="pagination">
            <li class="page-item" [class]="pageNumber === 1 ? 'disabled' : ''">
              <a class="page-link icon-seek-first mdi mdi-page-first" aria-label="First" (click)="changeToFirstPage($event)"> </a>
            </li>
            <li class="page-item" [class]="pageNumber === 1 ? 'disabled' : ''">
              <a
                class="page-link icon-seek-prev mdi mdi-chevron-down mdi-rotate-240"
                aria-label="Previous"
                (click)="changeToPreviousPage($event)"
              >
              </a>
            </li>
          </ul>
        </nav>

        <div class="slick-page-number">
          <span [translate]="'PAGE'"></span>
          <input type="text" [value]="pageNumber" size="1" (change)="changeToCurrentPage($event)" />
          <span [translate]="'OF'"></span><span> {{ pageCount }}</span>
        </div>

        <nav aria-label="Page navigation">
          <ul class="pagination">
            <li class="page-item" [class]="pageNumber === pageCount ? 'disabled' : ''">
              <a class="page-link icon-seek-next text-center mdi-chevron-down" aria-label="Next" (click)="changeToNextPage($event)"> </a>
            </li>
            <li class="page-item" [class]="pageNumber === pageCount ? 'disabled' : ''">
              <a class="page-link icon-seek-end mdi mdi-page-last" aria-label="Last" (click)="changeToLastPage($event)"> </a>
            </li>
          </ul>
        </nav>
        <nav>
          <ul class="pagination">
            <li class="">
              <span [hidden]="!processing()" class="page-spin">
                <i class="mdi mdi-sync mdi-spin-1s"></i>
              </span>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `,
  styles: [
    `
      .page-spin {
        border: none;
        height: 32px;
        background-color: transparent;
        cursor: default;
        animation: mdi-sync mdi-spin infinite linear !important;
      }
      .page-spin:hover {
        background-color: transparent;
      }
    `,
  ],
  imports: [TranslateDirective],
})
export class SwtCommonGridPaginationComponent implements OnInit {
  private logger: Logger;

  private _pageCount = signal(1);
  private _pageNumber = signal(1);
  totalItems = 0;
  processing = signal(false);

  @Input()
  set pageCount(val: number) {
    this._pageCount.set(val);
  }
  get pageCount() {
    return this._pageCount();
  }

  @Input()
  set pageNumber(val: number) {
    this._pageNumber.set(val);
  }
  get pageNumber() {
    return this._pageNumber();
  }

  // Reference to the real pagination component
  realPagination = true;
  _gridPaginationOptions!: GridOption;
  commonGrid!: SwtCommonGridComponent;

  @Input()
  set gridPaginationOptions(gridPaginationOptions: GridOption) {
    this._gridPaginationOptions = gridPaginationOptions;

    // The backendServiceApi is itself the SwtCommonGridComponent (This is a hack)
    this.commonGrid = this.gridPaginationOptions!.backendServiceApi!.service as SwtCommonGridComponent;
  }
  get gridPaginationOptions(): GridOption {
    return this._gridPaginationOptions;
  }

  constructor(private httpClient: HttpClient) {
    this.logger = new Logger('grid-pagination', httpClient);
    this.logger.info('method [constructor] - START/END');
  }

  ngOnInit() {
    this.logger.info('init: ');
  }

  changeToFirstPage(event: any) {
    this.logger.info('method [changeToFirstPage] - START/END');
    this._pageNumber.set(1);
    this.onPageChanged(event, this.pageNumber);
  }

  changeToLastPage(event: any) {
    this.logger.info('method [changeToLastPage] - START/END');
    this._pageNumber.set(this.pageCount);
    this.onPageChanged(event, this.pageNumber);
  }

  changeToNextPage(event: any) {
    this.logger.info('method [changeToNextPage] - START/END');
    if (this.pageNumber < this.pageCount) {
      this._pageNumber.set(this.pageNumber + 1);
      this.onPageChanged(event, this.pageNumber);
    }
  }

  changeToPreviousPage(event: any) {
    this.logger.info('method [changeToNextPage] - START/END');
    if (this.pageNumber > 1) {
      this._pageNumber.set(this.pageNumber - 1);
      this.onPageChanged(event, this.pageNumber);
    }
  }

  changeToCurrentPage(event: any) {
    this.logger.info('method [changeToCurrentPage] - START/END');
    let newPage = Number(event.currentTarget.value);
    if (newPage < 1) {
      newPage = 1;
    } else if (newPage > this.pageCount) {
      newPage = this.pageCount;
    }
    this._pageNumber.set(newPage);
    this.onPageChanged(event, this.pageNumber);
  }

  onPageChanged(event?: Event, pageNumber?: number) {
    this.logger.info('method [onPageChanged] - START/END', this.commonGrid);
    this.commonGrid.processOnPaginationChanged(event, { newPage: pageNumber as number, pageSize: -1 });
  }
}
