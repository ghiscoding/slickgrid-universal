import type { Column } from './column.interface.js';
import type { GridOption } from './gridOption.interface.js';
import type { SortDirectionNumber } from '../enums/sortDirectionNumber.enum.js';

export type SortComparer = (value1: any, value2: any, sortDirection?: SortDirectionNumber, sortColumn?: Column, gridOptions?: GridOption) => number;
