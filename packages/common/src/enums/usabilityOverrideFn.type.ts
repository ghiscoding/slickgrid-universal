import type { SlickGrid } from '../core/index';

export type UsabilityOverrideFn = (row: number, dataContext: any, grid: SlickGrid) => boolean;