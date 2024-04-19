import type { FieldType, OperatorString, OperatorType, SearchTerm, } from '../enums/index';
import type {
  CollectionCustomStructure,
  CollectionFilterBy,
  CollectionOption,
  CollectionSortBy,
  Column,
  Filter,
  FilterConstructor,
  OperatorDetail,
} from './index';
import type { Observable, Subject } from '../services/rxjsFacade';

export interface ColumnFilter {
  /** Optionally provide an aria-label for assistive scren reader, defaults to "{inputName} Search Filter" */
  ariaLabel?: string;

  /** Do we want to bypass the Backend Query? Commonly used with an OData Backend Service, if we want to filter without calling the regular OData query. */
  bypassBackendQuery?: boolean;

  /** Column ID */
  columnId?: string;

  /** Column Definition */
  columnDef?: Column;

  /** Optional operator list to override the full list of Compound Operator select dropdown list. */
  compoundOperatorList?: OperatorDetail[];

  /** Custom Filter */
  customFilter?: Filter;

  /** Search terms to preload (collection), please note it is better to use the "presets" grid option which is more powerful. */
  searchTerms?: SearchTerm[] | undefined;

  /** Operator to use when filtering (>, >=, EQ, IN, ...) */
  operator?: OperatorType | OperatorString;

  /** Maximum value of the filter, works only with Filters supporting it (text, number, float, slider) */
  maxValue?: number | string;

  /** Minimum value of the filter, works only with Filters supporting it (text, number, float, slider) */
  minValue?: number | string;

  /** Filter to use (input, multipleSelect, singleSelect, select, custom) */
  model?: FilterConstructor;

  /** A collection of items/options that will be loaded asynchronously (commonly used with a Select/Multi-Select Filter) */
  collectionAsync?: Promise<any> | Observable<any> | Subject<any>;

  /**
   * A collection of items/options (commonly used with a Select/Multi-Select Filter)
   * It can be a collection of string or label/value pair (the pair can be customized via the "customStructure" option)
   */
  collection?: any[];

  /** Options to change the behavior of the "collection" */
  collectionOptions?: CollectionOption;

  /** We could filter some 1 or more items from the collection */
  collectionFilterBy?: CollectionFilterBy | CollectionFilterBy[];

  /** We could sort the collection by 1 or more properties, or by translated value(s) when enableTranslateLabel is True */
  collectionSortBy?: CollectionSortBy | CollectionSortBy[];

  /** A custom structure can be used instead of the default label/value pair. Commonly used with Select/Multi-Select Filter */
  customStructure?: CollectionCustomStructure;

  /**
   * Defaults to false, when enable it will add collection observers and re-render the Filter DOM element
   * with the new collection when changes are detected. Also note that using "collectionAsync" automatically watch for changes,
   * in consequence, there's no need to enable this flag in that particular case.
   */
  enableCollectionWatch?: boolean;

  /**
   * Defaults to false, when set it will render any HTML code instead of removing it (sanitized)
   * Currently only supported by the following Editors: AutoComplete, MultipleSelect & SingleSelect
   */
  enableRenderHtml?: boolean;

  /** Defaults to false, do we want to trim white spaces from the filter value typed by the user? */
  enableTrimWhiteSpace?: boolean;

  /** Do we want the Filter to handle translation (localization)? */
  enableTranslateLabel?: boolean;

  /**
   * Options that could be provided to the Filter, example: { container: 'body', maxHeight: 250}
   *
   * Please note that if you use options that have existed model interfaces, you should cast with "as X",
   * for example { filterOptions: {maxHeight: 250} as MultipleSelectOption }
   */
  filterOptions?: any;

  /**
   * Use "params" to pass any type of arguments to your Custom Filter
   * for example, to pass a second collection to a select Filter we can type this:
   * params: { options: [{ value: true, label: 'True' }, { value: true, label: 'True'} ]}
   */
  params?: any;

  /**
   * Placeholder text that can be used by some Filters.
   * Note that this will override the default placeholder configured in the global config
   */
  placeholder?: string;

  /**
   * Useful when you want to display a certain field to the UI, but you want to use another field to query when Filtering/Sorting.
   * Please note that it has higher precendence over the "field" property.
   */
  queryField?: string;

  /**
   * Defaults to true, should an empty search term have the effect of returning all results?
   * Typically that would be True except for a dropdown Select Filter,
   * we might really want to filter an empty string and/or `undefined` and for these special cases we can set this flag to `false`.
   *
   * NOTE: for a dropdown Select Filter, we will assume that on a multipleSelect Filter it should default to `false`
   * however for a singleSelect Filter (and any other type of Filters) it should default to `true`.
   * In any case, the user can overrides it this flag.
   */
  emptySearchTermReturnAllValues?: boolean;

  /**
   * Should we skip filtering when the Operator is changed before the Compound Filter input.
   * For example, with a CompoundDate Filter it's probably better to wait until we have a date filled before filtering even if we start with the operator.
   * Defaults to True only for the Compound Date Filter (all other compound filters will still filter even when operator is first changed).
   */
  skipCompoundOperatorFilterWithNullInput?: boolean;

  /** Target element selector from which the filter was triggered from. */
  targetSelector?: string;

  /** What is the Field Type that can be used by the Filter (as precedence over the "type" set the column definition) */
  type?: typeof FieldType[keyof typeof FieldType];

  /** Step value of the filter, works only with Filters supporting it (input text, number, float, range, slider) */
  valueStep?: number | string;
}
