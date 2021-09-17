import { Column } from './column.interface';
import { SlickGrid } from './slickGrid.interface';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => string;
