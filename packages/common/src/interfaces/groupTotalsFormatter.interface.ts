import type { Column } from './index';
import type { SlickGrid } from '../core/index';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => string | HTMLElement;
