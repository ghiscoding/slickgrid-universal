# SQL Backend Service for Slickgrid-Universal

## Index
- [Introduction](#introduction)
- [Usage](#usage)
- [Options](#options)
- [Result Shape](#result-shape)
- [Pagination & Total Count](#pagination--total-count)
- [Customizing Total Count Field](#customizing-total-count-field)
- [Examples](#examples)
- [Integration Notes](#integration-notes)

---

## Introduction
The SQL Backend Service enables Slickgrid-Universal to connect to SQL-based data sources (e.g., PostgreSQL, MySQL, MSSQL, SQLite) with robust support for filtering, sorting, pagination, and total count extraction. It is designed for real-world SQL compatibility and matches the result shape and pagination logic of the OData and GraphQL backends.

> **Note:** `tableName` is required for SQL queries. `datasetName` is optional and used for schema/database prefixing or legacy compatibility.

## Usage
Import and configure the SQL backend service in your grid options. The service expects a SQL query result in a minimal, backend-agnostic shape, supporting both array and object result forms.

```ts
import { SqlService, SqlServiceApi, SqlPaginatedResult } from '@slickgrid-universal/sql-backend';

const gridOptions = {
  backendServiceApi: {
    service: new SqlService(),
    process: (query) => myApi.query(query),
    options: {
      tableName: 'users',
      // datasetName: 'public', // optional, for schema/database
      totalCountField: 'total_count' // optional, see below
    }
  } satisfies SqlServiceApi<MyRowType>,
};
```

## Options
| Option                    | Type     | Description                                                                 |
|---------------------------|----------|-----------------------------------------------------------------------------|
| `tableName`               | string   | **Required.** Name of the SQL table to query (e.g., 'users').               |
| `datasetName`             | string   | (Optional) Schema/database prefix, or legacy dataset name.                  |
| `totalCountField`         | string   | (Optional) Custom field name for total count column (default: 'totalCount').|
| `identifierEscapeStyle`   | string   | (Optional) How to escape SQL identifiers: `'doubleQuote'` (default, PostgreSQL/ANSI), `'backtick'` (MySQL), `'bracket'` (MSSQL). |
## Escaping SQL Identifiers

The SQL backend automatically escapes table, column, and schema identifiers to prevent SQL injection and ensure compatibility with different SQL dialects. You can control the escaping style using the `identifierEscapeStyle` option:

| Style         | Value         | Example Output         | Target Database(s)      |
|-------------- |-------------- |-----------------------|------------------------ |
| Double Quote  | `doubleQuote` | "myTable"             | PostgreSQL, ANSI SQL    |
| Backtick      | `backtick`    | `myTable`              | MySQL                  |
| Bracket       | `bracket`     | [myTable]              | MSSQL                  |

**Usage Example:**

```ts
const gridOptions = {
  backendServiceApi: {
    service: new SqlService(),
    options: {
      tableName: 'users',
      identifierEscapeStyle: 'backtick', // Use MySQL-style escaping
    }
  }
};
```

If not specified, the default is `'doubleQuote'` for maximum ANSI SQL compatibility (PostgreSQL, SQLite, etc.).

**How it works:**
- All identifiers (table, column, schema) are escaped using the selected style.
- This prevents SQL injection and ensures queries are valid for your target database.
- You can override the style at runtime by changing the `identifierEscapeStyle` option.

**Supported Styles:**
- `doubleQuote`: `"identifier"` (default, PostgreSQL/ANSI SQL)
- `backtick`: `` `identifier` `` (MySQL)
- `bracket`: `[identifier]` (MSSQL)

**Example Outputs:**

| Input            | doubleQuote        | backtick           | bracket         |
|------------------|-------------------|-------------------|----------------|
| userName         | `"userName"`      | `` `userName` ``  | `[userName]`   |
| order_items      | `"order_items"`   | `` `order_items` ``| `[order_items]`|
| customerAddress1 | `"customerAddress1"`| `` `customerAddress1` ``| `[customerAddress1]`|

See the `identifierEscapeStyle` option in the table above for configuration details.

## Result Shape
The SQL backend supports multiple result shapes for maximum compatibility:

### 1. Array of Rows (Minimal)
```json
[
  { "id": 1, "name": "John", "totalCount": 2 },
  { "id": 2, "name": "Jane", "totalCount": 2 }
]
```

### 2. Object with Data Array
```json
{
  "data": [
    { "id": 1, "name": "John", "totalCount": 2 },
    { "id": 2, "name": "Jane", "totalCount": 2 }
  ]
}
```

### 3. Object with Data Array and Pagination
```json
{
  "data": [ ... ],
  "pagination": { "totalCount": 2 }
}
```

### 4. Top-Level Total Count
```json
{
  "data": [ ... ],
  "totalCount": 2
}
```

The service will extract the total count from any of these shapes, prioritizing the `pagination.totalCount` property, then `totalCount` (or your custom field via `totalCountField` service option), or by inspecting the first row if present.

## Pagination & Total Count
For paginated queries, the SQL query will include the total count in each row:

```sql
SELECT id, name, COUNT(*) OVER() AS "totalCount" FROM "users" LIMIT 10 OFFSET 0;
```

The backend will extract the total count and provide it to the grid for pagination controls.

## Customizing Total Count Field
If your SQL uses a different name for the total count column, set the `totalCountField` option:

```ts
options: {
  tableName: 'users',
  // datasetName: 'public', // optional
  totalCountField: 'my_count_column'
}
```

## Examples
### Basic Integration
```ts
import { SqlService, SqlServiceApi } from '@slickgrid-universal/sql-backend';

type MyRowType = { id: number; name: string; total_count: number };

const gridOptions = {
  backendServiceApi: {
    service: new SqlService(),
    process: (query) => myApi.query(query),
    options: {
      tableName: 'users',
    }
  } satisfies SqlServiceApi<MyRowType>,
};
```

### Custom Total Count Field
```ts
options: {
  tableName: 'users',
  totalCountField: 'my_count_column'
} satisfies SqlServiceApi<MyRowType>
```

## Integration Notes
- The SQL backend is backend-agnostic: works with any SQL dialect that can provide a total count column.
- The result shape is minimal and flexible
- All pagination, filtering, and sorting are handled server-side.
## Updating Grid Data After SQL Query

To update the grid's dataset and pagination after fetching SQL results, use the `postProcess` callback in your `backendServiceApi` configuration. This is similar to the OData backend and ensures the grid reflects the latest data and total count for pagination.

**Example:**

```ts
import { SqlService, SqlServiceApi } from '@slickgrid-universal/sql-backend';

type MyRowType = { id: number; name: string; totalCount: number };

export class Example {
  gridOptions: GridOption;
  dataset = [];

  constructor(private myApi: MyApiService) {
    this.defineGrid();
  }

  defineGrid() {
    this.gridOptions = {
      enablePagination: true,
      pagination: {
        pageSizes: [10, 20, 50],
        pageSize: 10,
        totalItems: 0
      },
      backendServiceApi: {
        service: new SqlService(),
        options: {
          tableName: 'users',
          totalCountField: 'totalCount' // or your custom count field
        },
        process: (query) => this.myApi.query(query),
        postProcess: (response) => {
          // Extract data and total count from the response
          // The SqlService will update pagination.totalItems automatically if configured
          this.dataset = Array.isArray(response) ? response : response.data;
          // If you want to manually update pagination totalItems:
          // this.gridOptions.pagination.totalItems = extractTotalCount(response);
        }
      }
    };
  }
}

// Helper function (optional) to extract total count if needed
function extractTotalCount(response: any): number {
  if (response?.pagination?.totalCount) return response.pagination.totalCount;
  if (typeof response?.totalCount === 'number') return response.totalCount;
  if (Array.isArray(response?.data) && response.data.length > 0 && typeof response.data[0].totalCount === 'number') return response.data[0].totalCount;
  if (Array.isArray(response) && response.length > 0 && typeof response[0].totalCount === 'number') return response[0].totalCount;
  return 0;
}
```