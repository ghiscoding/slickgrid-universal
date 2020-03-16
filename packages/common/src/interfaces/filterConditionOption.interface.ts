import { FieldType, OperatorString, SearchTerm } from '../enums/index';

export interface FilterConditionOption {
  dataKey?: string;
  operator: OperatorString;
  cellValue: any;
  cellValueLastChar?: string;
  fieldType: FieldType;
  filterSearchType?: FieldType;
  searchTerms?: SearchTerm[] | undefined;
}
