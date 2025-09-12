import type { Column, Formatter, GridOption } from '@slickgrid-universal/common';
import { Formatters } from '@slickgrid-universal/common';

/**
 * Serializable version of Column for web worker communication
 */
export interface SerializableColumn {
  id: string | number;
  field: string;
  name?: string; // Always sanitized to string for worker communication
  formatter?: string | null;
  exportCustomFormatter?: string | null;
  exportCustomGroupTotalsFormatter?: string | null;
  groupTotalsFormatter?: string | null;
  exportWithFormatter?: boolean;
  excludeFromExport?: boolean;
  sanitizeDataExport?: boolean;
  params?: any; // Sanitized to remove non-serializable objects
  type?: string;
  width?: number;
  queryField?: string;
  queryFieldFilter?: string;
  queryFieldSorter?: string;
  // Excel export options
  excelExportOptions?: {
    autoDetectCellFormat?: boolean;
    style?: any;
    valueParserCallback?: string | null;
  };
  groupTotalsExcelExportOptions?: {
    groupType?: string;
    style?: any;
    valueParserCallback?: string | null;
  };
  // Add other serializable properties as needed
}

/**
 * Serializable version of GridOption for web worker communication
 */
export interface SerializableGridOptions {
  formatterOptions?: any;
  translater?: any; // Will need special handling for translation functions
  locale?: string;
  // Add other serializable grid options as needed
}

/**
 * Types of rows that can be processed by the worker
 */
export type WorkerRowType = 'regular' | 'group' | 'groupTotals';

/**
 * Enhanced row data structure for worker processing
 */
export interface WorkerRowData {
  type: WorkerRowType;
  data: any;
  originalRowIndex: number;
  isGrouped?: boolean;
  groupLevel?: number;
  groupTitle?: string;
  groupCollapsed?: boolean;
}

/**
 * Data structure for a chunk of rows to be processed by the worker
 */
export interface WorkerChunk {
  chunkId: string;
  startRow: number;
  endRow: number;
  rows: WorkerRowData[];
  columns: SerializableColumn[];
  gridOptions: SerializableGridOptions;
  exportOptions: any;
  hasGroupedItems?: boolean;
  datasetIdPropName?: string;
}

/**
 * Processed row result from worker
 */
export interface WorkerProcessedRow {
  type: WorkerRowType;
  data: Array<string | number>;
  originalRowIndex: number;
  isGrouped?: boolean;
  groupLevel?: number;
}

/**
 * Result from processing a chunk in the worker
 */
export interface WorkerChunkResult {
  chunkId: string;
  processedRows: WorkerProcessedRow[];
  error?: string;
}

/**
 * Utility class for serializing and deserializing formatters for web worker communication
 */
export class FormatterSerializer {
  /**
   * Sanitize data for web worker communication by converting non-serializable objects to strings
   */
  static sanitizeDataForWorker(data: any, visited: WeakSet<object> = new WeakSet()): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle circular references
    if (typeof data === 'object' && visited.has(data)) {
      console.warn('Circular reference detected, breaking cycle:', data.constructor?.name || 'Object');
      return '[Circular Reference]';
    }

    // Handle primitive types
    if (typeof data === 'string') {
      // Strip HTML tags from strings for worker serialization
      return data.replace(/<[^>]*>/g, '');
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return data;
    }

    // Handle Date objects
    if (data instanceof Date) {
      return data.toISOString();
    }

    // Handle HTML elements - convert to text content or string representation
    if (data instanceof HTMLElement) {
      console.warn('Converting HTMLElement to text for worker serialization:', data.tagName, data.textContent);
      return data.textContent || data.innerText || data.toString();
    }

    // Handle DocumentFragment
    if (data instanceof DocumentFragment) {
      console.warn('Converting DocumentFragment to text for worker serialization:', data.textContent);
      return data.textContent || '';
    }

    // Handle arrays
    if (Array.isArray(data)) {
      visited.add(data);
      return data.map(item => this.sanitizeDataForWorker(item, visited));
    }

    // Handle plain objects
    if (typeof data === 'object' && data.constructor === Object) {
      visited.add(data);
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeDataForWorker(value, visited);
      }
      return sanitized;
    }

    // Handle functions - convert to string representation
    if (typeof data === 'function') {
      console.warn('Converting function to string for worker serialization:', data.name || 'anonymous');
      return data.toString();
    }

    // Handle other object types that might not be serializable
    if (typeof data === 'object') {
      visited.add(data);

      // Special handling for SlickGroupTotals to avoid circular references
      if (data.constructor?.name === 'SlickGroupTotals' || data.__groupTotals === true) {
        return this.sanitizeGroupTotalsData(data, visited);
      }

      // Special handling for SlickGroup to avoid circular references
      if (data.constructor?.name === 'SlickGroup' || data.__group === true) {
        return this.sanitizeGroupData(data, visited);
      }

      // Try to handle common non-serializable objects
      if (data.constructor && data.constructor.name) {
        console.warn(`Converting ${data.constructor.name} object to string for worker serialization`);
      }

      // Try to extract meaningful data
      if (data.toString && typeof data.toString === 'function') {
        try {
          const stringValue = data.toString();
          if (stringValue !== '[object Object]') {
            return stringValue;
          }
        } catch (e) {
          // toString failed, continue to fallback
        }
      }

      // Try to convert to JSON if possible (this should now work without circular refs)
      try {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(data)) {
          sanitized[key] = this.sanitizeDataForWorker(value, visited);
        }
        return sanitized;
      } catch (e) {
        console.warn('Failed to sanitize object, converting to string:', e);
        return String(data);
      }
    }

    // For any other types, try to convert to string
    try {
      return String(data);
    } catch (error) {
      console.warn('Failed to sanitize data for worker:', error);
      return null;
    }
  }

  /**
   * Sanitize SlickGroupTotals data to avoid circular references
   */
  static sanitizeGroupTotalsData(data: any, visited: WeakSet<object>): any {
    const sanitized: any = {
      __groupTotals: true,
      initialized: data.initialized
    };

    // Copy aggregation data (sum, avg, min, max, count) without the circular group reference
    const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];
    for (const aggType of aggregationTypes) {
      if (data[aggType]) {
        sanitized[aggType] = this.sanitizeDataForWorker(data[aggType], visited);
      }
    }

    // Include group info without circular reference
    if (data.group) {
      sanitized.group = {
        level: data.group.level,
        value: data.group.value,
        count: data.group.count,
        collapsed: data.group.collapsed
      };
    }

    return sanitized;
  }

  /**
   * Sanitize SlickGroup data to avoid circular references
   */
  static sanitizeGroupData(data: any, _visited: WeakSet<object>): any {
    const sanitized: any = {
      __group: true,
      level: data.level,
      count: data.count,
      value: data.value,
      title: data.title,
      collapsed: data.collapsed,
      groupingKey: data.groupingKey
    };

    // Don't include the circular totals reference
    // The totals will be processed separately as their own row

    return sanitized;
  }

  /**
   * Sanitize a row of data for worker processing
   */
  static sanitizeRowData(rowData: any): any {
    return this.sanitizeDataForWorker(rowData);
  }

  /**
   * Check if data is serializable for web worker communication
   */
  static isSerializable(data: any): boolean {
    try {
      // First try structuredClone if available (modern browsers)
      if (typeof structuredClone === 'function') {
        structuredClone(data);
        return true;
      }

      // Fallback to JSON serialization test
      JSON.stringify(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find non-serializable properties in an object
   */
  static findNonSerializableProperties(obj: any, path = ''): string[] {
    const issues: string[] = [];

    if (obj === null || obj === undefined) {
      return issues;
    }

    // Check if the object itself is serializable
    if (!this.isSerializable(obj)) {
      // If it's a primitive that failed, that's unusual
      if (typeof obj !== 'object') {
        issues.push(`${path}: ${typeof obj} value is not serializable`);
        return issues;
      }

      // For objects, check each property
      if (typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (!this.isSerializable(value)) {
            if (typeof value === 'function') {
              issues.push(`${currentPath}: function`);
            } else if (value instanceof HTMLElement) {
              issues.push(`${currentPath}: HTMLElement (${value.tagName})`);
            } else if (value instanceof DocumentFragment) {
              issues.push(`${currentPath}: DocumentFragment`);
            } else if (typeof value === 'object' && value !== null) {
              issues.push(`${currentPath}: ${value.constructor?.name || 'unknown object'}`);
              // Recursively check nested objects (but limit depth)
              if (path.split('.').length < 3) {
                issues.push(...this.findNonSerializableProperties(value, currentPath));
              }
            } else {
              issues.push(`${currentPath}: ${typeof value}`);
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validate that chunk data is serializable before sending to worker
   */
  static validateChunkData(chunk: any): { isValid: boolean; errors: string[]; } {
    const errors: string[] = [];

    // Check if the entire chunk is serializable
    if (!this.isSerializable(chunk)) {
      errors.push('Chunk contains non-serializable data');

      // Find specific problematic properties
      const detailedIssues = this.findNonSerializableProperties(chunk, 'chunk');
      errors.push(...detailedIssues);
    }

    // Check specific problematic areas with more detail
    if (chunk.rows && chunk.rows.length > 0) {
      for (let i = 0; i < Math.min(chunk.rows.length, 3); i++) { // Check first 3 rows
        const row = chunk.rows[i];
        if (!this.isSerializable(row)) {
          errors.push(`Row ${i} contains non-serializable data`);
          const rowIssues = this.findNonSerializableProperties(row, `row[${i}]`);
          errors.push(...rowIssues.slice(0, 5)); // Limit to first 5 issues per row
        }
      }
    }

    if (chunk.columns) {
      for (let i = 0; i < chunk.columns.length; i++) {
        const col = chunk.columns[i];
        if (!this.isSerializable(col)) {
          errors.push(`Column ${i} (${col.field || col.id}) contains non-serializable data`);
          const colIssues = this.findNonSerializableProperties(col, `column[${i}]`);
          errors.push(...colIssues.slice(0, 3)); // Limit to first 3 issues per column
        }
      }
    }

    if (chunk.gridOptions && !this.isSerializable(chunk.gridOptions)) {
      errors.push('GridOptions contains non-serializable data');
      const gridIssues = this.findNonSerializableProperties(chunk.gridOptions, 'gridOptions');
      errors.push(...gridIssues.slice(0, 5));
    }

    if (chunk.exportOptions && !this.isSerializable(chunk.exportOptions)) {
      errors.push('ExportOptions contains non-serializable data');
      const exportIssues = this.findNonSerializableProperties(chunk.exportOptions, 'exportOptions');
      errors.push(...exportIssues.slice(0, 5));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private static readonly BUILT_IN_FORMATTERS = new Map<Formatter, string>([
    [Formatters.checkmarkMaterial, 'checkmarkMaterial'],
    [Formatters.complexObject, 'complexObject'],
    [Formatters.currency, 'currency'],
    [Formatters.date, 'date'],
    [Formatters.dateEuro, 'dateEuro'],
    [Formatters.dateEuroShort, 'dateEuroShort'],
    [Formatters.dateIso, 'dateIso'],
    [Formatters.dateTimeEuro, 'dateTimeEuro'],
    [Formatters.dateTimeEuroAmPm, 'dateTimeEuroAmPm'],
    [Formatters.dateTimeShortEuro, 'dateTimeShortEuro'],
    [Formatters.dateTimeShortIso, 'dateTimeShortIso'],
    [Formatters.dateTimeShortUs, 'dateTimeShortUs'],
    [Formatters.dateTimeUs, 'dateTimeUs'],
    [Formatters.dateTimeUsAmPm, 'dateTimeUsAmPm'],
    [Formatters.dateUs, 'dateUs'],
    [Formatters.dateUsShort, 'dateUsShort'],
    [Formatters.decimal, 'decimal'],
    [Formatters.dollar, 'dollar'],
    [Formatters.dollarColored, 'dollarColored'],
    [Formatters.dollarColoredBold, 'dollarColoredBold'],
    [Formatters.hyperlink, 'hyperlink'],
    [Formatters.icon, 'icon'],
    [Formatters.mask, 'mask'],
    [Formatters.multiple, 'multiple'],
    [Formatters.percent, 'percent'],
    [Formatters.percentComplete, 'percentComplete'],
    [Formatters.percentCompleteBar, 'percentCompleteBar'],
    [Formatters.percentSymbol, 'percentSymbol'],
    [Formatters.progressBar, 'progressBar'],
    [Formatters.translate, 'translate'],
    [Formatters.translateBoolean, 'translateBoolean'],
    [Formatters.tree, 'tree'],
    [Formatters.treeExport, 'treeExport'],
    [Formatters.treeParseTotals, 'treeParseTotals'],
  ]);

  private static readonly FORMATTER_NAME_MAP = new Map<string, Formatter>();

  static {
    // Initialize reverse mapping
    for (const [formatter, name] of FormatterSerializer.BUILT_IN_FORMATTERS) {
      FormatterSerializer.FORMATTER_NAME_MAP.set(name, formatter);
    }
  }

  /**
   * Serialize a formatter function for web worker communication
   */
  static serializeFormatter(formatter: Formatter | undefined): string | null {
    if (!formatter) {
      return null;
    }

    // Check if it's a built-in formatter
    const builtInName = this.BUILT_IN_FORMATTERS.get(formatter);
    if (builtInName) {
      return `BUILTIN:${builtInName}`;
    }

    // For custom formatters, convert to string (with security considerations)
    if (typeof formatter === 'function') {
      try {
        return `CUSTOM:${formatter.toString()}`;
      } catch (error) {
        console.warn('Failed to serialize custom formatter:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Serialize a group totals formatter function for web worker communication
   */
  static serializeGroupTotalsFormatter(formatter: any): string | null {
    if (!formatter) {
      return null;
    }

    // For group totals formatters, we'll treat them similar to regular formatters
    // but they have a different signature: (totals, columnDef, grid)
    if (typeof formatter === 'function') {
      try {
        return `CUSTOM:${formatter.toString()}`;
      } catch (error) {
        console.warn('Failed to serialize group totals formatter:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Deserialize a formatter function from its serialized form
   */
  static deserializeFormatter(serializedFormatter: string | null): Formatter | null {
    if (!serializedFormatter) {
      return null;
    }

    if (serializedFormatter.startsWith('BUILTIN:')) {
      const formatterName = serializedFormatter.substring(8);
      return this.FORMATTER_NAME_MAP.get(formatterName) || null;
    }

    if (serializedFormatter.startsWith('CUSTOM:')) {
      const functionString = serializedFormatter.substring(7);
      try {
        // Note: This uses eval-like functionality which should be used carefully
        // In a production environment, you might want to implement a safer approach
        // or restrict custom formatters in worker mode
        return new Function('return ' + functionString)();
      } catch (error) {
        console.warn('Failed to deserialize custom formatter:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Convert a Column to a SerializableColumn for web worker communication
   */
  static serializeColumn(column: Column): SerializableColumn {
    return {
      id: column.id,
      field: column.field,
      name: this.sanitizeDataForWorker(column.name), // Sanitize name in case it's an HTMLElement
      formatter: this.serializeFormatter(column.formatter),
      exportCustomFormatter: this.serializeFormatter(column.exportCustomFormatter),
      exportCustomGroupTotalsFormatter: this.serializeGroupTotalsFormatter(column.exportCustomGroupTotalsFormatter),
      groupTotalsFormatter: this.serializeGroupTotalsFormatter(column.groupTotalsFormatter),
      exportWithFormatter: column.exportWithFormatter,
      excludeFromExport: column.excludeFromExport,
      sanitizeDataExport: column.sanitizeDataExport,
      params: this.sanitizeDataForWorker(column.params), // Sanitize params as well
      type: column.type,
      width: column.width,
      queryField: column.queryField,
      queryFieldFilter: column.queryFieldFilter,
      queryFieldSorter: column.queryFieldSorter,
      // Excel export options
      excelExportOptions: column.excelExportOptions ? {
        autoDetectCellFormat: column.excelExportOptions.autoDetectCellFormat,
        style: this.sanitizeDataForWorker(column.excelExportOptions.style),
        valueParserCallback: this.serializeFormatter(column.excelExportOptions.valueParserCallback as any),
      } : undefined,
      groupTotalsExcelExportOptions: column.groupTotalsExcelExportOptions ? {
        groupType: column.groupTotalsExcelExportOptions.groupType,
        style: this.sanitizeDataForWorker(column.groupTotalsExcelExportOptions.style),
        valueParserCallback: this.serializeFormatter(column.groupTotalsExcelExportOptions.valueParserCallback as any),
      } : undefined,
    };
  }

  /**
   * Convert a SerializableColumn back to a Column with deserialized formatters
   */
  static deserializeColumn(serializableColumn: SerializableColumn): Column {
    return {
      ...serializableColumn,
      formatter: this.deserializeFormatter(serializableColumn.formatter || null),
      exportCustomFormatter: this.deserializeFormatter(serializableColumn.exportCustomFormatter || null),
    } as Column;
  }

  /**
   * Convert GridOptions to SerializableGridOptions for web worker communication
   */
  static serializeGridOptions(gridOptions: GridOption): SerializableGridOptions {
    return {
      formatterOptions: gridOptions.formatterOptions,
      locale: gridOptions.locale,
      // Note: translater functions cannot be serialized directly
      // We'll need to handle translations differently in the worker
    };
  }

  /**
   * Check if a formatter is one of the built-in formatters
   */
  static isBuiltInFormatter(formatter: Formatter): boolean {
    return this.BUILT_IN_FORMATTERS.has(formatter);
  }

  /**
   * Get the name of a built-in formatter
   */
  static getBuiltInFormatterName(formatter: Formatter): string | undefined {
    return this.BUILT_IN_FORMATTERS.get(formatter);
  }

  /**
   * Get a built-in formatter by its name
   */
  static getBuiltInFormatterByName(name: string): Formatter | undefined {
    return this.FORMATTER_NAME_MAP.get(name);
  }
}
