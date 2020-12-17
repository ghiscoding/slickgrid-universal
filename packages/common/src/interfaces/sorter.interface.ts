import { Column } from './column.interface';
import { GridOption } from './gridOption.interface';
import { SortDirectionNumber } from '../enums/sortDirectionNumber.enum';

export type SortComparer = (value1: any, value2: any, sortDirection: SortDirectionNumber, sortColumn?: Column, gridOptions?: GridOption) => number;
