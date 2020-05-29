import { Column } from './column.interface';
import { FormatterResultObject } from './formatterResultObject.interface';
import { SlickGrid } from './slickGrid.interface';

export declare type Formatter = (row: number, cell: number, value: any, columnDef?: Column, dataContext?: any, grid?: SlickGrid) => string | FormatterResultObject;
