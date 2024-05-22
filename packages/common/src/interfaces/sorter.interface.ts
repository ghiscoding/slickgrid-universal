import type { Column } from './column.interface';
import type { GridOption } from './gridOption.interface';
import type { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export type SortComparer = (value1: any, value2: any, sortDirection?: SortDirectionNumber, sortColumn?: Column, gridOptions?: GridOption) => number;
