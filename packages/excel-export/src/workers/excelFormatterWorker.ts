import type {
  WorkerChunk,
  WorkerChunkResult,
  SerializableColumn,
  SerializableGridOptions
} from '../utils/formatterSerializer.js';
import { FormatterSerializer } from '../utils/formatterSerializer.js';
import type { WorkerMessage } from '../utils/workerManager.js';

// For workers, we'll return simple values and let the main thread handle Excel metadata
// This avoids potential issues with complex object structures in worker communication

/**
 * Mock SlickGrid interface for worker environment
 * Contains only the methods and properties that formatters typically use
 */
interface MockSlickGrid {
  getOptions(): SerializableGridOptions;
  // Add methods needed for parameter handling and formatter options
  getFormatterOptions?(): any;
  getLocale?(): string;
  getColumns?(): any[];
}

/**
 * Create a mock SlickGrid instance for use in the worker
 */
function createMockGrid(gridOptions: SerializableGridOptions, columns?: SerializableColumn[]): MockSlickGrid {
  return {
    getOptions: () => gridOptions,
    getFormatterOptions: () => gridOptions.formatterOptions || {},
    getLocale: () => gridOptions.locale || 'en',
    getColumns: () => columns || [],
  };
}

/**
 * Process formatter evaluation for a single cell
 */
function processFormatterForCell(
  row: number,
  col: number,
  cellValue: any,
  column: SerializableColumn,
  dataContext: any,
  mockGrid: MockSlickGrid
): string {
  // Deserialize the formatter
  const formatter = FormatterSerializer.deserializeFormatter(column.formatter || null);

  if (!formatter) {
    // No formatter, return the raw value as string
    return cellValue != null ? String(cellValue) : '';
  }

  try {
    // Execute the formatter
    const result = formatter(row, col, cellValue, column as any, dataContext, mockGrid as any);

    // Handle different formatter result types
    if (typeof result === 'string') {
      return result;
    } else if (typeof result === 'number') {
      return String(result);
    } else if (result && typeof result === 'object') {
      // Handle FormatterResultWithHtml or FormatterResultWithText
      if ('html' in result) {
        return typeof result.html === 'string' ? result.html : '';
      } else if ('text' in result) {
        return result.text || '';
      } else if (result instanceof HTMLElement || result instanceof DocumentFragment) {
        // For DOM elements, extract text content
        return result.textContent || '';
      }
    }

    return result != null ? String(result) : '';
  } catch (error) {
    console.warn(`Formatter error for column ${column.id}:`, error);
    // Fallback to raw value on formatter error
    return cellValue != null ? String(cellValue) : '';
  }
}

/**
 * Determine if formatter should be applied based on export options
 */
function shouldApplyFormatter(
  column: SerializableColumn,
  exportOptions: any
): boolean {
  // Check column-level exportWithFormatter setting first
  if (column.hasOwnProperty('exportWithFormatter')) {
    return !!column.exportWithFormatter;
  }

  // Check export options
  if (exportOptions?.hasOwnProperty('exportWithFormatter')) {
    return !!exportOptions.exportWithFormatter;
  }

  // Default to false if not specified
  return false;
}

/**
 * Get the field value from data context, handling complex field paths
 */
function getFieldValue(dataContext: any, fieldPath: string): any {
  if (!fieldPath || !dataContext) {
    return null;
  }

  // Handle simple field access
  if (fieldPath.indexOf('.') === -1) {
    return dataContext[fieldPath];
  }

  // Handle complex field paths (e.g., "user.firstName")
  return fieldPath.split('.').reduce((obj, key) => {
    return obj && obj.hasOwnProperty(key) ? obj[key] : null;
  }, dataContext);
}

/**
 * Process a single row of data with Excel formatting support
 */
function processRow(
  rowIndex: number,
  rowData: any,
  columns: SerializableColumn[],
  mockGrid: MockSlickGrid,
  exportOptions: any
): Array<string | number> {
  const processedRow: Array<string | number> = [];

  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];

    // Skip excluded columns
    if (column.excludeFromExport) {
      continue;
    }

    const fieldValue = getFieldValue(rowData, column.field);
    let cellValue: string | number;

    // Apply formatter logic similar to main thread exportWithFormatterWhenDefined
    const formattedValue = exportWithFormatterWhenDefinedWorker(
      rowIndex,
      colIndex,
      column,
      rowData,
      mockGrid,
      exportOptions
    );

    // Convert to simple value for safe worker communication
    cellValue = convertToSimpleValue(formattedValue);

    // Sanitize data if requested
    if (exportOptions?.sanitizeDataExport && typeof cellValue === 'string') {
      cellValue = cellValue.replace(/<[^>]*>/g, '');
    }

    processedRow.push(cellValue);
  }

  return processedRow;
}

/**
 * Worker equivalent of exportWithFormatterWhenDefined
 */
function exportWithFormatterWhenDefinedWorker(
  row: number,
  col: number,
  columnDef: SerializableColumn,
  dataContext: any,
  grid: MockSlickGrid,
  exportOptions: any
): string {
  let isEvaluatingFormatter = false;

  // Check if "exportWithFormatter" is provided in the column definition
  if (columnDef?.hasOwnProperty('exportWithFormatter')) {
    isEvaluatingFormatter = !!columnDef.exportWithFormatter;
  } else if (exportOptions?.hasOwnProperty('exportWithFormatter')) {
    isEvaluatingFormatter = !!exportOptions.exportWithFormatter;
  }

  let formatter: string | null = null;
  if (dataContext && columnDef.exportCustomFormatter) {
    // Use custom export formatter
    formatter = columnDef.exportCustomFormatter;
  } else if (isEvaluatingFormatter && columnDef.formatter) {
    // Use regular formatter
    formatter = columnDef.formatter;
  }

  // Get field value
  const fieldValue = getFieldValue(dataContext, columnDef.field);

  if (formatter) {
    return processFormatterForCell(row, col, fieldValue, { ...columnDef, formatter }, dataContext, grid);
  }

  // No formatter, return raw value
  return fieldValue != null ? String(fieldValue) : '';
}

/**
 * Convert any value to a simple string or number for safe worker communication
 */
function convertToSimpleValue(value: any): string | number {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    return value;
  }

  // Handle objects, arrays, etc. by converting to string
  return String(value);
}

/**
 * Get basic Excel number format ID based on column formatter
 */
function getRegularCellExcelFormatId(column: SerializableColumn): number | undefined {
  // Enhanced Excel format detection based on formatter and parameters
  if (column.formatter) {
    const formatterStr = column.formatter;
    if (typeof formatterStr === 'string') {
      // Currency formatters
      if (formatterStr.includes('currency')) {
        // Check for custom currency prefix in params
        if (column.params?.currencyPrefix === '€') {
          return 165; // Euro currency format
        }
        return 164; // Default currency format
      }
      if (formatterStr.includes('dollar')) {
        return 164; // Dollar currency format
      }
      if (formatterStr.includes('percent')) {
        return 10; // Percentage format
      }
      if (formatterStr.includes('decimal')) {
        return 2; // Number with 2 decimal places
      }
    }
  }

  // Check field type for additional hints
  if (column.type === 'number') {
    return 1; // Default number format
  }

  return undefined; // No specific format
}

function getBasicExcelNumberFormatId(column: SerializableColumn): number | undefined {
  return getRegularCellExcelFormatId(column) || 1;
}

/**
 * Get column field type (simplified version for worker)
 */
function getColumnFieldType(column: SerializableColumn): string {
  return column.type || 'string';
}

/**
 * Process group header row
 */
function processGroupRow(workerRowData: any, chunk: WorkerChunk): any {
  const groupTitle = readGroupedRowTitle(workerRowData, chunk.exportOptions);

  return {
    type: 'group',
    data: [groupTitle],
    originalRowIndex: workerRowData.originalRowIndex,
    isGrouped: true,
    groupLevel: workerRowData.groupLevel || 0
  };
}

/**
 * Process group totals row with enhanced formatter and Excel support
 */
function processGroupTotalsRow(workerRowData: any, columns: SerializableColumn[], mockGrid: MockSlickGrid, exportOptions: any): any {
  const groupingAggregatorRowText = exportOptions.groupingAggregatorRowText || '';
  const outputData: Array<string | number> = [groupingAggregatorRowText];

  console.log('Worker processGroupTotalsRow - data:', workerRowData.data);

  // Process each column for group totals
  columns.forEach((columnDef) => {
    let itemData: string | number = '';
    const skippedField = columnDef.excludeFromExport || false;

    if (!skippedField) {
      console.log(`Processing group total for column ${columnDef.field}:`, {
        exportCustomGroupTotalsFormatter: !!columnDef.exportCustomGroupTotalsFormatter,
        groupTotalsFormatter: !!columnDef.groupTotalsFormatter,
        totalsData: workerRowData.data
      });

      // Check for custom group totals formatter first
      if (columnDef.exportCustomGroupTotalsFormatter) {
        console.log(`Using exportCustomGroupTotalsFormatter for ${columnDef.field}`);
        const totalResult = processCustomGroupTotalsFormatter(
          workerRowData.data,
          columnDef,
          mockGrid
        );
        itemData = convertToSimpleValue(totalResult);
        console.log(`Custom formatter result for ${columnDef.field}:`, totalResult, '-> converted:', itemData);
      } else if (columnDef.groupTotalsFormatter) {
        console.log(`Using groupTotalsFormatter for ${columnDef.field}:`, columnDef.groupTotalsFormatter);
        // Process regular group totals formatter
        const totalResult = processGroupTotalsFormatter(
          workerRowData.data,
          columnDef,
          mockGrid
        );
        itemData = convertToSimpleValue(totalResult);
        console.log(`Group formatter result for ${columnDef.field}:`, totalResult, '-> converted:', itemData);
      } else {
        console.log(`Using basic aggregation for ${columnDef.field}`);
        // Use basic aggregation value extraction
        itemData = getWorkerGroupTotalValue(workerRowData.data, columnDef);
        console.log(`Basic aggregation result for ${columnDef.field}:`, itemData);
      }

      // Sanitize data if requested
      if (typeof itemData === 'string' && (columnDef.sanitizeDataExport || exportOptions.sanitizeDataExport)) {
        const originalData = itemData;
        itemData = itemData.replace(/<[^>]*>/g, '');
        console.log(`Sanitized ${columnDef.field}: "${originalData}" -> "${itemData}"`);
      }

      console.log(`Final group total for ${columnDef.field}:`, itemData);
    }

    // Add the column data (unless user wants to skip it)
    if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
      outputData.push(itemData);
    }
  });

  console.log('Worker processGroupTotalsRow - outputData:', outputData);

  return {
    type: 'groupTotals',
    data: outputData,
    originalRowIndex: workerRowData.originalRowIndex,
    isGrouped: true,
    groupLevel: workerRowData.groupLevel || 0
  };
}

/**
 * Process custom group totals formatter (CSP-compliant)
 * Group totals formatters have signature: (totals, columnDef, grid)
 */
function processCustomGroupTotalsFormatter(
  totals: any,
  columnDef: SerializableColumn,
  mockGrid: MockSlickGrid
): string {
  if (!columnDef.exportCustomGroupTotalsFormatter) {
    return '';
  }

  try {
    // Use CSP-compliant deserialization
    let formatter = FormatterSerializer.deserializeFormatter(columnDef.exportCustomGroupTotalsFormatter);

    // If regular deserialization fails, try group totals specific patterns
    if (!formatter) {
      formatter = deserializeGroupTotalsFormatterSafe(columnDef.exportCustomGroupTotalsFormatter);
    }

    if (formatter) {
      // Group totals formatters use a different signature than regular formatters
      const result = (formatter as any)(totals, columnDef as any, mockGrid as any);

      // Handle HTMLElement results by extracting text content (worker-safe)
      if (result && typeof result === 'object' && result.textContent) {
        return result.textContent || '';
      }

      return typeof result === 'string' ? result : String(result || '');
    }
  } catch (error) {
    console.warn(`Custom group totals formatter error for column ${columnDef.id}:`, error);
  }

  // Fallback to basic aggregation
  return getWorkerGroupTotalValue(totals, columnDef);
}

/**
 * Process regular group totals formatter
 * Group totals formatters have signature: (totals, columnDef, grid)
 */
function processGroupTotalsFormatter(
  totals: any,
  columnDef: SerializableColumn,
  mockGrid: MockSlickGrid
): string {
  if (!columnDef.groupTotalsFormatter) {
    return '';
  }

  try {
    // Use CSP-compliant deserialization for group totals formatters
    let formatter = FormatterSerializer.deserializeFormatter(columnDef.groupTotalsFormatter);

    // If regular deserialization fails, try group totals specific patterns
    if (!formatter) {
      formatter = deserializeGroupTotalsFormatterSafe(columnDef.groupTotalsFormatter);
    }

    if (formatter) {
      // Group totals formatters use a different signature than regular formatters
      const result = (formatter as any)(totals, columnDef as any, mockGrid as any);

      console.log('Standalone group totals formatter result for ' + columnDef.field + ':', {
        result,
        type: typeof result,
        isObject: typeof result === 'object',
        hasTextContent: result && typeof result === 'object' && 'textContent' in result,
        textContent: result && typeof result === 'object' ? result.textContent : undefined
      });

      // Handle HTMLElement results by extracting text content (worker-safe)
      if (result && typeof result === 'object') {
        // Try multiple ways to extract text from object
        if (result.textContent !== undefined) {
          console.log('Standalone extracted textContent: "' + result.textContent + '"');
          return result.textContent || '';
        }
        if (result.innerText !== undefined) {
          console.log('Standalone extracted innerText: "' + result.innerText + '"');
          return result.innerText || '';
        }
        if (result.innerHTML !== undefined) {
          console.log('Standalone extracted innerHTML: "' + result.innerHTML + '"');
          return result.innerHTML || '';
        }
        // If it's an object but no text properties, try to stringify it properly
        console.warn('Standalone object result without text properties, converting to string:', result);
        return JSON.stringify(result);
      }

      const finalResult = typeof result === 'string' ? result : String(result || '');
      console.log('Standalone final group totals result for ' + columnDef.field + ': "' + finalResult + '"');
      return finalResult;
    }
  } catch (error) {
    console.warn(`Group totals formatter error for column ${columnDef.id}:`, error);
  }

  return '';
}



/**
 * Create a worker-side Excel format ID from style object
 */
function createWorkerExcelFormatId(style: any): number {
  // Simplified approach: create a hash-based ID from the style object
  // In a full implementation, this would integrate with the main thread's stylesheet system
  let hash = 0;
  const styleStr = JSON.stringify(style);
  for (let i = 0; i < styleStr.length; i++) {
    const char = styleStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000 + 1000; // Ensure positive ID in range 1000-1999
}

/**
 * Get advanced Excel format ID for group totals based on column and group type
 */
function getAdvancedGroupTotalsExcelFormatId(columnDef: SerializableColumn, groupType: string): number | undefined {
  // Enhanced format detection for group totals
  if (columnDef.groupTotalsFormatter) {
    const formatterStr = columnDef.groupTotalsFormatter;
    if (typeof formatterStr === 'string') {
      // Detect currency formatters
      if (formatterStr.includes('sumTotalsCurrency') || formatterStr.includes('avgTotalsCurrency')) {
        // Check for custom currency prefix in params
        if (columnDef.params?.groupFormatterCurrencyPrefix === '€') {
          return 165; // Euro currency format
        }
        return 164; // Default currency format
      }
      if (formatterStr.includes('dollar')) {
        return 164; // Dollar currency format
      }
      if (formatterStr.includes('percent')) {
        return 10; // Percentage format
      }
    }
  }

  // Check regular formatter for additional hints
  if (columnDef.formatter) {
    const formatterStr = columnDef.formatter;
    if (typeof formatterStr === 'string') {
      if (formatterStr.includes('currency')) {
        return columnDef.params?.currencyPrefix === '€' ? 165 : 164;
      }
    }
  }

  // Default number format based on group type
  if (groupType === 'avg') {
    return 2; // Number with 2 decimal places
  }

  return undefined; // No specific format
}

/**
 * Get Excel format ID for group totals based on column and group type (legacy function)
 */
function getGroupTotalsExcelFormatId(columnDef: SerializableColumn, groupType: string): number | undefined {
  return getAdvancedGroupTotalsExcelFormatId(columnDef, groupType);
}

/**
 * CSP-compliant group totals formatter deserialization
 */
function deserializeGroupTotalsFormatterSafe(serializedFormatter: string): any {
  if (!serializedFormatter) return null;

  if (serializedFormatter.startsWith('CUSTOM:')) {
    const functionString = serializedFormatter.substring(7);

    // Enhanced pattern matching for group totals formatters
    console.log('CSP: Trying to identify group totals formatter pattern:', functionString.substring(0, 100) + '...');

    if (functionString.includes('sumTotalsCurrency') ||
      functionString.includes('sumTotalsCurrencyFormatter') ||
      (functionString.includes('totals.sum') && functionString.includes('currency')) ||
      (functionString.includes('sum?.[field]') && (functionString.includes('currencyPrefix') || functionString.includes('€')))) {
      console.log('CSP: Identified as sumTotalsCurrency formatter');
      return createSumTotalsCurrencyFormatter();
    }

    if (functionString.includes('sumTotalsDollar') ||
      functionString.includes('sumTotalsDollarFormatter') ||
      (functionString.includes('totals.sum') && functionString.includes('dollar')) ||
      (functionString.includes('sum?.[field]') && functionString.includes('$'))) {
      console.log('CSP: Identified as sumTotalsDollar formatter');
      return createSumTotalsDollarFormatter();
    }

    if (functionString.includes('avgTotalsCurrency') ||
      functionString.includes('avgTotalsCurrencyFormatter') ||
      (functionString.includes('totals.avg') && functionString.includes('currency')) ||
      (functionString.includes('avg?.[field]') && (functionString.includes('currencyPrefix') || functionString.includes('€')))) {
      console.log('CSP: Identified as avgTotalsCurrency formatter');
      return createAvgTotalsCurrencyFormatter();
    }

    // Check for any sum-based formatter as fallback
    if (functionString.includes('totals.sum') || functionString.includes('sum?.[field]')) {
      console.log('CSP: Identified as generic sum totals formatter, using currency formatter');
      return createSumTotalsCurrencyFormatter();
    }

    // Fallback: create a generic group totals formatter
    console.warn('CSP: Using fallback group totals formatter for pattern:', functionString.substring(0, 100) + '...');
    return createFallbackGroupTotalsFormatter();
  }

  return null;
}

/**
 * Format a number following options (simplified version of formatNumber from utilities)
 */
function formatWorkerNumber(
  input: number,
  minDecimal: number = 2,
  maxDecimal: number = 4,
  wrapNegativeNumber: boolean = false,
  symbolPrefix: string = '',
  symbolSuffix: string = '',
  decimalSeparator: string = '.',
  thousandSeparator: string = ''
): string {
  if (isNaN(input)) {
    return String(input);
  }

  const calculatedValue = Math.round(parseFloat(String(input)) * 1000000) / 1000000;
  const isNegative = calculatedValue < 0;
  const absoluteValue = Math.abs(calculatedValue);

  // Format with appropriate decimal places
  const decimalPlaces = Math.min(maxDecimal, Math.max(minDecimal, 2));
  let formattedNumber = absoluteValue.toFixed(decimalPlaces);

  // Add thousand separators if specified
  if (thousandSeparator) {
    const parts = formattedNumber.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    formattedNumber = parts.join(decimalSeparator);
  } else if (decimalSeparator !== '.') {
    formattedNumber = formattedNumber.replace('.', decimalSeparator);
  }

  // Add currency symbols
  const formattedWithSymbols = `${symbolPrefix}${formattedNumber}${symbolSuffix}`;

  // Handle negative numbers
  if (isNegative) {
    if (wrapNegativeNumber) {
      return `(${formattedWithSymbols})`;
    } else {
      return `-${formattedWithSymbols}`;
    }
  }

  return formattedWithSymbols;
}

/**
 * Create CSP-compliant sum totals currency formatter (enhanced)
 */
function createSumTotalsCurrencyFormatter() {
  return (totals: any, columnDef: SerializableColumn, grid: MockSlickGrid) => {
    const field = columnDef.field || '';
    const val = totals.sum?.[field];

    console.log(`sumTotalsCurrency formatter called for field ${field}:`, {
      totals,
      val,
      params: columnDef?.params
    });

    if (val == null || isNaN(val)) {
      console.log(`sumTotalsCurrency: No valid value for ${field}, returning empty`);
      return '';
    }

    const params = columnDef?.params || {};
    const prefix = params.groupFormatterPrefix || '';
    const suffix = params.groupFormatterSuffix || '';

    // Handle both groupFormatterCurrencyPrefix and currencyPrefix
    const currencyPrefix = params.groupFormatterCurrencyPrefix || params.currencyPrefix || '$';
    const currencySuffix = params.groupFormatterCurrencySuffix || params.currencySuffix || '';

    // Get formatting options (simplified version of retrieveFormatterOptions)
    const minDecimal = params.minDecimal || 2;
    const maxDecimal = params.maxDecimal || 4;
    const decimalSeparator = params.decimalSeparator || '.';
    const thousandSeparator = params.thousandSeparator || '';
    const wrapNegativeNumber = params.displayNegativeNumberWithParentheses || false;

    console.log(`sumTotalsCurrency formatting options for ${field}:`, {
      prefix, suffix, currencyPrefix, currencySuffix,
      minDecimal, maxDecimal, wrapNegativeNumber
    });

    // Format the number using the enhanced formatWorkerNumber function
    const formattedNumber = formatWorkerNumber(
      val,
      minDecimal,
      maxDecimal,
      wrapNegativeNumber,
      currencyPrefix,
      currencySuffix,
      decimalSeparator,
      thousandSeparator
    );

    const result = `${prefix}${formattedNumber}${suffix}`;
    console.log(`sumTotalsCurrency result for ${field}:`, result);
    return result;
  };
}

/**
 * Create CSP-compliant sum totals dollar formatter
 */
function createSumTotalsDollarFormatter() {
  return (totals: any, columnDef: SerializableColumn, grid: MockSlickGrid) => {
    const field = columnDef.field || '';
    const val = totals.sum?.[field];
    if (val == null || isNaN(val)) return '';

    const params = columnDef?.params || {};
    const prefix = params.groupFormatterPrefix || '';
    const suffix = params.groupFormatterSuffix || '';

    const formattedNumber = '$' + Math.abs(val).toFixed(2);
    return prefix + (val < 0 ? '-' : '') + formattedNumber + suffix;
  };
}

/**
 * Create CSP-compliant avg totals currency formatter
 */
function createAvgTotalsCurrencyFormatter() {
  return (totals: any, columnDef: SerializableColumn, grid: MockSlickGrid) => {
    const field = columnDef.field || '';
    const val = totals.avg?.[field];
    if (val == null || isNaN(val)) return '';

    const params = columnDef?.params || {};
    const prefix = params.groupFormatterPrefix || '';
    const suffix = params.groupFormatterSuffix || '';
    const currencyPrefix = params.groupFormatterCurrencyPrefix || params.currencyPrefix || '$';
    const minDecimal = params.minDecimal || 2;
    const maxDecimal = params.maxDecimal || 4;

    const decimalPlaces = Math.min(maxDecimal, Math.max(minDecimal, 2));
    const formattedCurrency = currencyPrefix + Math.abs(val).toFixed(decimalPlaces);

    return prefix + (val < 0 ? '-' : '') + formattedCurrency + suffix;
  };
}

/**
 * Create fallback group totals formatter
 */
function createFallbackGroupTotalsFormatter() {
  return (totals: any, columnDef: SerializableColumn, grid: MockSlickGrid) => {
    return getWorkerGroupTotalValue(totals, columnDef);
  };
}

/**
 * Get group total value from totals data (worker version of getGroupTotalValue)
 */
function getWorkerGroupTotalValue(totals: any, columnDef: SerializableColumn): string {
  const field = columnDef.field;

  // Try different aggregation types in order of preference
  const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];

  for (const groupType of aggregationTypes) {
    const value = totals?.[groupType]?.[field];
    if (value !== undefined && value !== null) {
      // Format the value based on type
      if (typeof value === 'number') {
        // For avg, show with decimals
        if (groupType === 'avg') {
          return value.toFixed(2);
        }
        return value.toString();
      }
      return String(value);
    }
  }

  return '';
}

/**
 * Process regular data row
 */
function processRegularRow(workerRowData: any, columns: SerializableColumn[], mockGrid: MockSlickGrid, exportOptions: any): any {
  const processedRow = processRow(
    workerRowData.originalRowIndex,
    workerRowData.data,
    columns,
    mockGrid,
    exportOptions
  );

  return {
    type: 'regular',
    data: processedRow,
    originalRowIndex: workerRowData.originalRowIndex,
    isGrouped: false
  };
}

/**
 * Read grouped row title (worker version)
 */
function readGroupedRowTitle(workerRowData: any, exportOptions: any): string {
  // Get the group title from WorkerRowData structure
  // The title should already be sanitized (HTML stripped) in the data object
  let groupName = '';

  console.log('Worker readGroupedRowTitle - workerRowData:', {
    groupTitle: workerRowData.groupTitle,
    dataTitle: workerRowData.data?.title,
    groupLevel: workerRowData.groupLevel,
    groupCollapsed: workerRowData.groupCollapsed
  });

  // Try to get title from multiple possible sources
  if (workerRowData.groupTitle) {
    // Use the original title stored in WorkerRowData (may have HTML)
    groupName = workerRowData.groupTitle.replace(/<[^>]*>/g, '');
    console.log('Worker using groupTitle:', workerRowData.groupTitle, '-> cleaned:', groupName);
  } else if (workerRowData.data && workerRowData.data.title) {
    // Use title from sanitized data (should already be clean)
    groupName = workerRowData.data.title;
    console.log('Worker using data.title:', groupName);
  } else {
    // Fallback: try to construct from data properties
    groupName = `Group ${workerRowData.groupLevel || 0}`;
    console.log('Worker using fallback:', groupName);
  }

  if (exportOptions && exportOptions.addGroupIndentation) {
    const collapsedSymbol = exportOptions.groupCollapsedSymbol || '⮞';
    const expandedSymbol = exportOptions.groupExpandedSymbol || '⮟';
    const chevron = workerRowData.groupCollapsed ? collapsedSymbol : expandedSymbol;
    const indentation = '     '.repeat(workerRowData.groupLevel || 0); // 5 spaces per level
    const result = chevron + ' ' + indentation + groupName;
    console.log('Worker final group title:', result);
    return result;
  }

  console.log('Worker final group title (no indentation):', groupName);
  return groupName;
}

/**
 * Process a chunk of data
 */
function processChunk(chunk: WorkerChunk): WorkerChunkResult {
  try {
    const mockGrid = createMockGrid(chunk.gridOptions);
    const processedRows: any[] = [];

    for (let i = 0; i < chunk.rows.length; i++) {
      const workerRowData = chunk.rows[i];

      let processedRow;

      if (workerRowData.type === 'group') {
        // Process group header row
        processedRow = processGroupRow(workerRowData, chunk);
      } else if (workerRowData.type === 'groupTotals') {
        // Process group totals row
        processedRow = processGroupTotalsRow(workerRowData, chunk.columns, mockGrid, chunk.exportOptions);
      } else {
        // Process regular data row
        processedRow = processRegularRow(
          workerRowData,
          chunk.columns,
          mockGrid,
          chunk.exportOptions
        );
      }

      processedRows.push(processedRow);
    }

    return {
      chunkId: chunk.chunkId,
      processedRows,
    };
  } catch (error) {
    return {
      chunkId: chunk.chunkId,
      processedRows: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main worker message handler
 */
self.onmessage = function (event: MessageEvent<WorkerMessage>) {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT_WORKER':
      // Worker initialization - could be used for loading additional dependencies
      self.postMessage({
        type: 'INIT_COMPLETE',
        payload: { success: true }
      });
      break;

    case 'PROCESS_CHUNK':
      const chunk = payload as WorkerChunk;
      const result = processChunk(chunk);

      if (result.error) {
        self.postMessage({
          type: 'CHUNK_ERROR',
          payload: {
            chunkId: result.chunkId,
            error: result.error
          }
        });
      } else {
        self.postMessage({
          type: 'CHUNK_RESULT',
          payload: result
        });
      }
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

/**
 * Handle worker errors
 */
self.onerror = function (error) {
  console.error('Worker error:', error);
  const errorMessage = typeof error === 'string' ? error :
    (error instanceof ErrorEvent ? error.message : 'Unknown error');
  const filename = error instanceof ErrorEvent ? error.filename : '';
  const lineno = error instanceof ErrorEvent ? error.lineno : 0;
  const colno = error instanceof ErrorEvent ? error.colno : 0;

  self.postMessage({
    type: 'WORKER_ERROR',
    payload: {
      message: errorMessage,
      filename: filename,
      lineno: lineno,
      colno: colno
    }
  });
};

// Export for TypeScript compilation (won't be used in worker context)
export { };
