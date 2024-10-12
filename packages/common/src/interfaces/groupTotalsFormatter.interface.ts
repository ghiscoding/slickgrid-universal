import type { Column } from './index.js';
import type { SlickGrid } from '../core/index.js';

export type GroupTotalsFormatter = (totals: any, columnDef: Column, grid: SlickGrid) => string | HTMLElement;
