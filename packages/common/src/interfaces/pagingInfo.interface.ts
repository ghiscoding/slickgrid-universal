import { SlickDataView } from './slickDataView.interface';

export interface PagingInfo {
  /** Page size number */
  pageSize: number;

  /** Current page number */
  pageNum: number;

  /** Total count of rows in dataset */
  totalRows: number;

  /** Total pages count that pagination has */
  totalPages: number;

  /** DataView object */
  dataView: SlickDataView;
}
