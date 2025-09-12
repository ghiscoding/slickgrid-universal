import type { WorkerChunk, WorkerChunkResult } from './formatterSerializer.js';

/**
 * Message types for communication between main thread and worker
 */
export interface WorkerMessage {
  type: 'PROCESS_CHUNK' | 'INIT_WORKER' | 'CHUNK_RESULT' | 'CHUNK_ERROR';
  payload: any;
}

/**
 * Configuration options for the worker manager
 */
export interface WorkerManagerOptions {
  maxConcurrentChunks: number;
  workerTimeout: number; // milliseconds
  enableFallback: boolean;
}

/**
 * Manages web worker lifecycle and communication for Excel export processing
 */
export class WorkerManager {
  private worker: Worker | null = null;
  private isWorkerSupported = false;
  private pendingChunks = new Map<string, {
    resolve: (result: WorkerChunkResult) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();
  private options: WorkerManagerOptions;

  constructor(options: Partial<WorkerManagerOptions> = {}) {
    this.options = {
      maxConcurrentChunks: options.maxConcurrentChunks || 4,
      workerTimeout: options.workerTimeout || 30000, // 30 seconds
      enableFallback: options.enableFallback !== false,
    };

    this.checkWorkerSupport();
  }

  /**
   * Check if web workers are supported in the current environment
   */
  private checkWorkerSupport(): void {
    try {
      this.isWorkerSupported = typeof Worker !== 'undefined' && typeof Blob !== 'undefined';
    } catch (error) {
      this.isWorkerSupported = false;
    }
  }

  /**
   * Initialize the web worker
   */
  async initializeWorker(): Promise<boolean> {
    if (!this.isWorkerSupported) {
      return false;
    }

    try {
      // Create worker from inline script to avoid CSP issues with external files
      const workerScript = this.createWorkerScript();
      const blob = new Blob([workerScript], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      this.worker = new Worker(workerUrl);
      this.setupWorkerEventHandlers();

      // Clean up the blob URL
      URL.revokeObjectURL(workerUrl);

      // Send initialization message
      await this.sendMessage({ type: 'INIT_WORKER', payload: {} });

      return true;
    } catch (error) {
      console.warn('Failed to initialize web worker:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Set up event handlers for the worker
   */
  private setupWorkerEventHandlers(): void {
    if (!this.worker) return;

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'CHUNK_RESULT':
          this.handleChunkResult(payload);
          break;
        case 'CHUNK_ERROR':
          this.handleChunkError(payload);
          break;
      }
    };

    this.worker.onerror = (error) => {
      console.error('Worker error:', error);
      this.handleWorkerError(error);
    };

    this.worker.onmessageerror = (error) => {
      console.error('Worker message error:', error);
      this.handleWorkerError(error);
    };
  }

  /**
   * Send a message to the worker
   */
  private async sendMessage(message: WorkerMessage): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      try {
        this.worker.postMessage(message);
        resolve();
      } catch (error) {
        if (error instanceof Error && error.name === 'DataCloneError') {
          reject(new Error(`Failed to serialize data for worker: ${error.message}. Ensure all data is serializable (no HTML elements, functions, or complex objects).`));
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Process a chunk of data using the web worker
   */
  async processChunk(chunk: WorkerChunk): Promise<WorkerChunkResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingChunks.delete(chunk.chunkId);
        reject(new Error(`Worker timeout for chunk ${chunk.chunkId}`));
      }, this.options.workerTimeout);

      this.pendingChunks.set(chunk.chunkId, {
        resolve,
        reject,
        timeout,
      });

      this.sendMessage({
        type: 'PROCESS_CHUNK',
        payload: chunk,
      }).catch(reject);
    });
  }

  /**
   * Process multiple chunks with concurrency control
   */
  async processChunks(chunks: WorkerChunk[]): Promise<WorkerChunkResult[]> {
    const results: WorkerChunkResult[] = [];
    const concurrency = Math.min(this.options.maxConcurrentChunks, chunks.length);

    // Process chunks in batches to control concurrency
    for (let i = 0; i < chunks.length; i += concurrency) {
      const batch = chunks.slice(i, i + concurrency);
      const batchPromises = batch.map(chunk => this.processChunk(chunk));

      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      } catch (error) {
        // If any chunk in the batch fails, we need to handle it appropriately
        console.error('Batch processing failed:', error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Handle successful chunk processing result
   */
  private handleChunkResult(result: WorkerChunkResult): void {
    const pending = this.pendingChunks.get(result.chunkId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingChunks.delete(result.chunkId);
      pending.resolve(result);
    }
  }

  /**
   * Handle chunk processing error
   */
  private handleChunkError(payload: { chunkId: string; error: string; }): void {
    const pending = this.pendingChunks.get(payload.chunkId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingChunks.delete(payload.chunkId);
      pending.reject(new Error(payload.error));
    }
  }

  /**
   * Handle general worker errors
   */
  private handleWorkerError(error: any): void {
    // Reject all pending chunks
    for (const [chunkId, pending] of this.pendingChunks) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(`Worker error: ${error.message || error}`));
    }
    this.pendingChunks.clear();
  }

  /**
   * Check if web workers are supported
   */
  isSupported(): boolean {
    return this.isWorkerSupported;
  }

  /**
   * Clean up worker resources
   */
  cleanup(): void {
    // Clear all pending chunks
    for (const [, pending] of this.pendingChunks) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Worker cleanup'));
    }
    this.pendingChunks.clear();

    // Terminate worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  /**
   * Execute a task with fallback to main thread processing
   */
  async processWithFallback<T>(
    workerTask: () => Promise<T>,
    fallbackTask: () => Promise<T>
  ): Promise<T> {
    if (!this.options.enableFallback) {
      return await workerTask();
    }

    try {
      if (this.isWorkerSupported && this.worker) {
        return await workerTask();
      }
    } catch (error) {
      console.warn('Worker processing failed, falling back to main thread:', error);
    }

    return await fallbackTask();
  }

  /**
   * Create the worker script as a string
   * This includes the entire worker implementation inline to avoid CSP issues
   */
  private createWorkerScript(): string {
    return `
// Excel Formatter Worker Implementation
// This is an inline version of the worker to avoid CSP issues with external files

// FormatterSerializer implementation (inline)
const BUILT_IN_FORMATTERS_MAP = new Map([
  ['alignRight', 'alignRight'],
  ['bold', 'bold'],
  ['center', 'center'],
  ['checkmark', 'checkmark'],
  ['checkmarkMaterial', 'checkmarkMaterial'],
  ['complexObject', 'complexObject'],
  ['currency', 'currency'],
  ['currencyUsd', 'currencyUsd'],
  ['date', 'date'],
  ['dateEuro', 'dateEuro'],
  ['dateEuroShort', 'dateEuroShort'],
  ['dateIso', 'dateIso'],
  ['dateTime', 'dateTime'],
  ['dateTimeEuro', 'dateTimeEuro'],
  ['dateTimeEuroAmPm', 'dateTimeEuroAmPm'],
  ['dateTimeShortEuro', 'dateTimeShortEuro'],
  ['dateTimeShortIso', 'dateTimeShortIso'],
  ['dateTimeShortUs', 'dateTimeShortUs'],
  ['dateTimeUs', 'dateTimeUs'],
  ['dateTimeUsAmPm', 'dateTimeUsAmPm'],
  ['dateUs', 'dateUs'],
  ['dateUsShort', 'dateUsShort'],
  ['decimal', 'decimal'],
  ['dollar', 'dollar'],
  ['dollarColored', 'dollarColored'],
  ['dollarColoredBold', 'dollarColoredBold'],
  ['fakeHyperlink', 'fakeHyperlink'],
  ['hyperlink', 'hyperlink'],
  ['hyperlinkUriPrefix', 'hyperlinkUriPrefix'],
  ['icon', 'icon'],
  ['infoIcon', 'infoIcon'],
  ['italic', 'italic'],
  ['lowercase', 'lowercase'],
  ['mask', 'mask'],
  ['multiple', 'multiple'],
  ['percent', 'percent'],
  ['percentComplete', 'percentComplete'],
  ['percentCompleteBar', 'percentCompleteBar'],
  ['percentSymbol', 'percentSymbol'],
  ['progressBar', 'progressBar'],
  ['translate', 'translate'],
  ['translateBoolean', 'translateBoolean'],
  ['tree', 'tree'],
  ['treeExport', 'treeExport'],
  ['treeParseTotals', 'treeParseTotals'],
  ['uppercase', 'uppercase'],
  ['yesNo', 'yesNo'],
]);

// Basic built-in formatter implementations for worker
const WORKER_FORMATTERS = {
  alignRight: (row, cell, value) => value != null ? String(value) : '',
  bold: (row, cell, value) => value != null ? String(value) : '',
  center: (row, cell, value) => value != null ? String(value) : '',
  checkmark: (row, cell, value) => value ? '✓' : '',
  checkmarkMaterial: (row, cell, value) => value ? '✓' : '',
  complexObject: (row, cell, value, columnDef, dataContext) => {
    const field = columnDef.field || '';
    if (field.indexOf('.') > 0) {
      return field.split('.').reduce((obj, key) => obj && obj[key], dataContext) || '';
    }
    return value != null ? String(value) : '';
  },
  currency: (row, cell, value, columnDef, dataContext, grid) => {
    if (value == null) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return String(value);

    // Get parameters from column definition
    const params = columnDef?.params || {};
    const currencyPrefix = params.currencyPrefix || '$';
    const minDecimal = params.minDecimal || 2;
    const maxDecimal = params.maxDecimal || 4;
    const displayNegativeNumberWithParentheses = params.displayNegativeNumberWithParentheses || false;

    // Format the number with appropriate decimal places
    const decimalPlaces = Math.min(maxDecimal, Math.max(minDecimal, 2));
    const absNum = Math.abs(num);
    const formattedNum = absNum.toFixed(decimalPlaces);

    // Handle negative numbers with parentheses
    if (num < 0 && displayNegativeNumberWithParentheses) {
      return '(' + currencyPrefix + formattedNum + ')';
    } else {
      return (num < 0 ? '-' : '') + currencyPrefix + formattedNum;
    }
  },
  currencyUsd: (row, cell, value) => {
    if (value == null) return '';
    const num = parseFloat(value);
    return isNaN(num) ? String(value) : '$' + num.toFixed(2);
  },
  date: (row, cell, value) => {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  },
  dateIso: (row, cell, value) => {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toISOString().split('T')[0];
  },
  decimal: (row, cell, value) => {
    if (value == null) return '';
    const num = parseFloat(value);
    return isNaN(num) ? String(value) : num.toFixed(2);
  },
  dollar: (row, cell, value) => {
    if (value == null) return '';
    const num = parseFloat(value);
    return isNaN(num) ? String(value) : '$' + num.toFixed(2);
  },
  lowercase: (row, cell, value) => value != null ? String(value).toLowerCase() : '',
  percent: (row, cell, value) => {
    if (value == null) return '';
    const num = parseFloat(value);
    return isNaN(num) ? String(value) : (num * 100).toFixed(2) + '%';
  },
  percentSymbol: (row, cell, value) => {
    if (value == null) return '';
    const num = parseFloat(value);
    return isNaN(num) ? String(value) : num.toFixed(2) + '%';
  },
  translateBoolean: (row, cell, value) => value ? 'True' : 'False',
  uppercase: (row, cell, value) => value != null ? String(value).toUpperCase() : '',
  yesNo: (row, cell, value) => value ? 'Yes' : 'No',
};

// Format a number following options (simplified version for inline worker)
function formatInlineWorkerNumber(
  input,
  minDecimal = 2,
  maxDecimal = 4,
  wrapNegativeNumber = false,
  symbolPrefix = '',
  symbolSuffix = '',
  decimalSeparator = '.',
  thousandSeparator = ''
) {
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
  const formattedWithSymbols = symbolPrefix + formattedNumber + symbolSuffix;

  // Handle negative numbers
  if (isNegative) {
    if (wrapNegativeNumber) {
      return '(' + formattedWithSymbols + ')';
    } else {
      return '-' + formattedWithSymbols;
    }
  }

  return formattedWithSymbols;
}

// Group totals formatters for worker (CSP-compliant)
const WORKER_GROUP_TOTALS_FORMATTERS = {
  sumTotalsCurrency: (totals, columnDef, grid) => {
    const field = columnDef.field || '';
    const val = totals.sum?.[field];
    if (val == null || isNaN(val)) return '';

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

    // Format the number using the enhanced formatInlineWorkerNumber function
    const formattedNumber = formatInlineWorkerNumber(
      val,
      minDecimal,
      maxDecimal,
      wrapNegativeNumber,
      currencyPrefix,
      currencySuffix,
      decimalSeparator,
      thousandSeparator
    );

    return prefix + formattedNumber + suffix;
  },
  sumTotalsDollar: (totals, columnDef, grid) => {
    const field = columnDef.field || '';
    const val = totals.sum?.[field];
    if (val == null || isNaN(val)) return '';

    const params = columnDef?.params || {};
    const prefix = params.groupFormatterPrefix || '';
    const suffix = params.groupFormatterSuffix || '';

    const formattedNumber = '$' + Math.abs(val).toFixed(2);
    return prefix + (val < 0 ? '-' : '') + formattedNumber + suffix;
  },
  avgTotalsCurrency: (totals, columnDef, grid) => {
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
  },
  avgTotalsPercentage: (totals, columnDef, grid) => {
    console.log('=== avgTotalsPercentage START ===');
    console.log('Input totals:', totals);
    console.log('Input columnDef:', columnDef);

    const field = columnDef.field || '';
    console.log('Field:', field);

    let val = totals.avg?.[field];
    console.log('Raw val from totals.avg[' + field + ']:', val, 'type:', typeof val);

    if (val == null || isNaN(val)) {
      console.log('avgTotalsPercentage: No valid value, returning empty string');
      return '';
    }

    const params = columnDef?.params || {};
    console.log('Params:', params);

    let prefix = params.groupFormatterPrefix || '';
    const suffix = params.groupFormatterSuffix || '';
    console.log('Original prefix:', prefix);
    console.log('Suffix:', suffix);

    // Convert HTML prefix to plain text for Excel
    prefix = prefix.replace(/<[^>]*>/g, '');
    console.log('Cleaned prefix:', prefix);

    // Handle negative values
    if (val < 0) {
      console.log('Handling negative value:', val);
      val = Math.abs(val);
      if (!params.displayNegativeNumberWithParentheses) {
        prefix += '-';
        console.log('Added negative sign to prefix:', prefix);
      } else {
        const outputVal = Math.round(val);
        const result = prefix + '(' + outputVal + '%)' + suffix;
        console.log('Negative with parentheses result:', result);
        console.log('=== avgTotalsPercentage END (negative) ===');
        return result;
      }
    }

    // Format percentage
    const outputVal = Math.round(val);
    console.log('Rounded output value:', outputVal);

    const finalResult = prefix + outputVal + '%' + suffix;
    console.log('Final result:', finalResult, 'type:', typeof finalResult);
    console.log('=== avgTotalsPercentage END ===');

    return finalResult;
  },
};

function deserializeFormatter(serializedFormatter) {
  console.log('=== deserializeFormatter called ===');
  console.log('serializedFormatter:', serializedFormatter);
  if (!serializedFormatter) {
    console.log('No serializedFormatter, returning null');
    return null;
  }
  
  if (serializedFormatter.startsWith('BUILTIN:')) {
    const formatterName = serializedFormatter.substring(8);
    return WORKER_FORMATTERS[formatterName] || null;
    }
    
    if (serializedFormatter.startsWith('CUSTOM:')) {
      // CSP-compliant approach: Instead of using eval/new Function,
      // we'll try to match against known formatter patterns
      const functionString = serializedFormatter.substring(7);
      console.log('functionString:', functionString);

    // Try to identify common formatter patterns and map them to safe implementations
    const safeFormatter = createSafeFormatterFromString(functionString);
    if (safeFormatter) {
      return safeFormatter;
    }

    // If we can't create a safe version, log a warning and return null
    // This allows group totals formatters to be handled by deserializeGroupTotalsFormatter
    console.warn('CSP: Cannot deserialize custom formatter safely, returning null for group totals handling:', functionString.substring(0, 100) + '...');
    return null;
  }

  return null;
}

function createSafeFormatterFromString(functionString) {
  // Try to identify and recreate common formatter patterns without using eval
  // NOTE: This function should ONLY handle regular formatters (row, cell, value, columnDef, dataContext, grid)
  // Group totals formatters (totals, columnDef, grid) should return null to be handled by deserializeGroupTotalsFormatter

  // Check if this is a group totals formatter - if so, return null to let deserializeGroupTotalsFormatter handle it
  if (functionString.includes('totals.') ||
      functionString.includes('totals?.') ||
      functionString.includes('totals[') ||
      functionString.includes('(totals,') ||
      functionString.includes('(totals ') ||
      functionString.includes('totals, columnDef, grid')) {
    console.log('createSafeFormatterFromString: Detected group totals formatter, returning null for proper handling');
    return null;
  }

  // Pattern 1: Simple currency formatter
  if (functionString.includes('currencyPrefix') && functionString.includes('toFixed')) {
    return (row, cell, value, columnDef, dataContext, grid) => {
      if (value == null) return '';
      const num = parseFloat(value);
      if (isNaN(num)) return String(value);

      const params = columnDef?.params || {};
      const currencyPrefix = params.currencyPrefix || '$';
      const minDecimal = params.minDecimal || 2;
      const maxDecimal = params.maxDecimal || 4;
      const displayNegativeNumberWithParentheses = params.displayNegativeNumberWithParentheses || false;

      const decimalPlaces = Math.min(maxDecimal, Math.max(minDecimal, 2));
      const absNum = Math.abs(num);
      const formattedNum = absNum.toFixed(decimalPlaces);

      if (num < 0 && displayNegativeNumberWithParentheses) {
        return '(' + currencyPrefix + formattedNum + ')';
      } else {
        return (num < 0 ? '-' : '') + currencyPrefix + formattedNum;
      }
    };
  }

  // Pattern 2: Simple number formatter
  if (functionString.includes('toFixed') && !functionString.includes('currency')) {
    return (row, cell, value, columnDef, dataContext, grid) => {
      if (value == null) return '';
      const num = parseFloat(value);
      if (isNaN(num)) return String(value);

      const params = columnDef?.params || {};
      const minDecimal = params.minDecimal || 2;
      const maxDecimal = params.maxDecimal || 4;
      const decimalPlaces = Math.min(maxDecimal, Math.max(minDecimal, 2));

      return num.toFixed(decimalPlaces);
    };
  }

  // Pattern 3: Percentage formatter
  if (functionString.includes('%') || functionString.includes('percent')) {
    return (row, cell, value, columnDef, dataContext, grid) => {
      if (value == null) return '';
      const num = parseFloat(value);
      if (isNaN(num)) return String(value);

      return (num * 100).toFixed(2) + '%';
    };
  }

  return null; // Cannot safely recreate this formatter
}

function createFallbackFormatter() {
  // Return a safe fallback formatter that just returns the value as string
  return (row, cell, value, columnDef, dataContext, grid) => {
    return value != null ? String(value) : '';
  };
}

function createMockGrid(gridOptions) {
  return {
    getOptions: () => gridOptions,
  };
}

function getFieldValue(dataContext, fieldPath) {
  if (!fieldPath || !dataContext) return null;

  if (fieldPath.indexOf('.') === -1) {
    return dataContext[fieldPath];
  }

  return fieldPath.split('.').reduce((obj, key) => {
    return obj && obj.hasOwnProperty(key) ? obj[key] : null;
  }, dataContext);
}

function shouldApplyFormatter(column, exportOptions) {
  if (column.hasOwnProperty('exportWithFormatter')) {
    return !!column.exportWithFormatter;
  }

  if (exportOptions?.hasOwnProperty('exportWithFormatter')) {
    return !!exportOptions.exportWithFormatter;
  }

  return false;
}

function processFormatterForCell(row, col, cellValue, column, dataContext, mockGrid) {
  const formatter = deserializeFormatter(column.formatter);

  if (!formatter) {
    return cellValue != null ? String(cellValue) : '';
  }

  try {
    const result = formatter(row, col, cellValue, column, dataContext, mockGrid);

    if (typeof result === 'string') {
      return result;
    } else if (typeof result === 'number') {
      return String(result);
    } else if (result && typeof result === 'object') {
      if ('html' in result) {
        return result.html || '';
      } else if ('text' in result) {
        return result.text || '';
      }
    }

    return result != null ? String(result) : '';
  } catch (error) {
    console.warn('Formatter error for column ' + column.id + ':', error);
    return cellValue != null ? String(cellValue) : '';
  }
}

function processRow(rowIndex, rowData, columns, mockGrid, exportOptions) {
  const processedRow = [];

  for (let colIndex = 0; colIndex < columns.length; colIndex++) {
    const column = columns[colIndex];
    const fieldValue = getFieldValue(rowData, column.field);

    let cellValue;

    if (shouldApplyFormatter(column, exportOptions) && (column.formatter || column.exportCustomFormatter)) {
      const formatterColumn = column.exportCustomFormatter ?
        { ...column, formatter: column.exportCustomFormatter } :
        column;

      cellValue = processFormatterForCell(
        rowIndex,
        colIndex,
        fieldValue,
        formatterColumn,
        rowData,
        mockGrid
      );
    } else {
      cellValue = fieldValue != null ? String(fieldValue) : '';
    }

    if (exportOptions?.sanitizeDataExport && typeof cellValue === 'string') {
      cellValue = cellValue.replace(/<[^>]*>/g, '');
    }

    processedRow.push(cellValue);
  }

  return processedRow;
}

function processGroupRow(workerRowData, chunk) {
  // Process group header row
  const groupTitle = readGroupedRowTitle(workerRowData, chunk.exportOptions);

  return {
    type: 'group',
    data: [groupTitle],
    originalRowIndex: workerRowData.originalRowIndex,
    isGrouped: true,
    groupLevel: workerRowData.groupLevel || 0
  };
}

function processGroupTotalsRow(workerRowData, columns, mockGrid, exportOptions) {
  // Process group totals row with enhanced formatter support
  const groupingAggregatorRowText = exportOptions.groupingAggregatorRowText || '';
  const outputData = [groupingAggregatorRowText];

  console.log('Inline Worker processGroupTotalsRow - data:', workerRowData.data);

  // Process each column for group totals
  columns.forEach((columnDef) => {
    let itemData = '';
    const fieldType = getInlineColumnFieldType(columnDef);
    const skippedField = columnDef.excludeFromExport || false;

    if (!skippedField) {
      // Add logging for percentage columns
      if (columnDef.field === 'percentComplete' ||
          (columnDef.groupTotalsFormatter &&
           (columnDef.groupTotalsFormatter.includes('Percentage') ||
            columnDef.groupTotalsFormatter.includes('percentage')))) {
        console.log('=== PROCESSING PERCENTAGE COLUMN ===');
        console.log('Column:', columnDef.field);
        console.log('Has exportCustomGroupTotalsFormatter:', !!columnDef.exportCustomGroupTotalsFormatter);
        console.log('exportCustomGroupTotalsFormatter value:', columnDef.exportCustomGroupTotalsFormatter);
        console.log('Has groupTotalsFormatter:', !!columnDef.groupTotalsFormatter);
        console.log('groupTotalsFormatter value:', columnDef.groupTotalsFormatter);
        console.log('Totals data for this column:', workerRowData.data);
      }

      // Check for custom group totals formatter first
      if (columnDef.exportCustomGroupTotalsFormatter) {
        console.log('Using exportCustomGroupTotalsFormatter path for column:', columnDef.field);
        const totalResult = processInlineCustomGroupTotalsFormatter(
          workerRowData.data,
          columnDef,
          mockGrid
        );
        itemData = totalResult;
      } else if (columnDef.groupTotalsFormatter) {
        console.log('Using groupTotalsFormatter path for column:', columnDef.field);
        // Process regular group totals formatter
        const totalResult = processInlineGroupTotalsFormatter(
          workerRowData.data,
          columnDef,
          mockGrid
        );
        itemData = totalResult;
      } else {
        console.log('Using basic aggregation path for column:', columnDef.field);
        // Use basic aggregation value extraction
        itemData = getInlineWorkerGroupTotalValue(workerRowData.data, columnDef);
      }

      // Convert to simple value for safe worker communication
      itemData = convertInlineToSimpleValue(itemData);

      // Sanitize data if requested
      if (typeof itemData === 'string' && (columnDef.sanitizeDataExport || exportOptions.sanitizeDataExport)) {
        itemData = itemData.replace(/<[^>]*>/g, '');
      }

      console.log('Inline Worker group total for ' + columnDef.field + ':', itemData);

      // Log final result for percentage columns
      if (columnDef.field === 'percentComplete' ||
          (columnDef.groupTotalsFormatter &&
           (columnDef.groupTotalsFormatter.includes('Percentage') ||
            columnDef.groupTotalsFormatter.includes('percentage')))) {
        console.log('Final itemData for percentage column:', itemData, 'type:', typeof itemData);
        console.log('=== END PROCESSING PERCENTAGE COLUMN ===');
      }
    }

    // Add the column data (unless user wants to skip it)
    if ((columnDef.width === undefined || columnDef.width > 0) && !skippedField) {
      outputData.push(itemData);
    }
  });

  console.log('Inline Worker processGroupTotalsRow - outputData:', outputData);

  return {
    type: 'groupTotals',
    data: outputData,
    originalRowIndex: workerRowData.originalRowIndex,
    isGrouped: true,
    groupLevel: workerRowData.groupLevel || 0
  };
}

function processInlineCustomGroupTotalsFormatter(totals, columnDef, mockGrid) {
  if (!columnDef.exportCustomGroupTotalsFormatter) {
    return '';
  }

  try {
    // First try to deserialize as a regular formatter
    let formatter = deserializeFormatter(columnDef.exportCustomGroupTotalsFormatter);

    // If that fails, try to match against known group totals formatters
    if (!formatter) {
      formatter = deserializeGroupTotalsFormatter(columnDef.exportCustomGroupTotalsFormatter);
    }

    if (formatter) {
      const result = formatter(totals, columnDef, mockGrid);

      // Handle HTMLElement results by extracting text content (worker-safe)
      if (result && typeof result === 'object' && result.textContent) {
        return result.textContent || '';
      }

      return typeof result === 'string' ? result : String(result || '');
    }
  } catch (error) {
    console.warn('Custom group totals formatter error for column ' + columnDef.id + ':', error);
  }

  return '';
}

function processInlineGroupTotalsFormatter(totals, columnDef, mockGrid) {
  if (!columnDef.groupTotalsFormatter) {
    return '';
  }

  try {
    // First try to deserialize as a regular formatter
    let formatter = deserializeFormatter(columnDef.groupTotalsFormatter);

    // If that fails, try to match against known group totals formatters
    if (!formatter) {
      formatter = deserializeGroupTotalsFormatter(columnDef.groupTotalsFormatter);
    }

    if (formatter) {
      console.log('totals:', totals);
      console.log('columnDef:', columnDef);
      console.log('mockGrid:', mockGrid);
      const result = formatter(totals, columnDef, mockGrid);
      console.log('result:', result);

      // Add specific logging for percentage columns
      if (columnDef.field === 'percentComplete' ||
          (columnDef.groupTotalsFormatter &&
           (columnDef.groupTotalsFormatter.includes('Percentage') ||
            columnDef.groupTotalsFormatter.includes('percentage')))) {
        console.log('=== PERCENTAGE COLUMN RESULT PROCESSING ===');
        console.log('Column field:', columnDef.field);
        console.log('Result value:', result);
        console.log('Result type:', typeof result);
        console.log('Result constructor:', result?.constructor?.name);
        if (result && typeof result === 'object') {
          console.log('Result object keys:', Object.keys(result));
          console.log('Result object values:', Object.values(result));
        }
        console.log('=== END PERCENTAGE COLUMN RESULT PROCESSING ===');
      }

      console.log('Group totals formatter result for ' + columnDef.field + ':', {
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
          console.log('Extracted textContent: "' + result.textContent + '"');
          return result.textContent || '';
        }
        if (result.innerText !== undefined) {
          console.log('Extracted innerText: "' + result.innerText + '"');
          return result.innerText || '';
        }
        if (result.innerHTML !== undefined) {
          console.log('Extracted innerHTML: "' + result.innerHTML + '"');
          return result.innerHTML || '';
        }
        // If it's an object but no text properties, try to stringify it properly
        console.warn('Object result without text properties, converting to string:', result);
        return JSON.stringify(result);
      }

      const finalResult = typeof result === 'string' ? result : String(result || '');
      console.log('Final group totals result for ' + columnDef.field + ': "' + finalResult + '"');

      // Log final conversion for percentage columns
      if (columnDef.field === 'percentComplete' ||
          (columnDef.groupTotalsFormatter &&
           (columnDef.groupTotalsFormatter.includes('Percentage') ||
            columnDef.groupTotalsFormatter.includes('percentage')))) {
        console.log('Final converted result for percentage column:', finalResult);
      }

      return finalResult;
    }
  } catch (error) {
    console.warn('Group totals formatter error for column ' + columnDef.id + ':', error);
  }

  return '';
}

function deserializeGroupTotalsFormatter(serializedFormatter) {
  console.log('=== deserializeGroupTotalsFormatter START ===');
  console.log('Input serializedFormatter:', serializedFormatter);

  if (!serializedFormatter) {
    console.log('No serializedFormatter provided, returning null');
    return null;
  }

  if (serializedFormatter.startsWith('BUILTIN:')) {
    const formatterName = serializedFormatter.substring(8);
    console.log('BUILTIN formatter detected, name:', formatterName);
    const formatter = WORKER_GROUP_TOTALS_FORMATTERS[formatterName] || null;
    console.log('Found BUILTIN formatter:', !!formatter);
    return formatter;
  }

  if (serializedFormatter.startsWith('CUSTOM:')) {
    const functionString = serializedFormatter.substring(7);
    console.log('CUSTOM formatter detected');
    console.log('functionString:', functionString);

    // Enhanced pattern matching for group totals formatters
    console.log('Inline CSP: Trying to identify group totals formatter pattern:', functionString.substring(0, 200) + '...');

    if (functionString.includes('sumTotalsCurrency') ||
        functionString.includes('sumTotalsCurrencyFormatter') ||
        (functionString.includes('totals.sum') && functionString.includes('currency')) ||
        (functionString.includes('sum?.[field]') && (functionString.includes('currencyPrefix') || functionString.includes('€')))) {
      console.log('Inline CSP: Identified as sumTotalsCurrency formatter');
      return WORKER_GROUP_TOTALS_FORMATTERS.sumTotalsCurrency;
    }

    if (functionString.includes('sumTotalsDollar') ||
        functionString.includes('sumTotalsDollarFormatter') ||
        (functionString.includes('totals.sum') && functionString.includes('dollar')) ||
        (functionString.includes('sum?.[field]') && functionString.includes('$'))) {
      console.log('Inline CSP: Identified as sumTotalsDollar formatter');
      return WORKER_GROUP_TOTALS_FORMATTERS.sumTotalsDollar;
    }

    if (functionString.includes('avgTotalsCurrency') ||
        functionString.includes('avgTotalsCurrencyFormatter') ||
        (functionString.includes('totals.avg') && functionString.includes('currency')) ||
        (functionString.includes('avg?.[field]') && (functionString.includes('currencyPrefix') || functionString.includes('€')))) {
      console.log('Inline CSP: Identified as avgTotalsCurrency formatter');
      return WORKER_GROUP_TOTALS_FORMATTERS.avgTotalsCurrency;
    }

    if (functionString.includes('avgTotalsPercentage') ||
        functionString.includes('avgTotalsPercentageFormatter') ||
        (functionString.includes('totals.avg') && functionString.includes('percentage')) ||
        (functionString.includes('avg?.[field]') && functionString.includes('%'))) {
      console.log('Inline CSP: Identified as avgTotalsPercentage formatter');
      console.log('Function string that matched:', functionString.substring(0, 200) + '...');
      return WORKER_GROUP_TOTALS_FORMATTERS.avgTotalsPercentage;
    }

    // Check for any sum-based formatter as fallback
    if (functionString.includes('totals.sum') || functionString.includes('sum?.[field]')) {
      console.log('Inline CSP: Identified as generic sum totals formatter, using currency formatter');
      return WORKER_GROUP_TOTALS_FORMATTERS.sumTotalsCurrency;
    }

    // Fallback: create a generic group totals formatter
    console.warn('Inline CSP: Using fallback group totals formatter for pattern:', functionString.substring(0, 100) + '...');
    return createFallbackGroupTotalsFormatter();
  }

  console.log('No pattern matched, returning null');
  console.log('=== deserializeGroupTotalsFormatter END ===');
  return null;
}

function createFallbackGroupTotalsFormatter() {
  return (totals, columnDef, grid) => {
    const field = columnDef.field || '';

    // Try different aggregation types
    const aggregationTypes = ['sum', 'avg', 'min', 'max', 'count'];

    for (const groupType of aggregationTypes) {
      const value = totals?.[groupType]?.[field];
      if (value !== undefined && value !== null) {
        if (typeof value === 'number') {
          return groupType === 'avg' ? value.toFixed(2) : value.toString();
        }
        return String(value);
      }
    }

    return '';
  };
}

function convertInlineToSimpleValue(value) {
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



function getInlineGroupTotalsExcelFormatId(columnDef, groupType) {
  // Simplified format detection for group totals
  if (columnDef.groupTotalsFormatter) {
    const formatterStr = columnDef.groupTotalsFormatter;
    if (typeof formatterStr === 'string') {
      if (formatterStr.includes('currency') || formatterStr.includes('dollar')) {
        return 164; // Currency format
      }
      if (formatterStr.includes('percent')) {
        return 10; // Percentage format
      }
    }
  }

  // Default number format based on group type
  if (groupType === 'avg') {
    return 2; // Number with 2 decimal places
  }

  return undefined; // No specific format
}

function getInlineColumnFieldType(column) {
  return column.type || 'string';
}

function getInlineWorkerGroupTotalValue(totals, columnDef) {
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

function processRegularRow(workerRowData, columns, mockGrid, exportOptions) {
  // Process regular data row (existing logic)
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

function readGroupedRowTitle(workerRowData, exportOptions) {
  // Worker version of readGroupedRowTitle
  let groupName = '';

  console.log('Inline Worker readGroupedRowTitle - workerRowData:', {
    groupTitle: workerRowData.groupTitle,
    dataTitle: workerRowData.data?.title,
    groupLevel: workerRowData.groupLevel,
    groupCollapsed: workerRowData.groupCollapsed
  });

  // Try to get title from multiple possible sources
  if (workerRowData.groupTitle) {
    // Use the original title stored in WorkerRowData (may have HTML)
    groupName = workerRowData.groupTitle.replace(/<[^>]*>/g, '');
    console.log('Inline Worker using groupTitle:', workerRowData.groupTitle, '-> cleaned:', groupName);
  } else if (workerRowData.data && workerRowData.data.title) {
    // Use title from sanitized data (should already be clean)
    groupName = workerRowData.data.title;
    console.log('Inline Worker using data.title:', groupName);
  } else {
    // Fallback: try to construct from data properties
    groupName = 'Group ' + (workerRowData.groupLevel || 0);
    console.log('Inline Worker using fallback:', groupName);
  }

  if (exportOptions && exportOptions.addGroupIndentation) {
    const collapsedSymbol = exportOptions.groupCollapsedSymbol || '⮞';
    const expandedSymbol = exportOptions.groupExpandedSymbol || '⮟';
    const chevron = workerRowData.groupCollapsed ? collapsedSymbol : expandedSymbol;
    const indentation = '     '.repeat(workerRowData.groupLevel || 0); // 5 spaces per level
    const result = chevron + ' ' + indentation + groupName;
    console.log('Inline Worker final group title:', result);
    return result;
  }

  console.log('Inline Worker final group title (no indentation):', groupName);
  return groupName;
}

function processChunk(chunk) {
  try {
    const mockGrid = createMockGrid(chunk.gridOptions);
    const processedRows = [];

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
      error: error.message || String(error),
    };
  }
}

// Main worker message handler
self.onmessage = function(event) {
  const { type, payload } = event.data;

  switch (type) {
    case 'INIT_WORKER':
      self.postMessage({
        type: 'INIT_COMPLETE',
        payload: { success: true }
      });
      break;

    case 'PROCESS_CHUNK':
      const chunk = payload;
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

self.onerror = function(error) {
  console.error('Worker error:', error);
  self.postMessage({
    type: 'WORKER_ERROR',
    payload: {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno
    }
  });
};
`;
  }
}
