import type { SlickGrid } from '../core/slickGrid.js';
import type { Column } from './index.js';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => string | HTMLElement;
