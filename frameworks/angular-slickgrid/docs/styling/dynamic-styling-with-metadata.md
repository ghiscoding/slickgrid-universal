# Dynamic Styling with Item Metadata

## Overview

SlickGrid provides powerful mechanisms to apply CSS styling dynamically to grid cells based on item properties or runtime conditions. This guide shows how to use item metadata and the grid's styling APIs to create responsive, data-driven cell highlighting and styling.

## Table of Contents

- [Storing Metadata in Items](#storing-metadata-in-items)
- [Using setCellCssStyles for Dynamic Styling](#using-setcellcsssstyles-for-dynamic-styling)
- [Using Cell Metadata for Per-Cell Styling](#using-cell-metadata-for-per-cell-styling)
- [Common Use Cases](#common-use-cases)
- [Best Practices](#best-practices)

## Storing Metadata in Items

SlickGrid items are plain JavaScript objects. You can attach any metadata properties to items alongside your data properties:

```typescript
interface Item {
  id: number;
  name: string;
  price: number;
  // Custom metadata properties
  status?: 'active' | 'inactive' | 'pending';
  priority?: 'low' | 'medium' | 'high';
  isModified?: boolean;
  validationErrors?: string[];
  customData?: Record<string, any>;
}

const data: Item[] = [
  { id: 1, name: 'Product A', price: 100, status: 'active', priority: 'high', isModified: true },
  { id: 2, name: 'Product B', price: 200, status: 'inactive', priority: 'low' },
  { id: 3, name: 'Product C', price: 150, status: 'pending', validationErrors: ['Invalid price'] },
];
```

## Using setCellCssStyles for Dynamic Styling

The `setCellCssStyles(key, hash)` method is the primary way to apply CSS classes to grid cells dynamically. It uses a **style key** to manage overlays of CSS classes that can be added, modified, or removed independently.

### Basic API

```typescript
// Apply styles
grid.setCellCssStyles(key, hash);

// Remove styles
grid.removeCellCssStyles(key);

// Remove styles matching a predicate
grid.removeCellCssStylesBatch((key) => key.startsWith('highlight-'));
```

### Hash Structure

The hash follows a strict structure:

```typescript
interface CssStyleHash {
  [rowIndex: number]: {
    [columnId: string | number]: cssClassName // Single class or space-separated classes
  }
}
```

**Important:** Column keys MUST be column IDs (strings or numbers), NOT numeric indices.

### Example: Status-Based Highlighting

```typescript
// Define your CSS classes
const styles = `
  .status-active { background-color: #d4edda; }
  .status-inactive { background-color: #f8d7da; }
  .status-pending { background-color: #fff3cd; }
`;

// Function to apply styles based on item metadata
function highlightByStatus(grid: SlickGrid, data: Item[]) {
  const hash: Record<number, Record<string, string>> = {};

  data.forEach((item, rowIndex) => {
    if (item.status) {
      const className = `status-${item.status}`;
      const columns = grid.getColumns();

      // Apply to specific columns (e.g., 'name' and 'price')
      columns.forEach((col) => {
        if (col.id === 'name' || col.id === 'price') {
          if (!hash[rowIndex]) hash[rowIndex] = {};
          hash[rowIndex][col.id] = className;
        }
      });
    }
  });

  grid.setCellCssStyles('status-highlight', hash);
}

// Call on data load or update
highlightByStatus(grid, data);
```

### Example: Modified Rows Indicator

```typescript
function highlightModifiedRows(grid: SlickGrid, data: Item[]) {
  const hash: Record<number, Record<string, string>> = {};

  data.forEach((item, rowIndex) => {
    if (item.isModified) {
      hash[rowIndex] = {};
      // Add a visual indicator to the first cell of modified rows
      const firstCol = grid.getColumns()[0];
      if (firstCol) {
        hash[rowIndex][firstCol.id] = 'unsaved-changes modified-indicator';
      }
    }
  });

  grid.setCellCssStyles('modified-rows', hash);
}

// CSS
const styles = `
  .unsaved-changes { border-left: 4px solid #ff6b6b; }
  .modified-indicator { background-color: #ffe0e0; }
`;
```

## Using Cell Metadata for Per-Cell Styling

SlickGrid also supports metadata on individual cells through the `cssClasses` property:

```typescript
interface Item {
  id: number;
  name: string;
  cells?: {
    [columnId: string]: {
      cssClasses?: string;
      value?: any;
      // other cell metadata
    }
  }
}

const data: Item[] = [
  {
    id: 1,
    name: 'Product A',
    cells: {
      price: {
        cssClasses: 'price-high discount-eligible',
        value: 100
      }
    }
  }
];

// The grid formatter can use this metadata
const priceFormatter = (row: number, cell: number, value: any, columnDef: Column, item: Item) => {
  const cellMeta = item.cells?.[columnDef.id];
  const classes = cellMeta?.cssClasses || '';
  return `<span class="${classes}">${value}</span>`;
};
```

## Common Use Cases

### 1. Validation Error Highlighting

```typescript
function highlightValidationErrors(grid: SlickGrid, data: Item[]) {
  const hash: Record<number, Record<string, string>> = {};

  data.forEach((item, rowIndex) => {
    if (item.validationErrors && item.validationErrors.length > 0) {
      hash[rowIndex] = {};
      const columns = grid.getColumns();
      columns.forEach((col) => {
        if (!hash[rowIndex]) hash[rowIndex] = {};
        hash[rowIndex][col.id] = 'validation-error';
      });
    }
  });

  grid.setCellCssStyles('validation-errors', hash);
}

// CSS
const styles = `
  .validation-error {
    background-color: #ffcccc;
    border: 1px solid #ff6b6b;
  }
`;
```

### 2. Priority-Based Row Coloring

```typescript
function colorByPriority(grid: SlickGrid, data: Item[]) {
  const hash: Record<number, Record<string, string>> = {};
  const priorityClasses: Record<string, string> = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low'
  };

  data.forEach((item, rowIndex) => {
    if (item.priority) {
      hash[rowIndex] = {};
      grid.getColumns().forEach((col) => {
        if (!hash[rowIndex]) hash[rowIndex] = {};
        hash[rowIndex][col.id] = priorityClasses[item.priority];
      });
    }
  });

  grid.setCellCssStyles('priority-coloring', hash);
}

// CSS
const styles = `
  .priority-high { background-color: #ffe0e0; color: #c00; font-weight: bold; }
  .priority-medium { background-color: #fff3cd; color: #995500; }
  .priority-low { background-color: #e8f4f8; color: #004488; }
`;
```

### 3. Conditional Cell Styling

```typescript
function applyConditionalFormatting(grid: SlickGrid, data: Item[], rules: FormatRule[]) {
  const hash: Record<number, Record<string, string>> = {};

  data.forEach((item, rowIndex) => {
    rules.forEach((rule) => {
      if (rule.condition(item)) {
        if (!hash[rowIndex]) hash[rowIndex] = {};
        rule.affectedColumns.forEach((colId) => {
          if (!hash[rowIndex][colId]) {
            hash[rowIndex][colId] = rule.cssClass;
          } else {
            // Append class if column already has styling
            hash[rowIndex][colId] += ' ' + rule.cssClass;
          }
        });
      }
    });
  });

  grid.setCellCssStyles('conditional-formatting', hash);
}

interface FormatRule {
  condition: (item: Item) => boolean;
  affectedColumns: string[];
  cssClass: string;
}

// Example rules
const rules: FormatRule[] = [
  {
    condition: (item) => item.price > 500,
    affectedColumns: ['price'],
    cssClass: 'price-expensive'
  },
  {
    condition: (item) => item.isModified,
    affectedColumns: ['name', 'price'],
    cssClass: 'unsaved-changes'
  }
];
```

### 4. Search Result Highlighting

```typescript
function highlightSearchResults(grid: SlickGrid, data: Item[], searchTerm: string, searchColumns: string[]) {
  const hash: Record<number, Record<string, string>> = {};
  const searchLower = searchTerm.toLowerCase();

  data.forEach((item, rowIndex) => {
    searchColumns.forEach((colId) => {
      const value = String(item[colId as keyof Item] || '').toLowerCase();
      if (value.includes(searchLower)) {
        if (!hash[rowIndex]) hash[rowIndex] = {};
        hash[rowIndex][colId] = 'search-highlight';
      }
    });
  });

  grid.setCellCssStyles('search-results', hash);
}

// CSS
const styles = `
  .search-highlight {
    background-color: #ffeb3b;
    color: #000;
    font-weight: bold;
  }
`;
```

## Best Practices

### 1. Use Meaningful Style Keys

```typescript
// Good - descriptive keys that indicate purpose
grid.setCellCssStyles('validation-errors', hash);
grid.setCellCssStyles('unsaved-changes', hash);
grid.setCellCssStyles('search-highlights', hash);

// Avoid - vague keys
grid.setCellCssStyles('highlight', hash); // Which highlight?
grid.setCellCssStyles('style1', hash);    // Not descriptive
```

### 2. Manage Multiple Style Overlays

Different style keys can be applied simultaneously. The last applied style takes visual precedence:

```typescript
// Apply multiple independent styling layers
grid.setCellCssStyles('status-highlighting', statusHash);
grid.setCellCssStyles('validation-errors', validationHash);
grid.setCellCssStyles('search-highlights', searchHash);

// Later, remove only specific styling without affecting others
grid.removeCellCssStyles('search-highlights');
```

### 3. Handle Column ID Conversion

Always convert column indices to IDs when building the hash:

```typescript
// ✓ Correct - using column IDs
const columns = grid.getColumns();
const column = columns[cellIndex];
const columnId = column.id;
hash[row][columnId] = className;

// ✗ Wrong - using numeric indices
hash[row][cellIndex] = className; // Will not work
```

### 4. Batch Updates for Performance

If updating many rows, batch the operations:

```typescript
function updateStyling(grid: SlickGrid, data: Item[]) {
  // Build entire hash before applying
  const hash: Record<number, Record<string, string>> = {};

  // Populate hash for all rows
  data.forEach((item, rowIndex) => {
    // ... build styling for this row
  });

  // Single API call
  grid.setCellCssStyles('batch-styling', hash);
}

// Don't do this - multiple API calls are slower
data.forEach((item, rowIndex) => {
  grid.setCellCssStyles(`style-row-${rowIndex}`, {
    [rowIndex]: { columnId: className }
  });
});
```

### 5. Clean Up Unused Styles

Remove style keys that are no longer needed:

```typescript
// Remove specific styling
grid.removeCellCssStyles('old-highlighting');

// Remove multiple styles at once
['validation-errors', 'search-highlights', 'outdated-style'].forEach((key) => {
  grid.removeCellCssStyles(key);
});

// Remove all styles matching a pattern
grid.removeCellCssStylesBatch((key) => key.startsWith('temporary-'));
```

### 6. CSS Organization

Keep CSS organized by styling purpose:

```css
/* Status-based styling */
.status-active { background-color: #d4edda; }
.status-inactive { background-color: #f8d7da; }
.status-pending { background-color: #fff3cd; }

/* State indicators */
.unsaved-changes { border-left: 4px solid #ff6b6b; }
.validation-error { background-color: #ffcccc; }

/* User interaction */
.search-highlight { background-color: #ffeb3b; color: #000; font-weight: bold; }

/* Priority levels */
.priority-high { color: #c00; font-weight: bold; }
.priority-medium { color: #995500; }
.priority-low { color: #004488; }
```

## See Also

- [Styling Guide](./styling.md) - Theme and CSS variable customization
- [Dark Mode Guide](./dark-mode.md) - Dark mode specific styling
- SlickGrid API Documentation - `setCellCssStyles()` and related methods
