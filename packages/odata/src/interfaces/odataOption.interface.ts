import type { BackendServiceOption, CaseType, Column, OperatorType } from '@slickgrid-universal/common';

export interface OdataOption extends BackendServiceOption {
  /** What is the casing type to use? Typically that would be 1 of the following 2: camelCase or PascalCase */
  caseType: CaseType;

  /** Add the total count $inlinecount (OData v2) or $count (OData v4) to the OData query */
  enableCount?: boolean;

  /**
   * Query fields using $select. The row identifier field is always added.
   * E.g.: columns [{ field: 'date' }] results in $select=id,date
   */
  enableSelect?: boolean;

  /**
   * Query navigation fields (containing '/') using $expand.
   * E.g.: with odata v4 and columns [{ field: 'date' }, { field: 'products/name' }] result in $select=id,date&$expand=products($select=name)
   */
  enableExpand?: boolean;

  /** How many rows to pull? */
  top?: number;

  /** How many rows to skip on the pagination? */
  skip?: number;

  /** (alias to "filter") Filter string (or array of string) that must be a valid OData string */
  filter?: string | string[];

  /** Filter string (or array of string) that must be a valid OData string */
  filterBy?: any;

  /** What is the separator between each filters? Typically "and", "or" */
  filterBySeparator?: 'and' | 'or';

  /** Filter queue */
  filterQueue?: any[];

  /** An optional predicate function to overide the built-in filter construction  */
  filterPredicate?: (args: OdataFilterPredicateArgs) => string | undefined;

  /** Sorting string (or array of string) that must be a valid OData string */
  orderBy?: string | string[];

  /** OData (or any other) version number (the query string is different between versions) */
  version?: number;

  /**
   * When false, searchTerms may be manipulated to be functional with certain filters eg: string only filters.
   * When true, JSON.stringify is used on the searchTerms and used in the query "as-is". It is then the responsibility of the developer to sanitise the `searchTerms` property if necessary.
   */
  useVerbatimSearchTerms?: boolean;

  /** A callback which will extract and return the count from the data queried. Defaults to 'd.__count' for v2, '__count' for v3 and '@odata.count' for v4. */
  countExtractor?: (response: any) => number;

  /** A callback which will extract and return the dataset from the data queried. Defaults to 'd.results' for v2, 'results' for v3 and 'value' for v4. */
  datasetExtractor?: (response: any) => number;
}

export interface OdataFilterPredicateArgs {
  /** The column to define the filter for */
  columnDef: Column<any> | undefined;
  /** The OData fieldName as target of the filter */
  fieldName: string;
  /** The operator selected by the user via the compound operator dropdown */
  columnFilterOperator: OperatorType;
  /** The inferred operator. See columnDef.autoParseInputFilterOperator */
  operator: OperatorType;
  /** The entered search value */
  searchValue: any;
}