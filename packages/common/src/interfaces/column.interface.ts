/* eslint-disable @typescript-eslint/indent */
import type {
  CellMenu,
  ColumnEditor,
  ColumnExcelExportOption,
  ColumnFilter,
  CustomTooltipOption,
  EditorValidator,
  Formatter,
  Grouping,
  GroupTotalExportOption,
  GroupTotalsFormatter,
  HeaderButtonsOrMenu,
  OnEventArgs,
  SlickEventData,
  SlickGrid,
  SortComparer,
} from './index';
import type { FieldType } from '../enums/fieldType.enum';

type PathsToStringProps<T> = T extends string | number | boolean | Date ? [] : {
  [K in Extract<keyof T, string>]: [K, ...PathsToStringProps<T[K]>]
}[Extract<keyof T, string>];

/* eslint-disable @typescript-eslint/indent */
// disable eslint indent rule until this issue is fixed: https://github.com/typescript-eslint/typescript-eslint/issues/1824
type Join<T extends any[], D extends string> =
  T extends [] ? never :
  T extends [infer F] ? F :
  T extends [infer F, ...infer R] ?
  F extends string ? string extends F ? string : `${F}${D}${Join<R, D>}` : never : string;
/* eslint-enable @typescript-eslint/indent */

export interface Column<T = any> {
  /** Defaults to false, should we always render the column? */
  alwaysRenderColumn?: boolean;

  /** async background post-rendering formatter */
  asyncPostRender?: (domCellNode: any, row: number, dataContext: T, columnDef: Column) => void;

  /** async background post-render cleanup callback function */
  asyncPostRenderCleanup?: (node: HTMLElement, rowIdx: number, column: Column) => void;

  /**
   * Defaults to true, when enabled it will parse the filter input string and extract filter operator (<, <=, >=, >, =, *) when found.
   * When an operators is found in the input string, it will automatically be converted to a Filter Operators and will no longer be part of the search value itself.
   * For example when the input value is "> 100", it will transform the search as to a Filter Operator of ">" and a search value of "100".
   * The only time that the user would want to disable this flag is when the user's data has any of these special characters and the user really wants to filter them as part of the string (ie: >, <, ...)
   */
  autoParseInputFilterOperator?: boolean;

  /** optional Behavior of a column with action, for example it's used by the Row Move Manager Plugin */
  behavior?: string;

  /** Block event triggering of a new row insert? */
  cannotTriggerInsert?: boolean;

  /** slick cell attributes */
  cellAttrs?: any;

  /** Options that can be provide to the Cell Context Menu Plugin */
  cellMenu?: CellMenu;

  /** Column group name for grouping of column headers spanning accross multiple columns */
  columnGroup?: string;

  /** Column group name translation key that can be used by the Translate Service (i18n) for grouping of column headers spanning accross multiple columns */
  columnGroupKey?: string;

  /** Column span in pixels or `*`, only input the number value */
  colspan?: number | '*';

  /** CSS class to add to the column cell */
  cssClass?: string;

  /**
   * Custom Tooltip Options, the tooltip could be defined in any of the Column Definition or in the Grid Options,
   * it will first try to find it in the Column that the user is hovering over or else (when not found) go and try to find it in the Grid Options
   */
  customTooltip?: CustomTooltipOption;

  /** Data key, for example this could be used as a property key for complex object comparison (e.g. dataKey: 'id') */
  dataKey?: string;

  /** Do we want default sort to be ascending? True by default */
  defaultSortAsc?: boolean;

  /** Defaults to false, do we want to deny executing a Paste (from a Copy of CellExternalCopyManager)? */
  denyPaste?: boolean;
  /**
   * defaults to False, optionally enable/disable tooltip.
   * This is typically used on a specific column that you would like to completely disable the custom/regular tooltip.
   */
  disableTooltip?: boolean;

  /** Any inline editor function that implements Editor for the cell value or ColumnEditor */
  editor?: ColumnEditor;

  /** Excel export custom options for cell formatting & width */
  excelExportOptions?: ColumnExcelExportOption;

  /** Default to false, which leads to exclude the column title from the Column Picker. */
  excludeFromColumnPicker?: boolean;

  /** Default to false, which leads to exclude the column from the export. */
  excludeFromExport?: boolean;

  /** Default to false, which leads to exclude the column title from the Grid Menu. */
  excludeFromGridMenu?: boolean;

  /** Defaults to false, which leads to exclude the `field` property, but still includes the `fields` property, from the query (typically a backend service query) */
  excludeFieldFromQuery?: boolean;

  /** Defaults to false, which leads to exclude the `field` (and `fields`) from the query (typically a backend service query) */
  excludeFromQuery?: boolean;

  /** Defaults to false, which leads to exclude the column from getting a header menu. For example, the checkbox row selection should not have a header menu. */
  excludeFromHeaderMenu?: boolean;

  /** @deprecated @use `excelExportOptions` in the future. This option let you defined current column width in Excel. */
  exportColumnWidth?: number;

  /**
   * Export with a Custom Formatter, useful when we want to use a different Formatter for the export.
   * For example, we might have a boolean field with "Formatters.checkmark" but we would like see a translated value for (True/False).
   */
  exportCustomFormatter?: Formatter<T>;

  /**
   * Export with a Custom Group Total Formatter, useful when we want to use a different Formatter for the export.
   * For example, we might have a boolean field with "Formatters.checkmark" but we would like see a translated value for (True/False).
   */
  exportCustomGroupTotalsFormatter?: GroupTotalsFormatter;

  /**
   * Defaults to false, which leads to Formatters being evaluated on export.
   * Most often used with dates that are stored as UTC but displayed as Date ISO (or any other format) with a Formatter.
   */
  exportWithFormatter?: boolean;

  /**
   * Do we want to force the cell value to be a string?
   * When set to True, it will wrap the cell value in double quotes and add an equal sign (=) at the beginning of the cell to force Excel to evaluate it as a string and not change it's format.
   * For example, without this flag a cell value with "1E06" would be interpreted as a number becoming (1.0E06) by Excel.
   * When set this flag to True, the cell value will be wrapped with an equal sign and double quotes, which forces Excel to evaluate it as a string. The output will be:: ="1E06" */
  exportCsvForceToKeepAsString?: boolean;

  /**
   * Field property name to use from the dataset that is used to display the column data.
   * For example: { id: 'firstName', field: 'firstName' }
   *
   * NOTE: a field with dot notation (.) will be considered a complex object.
   * For example: { id: 'Users', field: 'user.firstName' }
   */
  field: Join<PathsToStringProps<T>, '.'>;

  /**
   * Only used by Backend Services since the query is built using the column definitions, this is a way to pass extra properties to the backend query.
   * It can help in getting more fields for a Formatter without adding a new column definition every time that we don't want to display.
   * For example: { id: 'Users', field: 'user.firstName', fields: ['user.lastName', 'user.middleName'], formatter: fullNameFormatter }
   */
  fields?: string[];

  /** Filter class to use when filtering this column */
  filter?: ColumnFilter;

  /** is the column filterable? Goes with grid option "enableFiltering: true". */
  filterable?: boolean;

  /** Extra option to filter more easily. For example, a "UTC Date" field can use a search format of US Format like ">02/28/2017" */
  filterSearchType?: typeof FieldType[keyof typeof FieldType];

  /** are we allowed to focus on the column? */
  focusable?: boolean;

  /** Formatter function is to format, or visually change, the data shown in the grid (UI) in a different way without affecting the source. */
  formatter?: Formatter<T>;

  /** Default Formatter override function */
  formatterOverride?: { ReturnsTextOnly?: boolean; } | ((row: number, cell: number, val: any, columnDef: Column, item: any, grid: SlickGrid) => Formatter<T>);

  /** Grouping option used by a Draggable Grouping Column */
  grouping?: Grouping;

  /** Excel export custom options for cell formatting & width */
  groupTotalsExcelExportOptions?: GroupTotalExportOption;

  /** Group Totals Formatter function that can be used to add grouping totals in the grid */
  groupTotalsFormatter?: GroupTotalsFormatter;

  /** Options that can be provided to the Header Menu Plugin */
  header?: HeaderButtonsOrMenu;

  /** header cell attributes */
  headerCellAttrs?: any;

  /** CSS class that can be added to the column header */
  headerCssClass?: string;

  /** ID of the column, each row have to be unique or SlickGrid will throw an error. */
  id: number | string;

  /**
   * @reserved This is a RESERVED property and is used internally by the library to copy over the Column Editor Options.
   * You can read this property if you wish, but DO NOT override this property (unless you know what you're doing) as it will cause other issues with your editors.
   */
  internalColumnEditor?: ColumnEditor;

  /** Label key, for example this could be used as a property key for complex object label display (e.g. labelKey: 'name') */
  labelKey?: string;

  /** Maximum Width of the column in pixels (number only). */
  maxWidth?: number;

  /** Minimum Width of the column in pixels (number only). */
  minWidth?: number;

  /**
   * @reserved use internally by the lib, it will copy the `width` (when defined by the user) to this property for later reference.
   * so that we know if it was provided by the user or by the lib.
   * We do this because SlickGrid override the `width` with its own default width when nothing is provided.
   * We will use this original width reference when resizing the columns widths, if it was provided by the user then we won't override it.
   */
  originalWidth?: number;

  /** Column Title Name to be displayed in the Grid (UI) */
  name?: string;

  /** Alternative Column Title Name that could be used by the Composite Editor Modal, it has precedence over the column "name" property. */
  nameCompositeEditor?: string;

  /** Column Title Name translation key that can be used by the translate Service (i18n) to display the text for each column header title */
  nameKey?: string;

  /** Alternative Column Title Name translation key that could be used by the Composite Editor Modal, it has precedence over the column "name" property. */
  nameCompositeEditorKey?: string;

  /** an event that can be used for executing an action before the cell becomes editable (that event happens before the "onCellChange" event) */
  onBeforeEditCell?: (e: SlickEventData, args: OnEventArgs) => void;

  /** an event that can be used for executing an action after a cell change */
  onCellChange?: (e: SlickEventData, args: OnEventArgs) => void;

  /** an event that can be used for executing an action after a cell click */
  onCellClick?: (e: SlickEventData, args: OnEventArgs) => void;

  /**
   * Column output type (e.g. Date Picker, the output format that we will see in the picker)
   * NOTE: this is only currently used by the Editors/Filters with a Date Picker
   */
  outputType?: typeof FieldType[keyof typeof FieldType];

  /**
   * Column Editor save format type (e.g. which date format to use when saving after choosing a date from the Date Editor picker)
   * NOTE: this is only currently used by the Date Editor (date picker)
   */
  saveOutputType?: typeof FieldType[keyof typeof FieldType];

  /** if you want to pass custom paramaters to your Formatter/Editor or anything else */
  params?: any | any[];

  /** The previous column width in pixels (number only) */
  previousWidth?: number;

  /**
   * Useful when you want to display a certain field to the UI, but you want to use another field to query when Filtering/Sorting.
   * Please note that it has higher precendence over the "field" property.
   */
  queryField?: string;

  /**
   * When you do not know at hand the name of the Field to use for querying,
   * the lib will run this callback when provided to find out which Field name you want to use by the logic you defined.
   * Useful when you don't know in advance the field name to query from and/or is returned dynamically
   * and can change on earch row while executing the code at that moment.
   * @param {Object} dataContext - item data object
   * @return {string} name of the Field that will end up being used to query
   */
  queryFieldNameGetterFn?: (dataContext: T) => string;

  /**
   * Similar to "queryField" but only used when Filtering (please note that it has higher precendence over "queryField").
   * Useful when you want to display a certain field to the UI, but you want to use another field to query for Filtering.
   */
  queryFieldFilter?: string;

  /**
   * Similar to "queryField" but only used when Sorting (please note that it has higher precendence over "queryField").
   * Useful when you want to display a certain field to the UI, but you want to use another field to query for Sorting.
   */
  queryFieldSorter?: string;

  /** Is the column resizable, can we make it wider/thinner? A resize cursor will show on the right side of the column when enabled. */
  resizable?: boolean;

  /** defaults to false, if a column `width` is provided (or was previously calculated) should we recalculate it or not when resizing by cell content? */
  resizeAlwaysRecalculateWidth?: boolean;

  /**
   * Defaults to 1, a column width ratio to use in the calculation when resizing columns by their cell content.
   * We have this ratio number so that if we know that the cell content has lots of thin character (like 1, i, t, ...) we can lower the ratio to take up less space.
   * In other words and depending on which font family you use, each character will have different width, characters like (i, t, 1) takes a lot less space compare to (W, H, Q),
   * unless of course we use a monospace font family which will have the exact same size for each characters and in that case we leave it to 1 but that rarely happens.
   * NOTE: the default ratio is 1, except for string where we use a ratio of around ~0.9 since we have more various thinner characters like (i, l, t, ...).
   */
  resizeCalcWidthRatio?: number;

  /**
   * no defaults, a character width to use when resizing columns by their cell content.
   * If nothing is provided it will use `resizeCellCharWidthInPx` defined in the grid options.
   */
  resizeCharWidthInPx?: number;

  /** no defaults, what is the column max width threshold to not go over when resizing columns by their cell content */
  resizeMaxWidthThreshold?: number;

  /** no defaults, what is optional extra width padding to add to the calculation when resizing columns by their cell content */
  resizeExtraWidthPadding?: number;

  /** Do we want to re-render the grid on a grid resize */
  rerenderOnResize?: boolean;

  /** Defaults to false, which leads to Sanitizing all data (striping out any HTML tags) when being evaluated on export. */
  sanitizeDataExport?: boolean;

  /** Is the column selectable? Goes with grid option "enableCellNavigation: true". */
  selectable?: boolean;

  /** Is the column sortable? Goes with grid option "enableSorting: true". */
  sortable?: boolean;

  /** Custom Sort Comparer function that can be provided to the column */
  sortComparer?: SortComparer;

  /** Custom Tooltip that can ben shown to the column */
  toolTip?: string;

  /**
   * @alias `groupTotalsFormatter` Tree Totals Formatter function that can be used to add tree totals in the,
   * user can provide any `GroupTotalsFormatter` and/or use `groupTotalsFormatter` which will do the same
   */
  treeTotalsFormatter?: GroupTotalsFormatter;

  /** What is the Field Type, this can be used in the Formatters/Editors/Filters/... */
  type?: typeof FieldType[keyof typeof FieldType];

  /** Defaults to false, when set to True will lead to the column being unselected in the UI */
  unselectable?: boolean;

  /** Editor Validator */
  validator?: EditorValidator;

  /**
   * Defaults to false, can the value be undefined?
   * Typically undefined values are disregarded when sorting, when setting this flag it will adds extra logic to Sorting and also sort undefined value.
   * This is an extra flag that user has to enable by themselve because Sorting undefined values has unwanted behavior in some use case
   * (for example Row Detail has UI inconsistencies since undefined is used in the plugin's logic)
   */
  valueCouldBeUndefined?: boolean;

  /** Width of the column in pixels (number only). */
  width?: number;

  /** column width request when resizing */
  widthRequest?: number;
}
