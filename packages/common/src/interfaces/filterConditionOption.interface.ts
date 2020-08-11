import { FieldType, OperatorString, SearchTerm } from '../enums/index';

export interface FilterConditionOption {
  dataKey?: string;
  operator: OperatorString;
  cellValue: any;
  cellValueLastChar?: string;
  fieldType: typeof FieldType[keyof typeof FieldType];
  filterSearchType?: typeof FieldType[keyof typeof FieldType];
  searchTerms?: SearchTerm[] | undefined;
}
