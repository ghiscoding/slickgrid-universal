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
The SQL Backend Service enables Slickgrid-Universal to connect to SQL-based data sources (e.g., PostgreSQL, MySQL, MSSQL, SQLite) with robust support for filtering, sorting, pagination, and total count extraction. It is designed for real-world SQL compatibility and matches the result shape and pagination logic of existing backend services.

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
| Option              | Type     | Description                                                                 |
|---------------------|----------|-----------------------------------------------------------------------------|
| `tableName`         | string   | **Required.** Name of the SQL table to query (e.g., 'users').               |
| `datasetName`       | string   | (Optional) Schema/database prefix, or legacy dataset name.                   |
| `totalCountField`   | string   | (Optional) Custom field name for total count column (default: 'total_count').|

## Result Shape
The SQL backend supports multiple result shapes for maximum compatibility:

### 1. Array of Rows (Minimal)
```json
[
  { "id": 1, "name": "John", "total_count": 2 },
  { "id": 2, "name": "Jane", "total_count": 2 }
]
```

### 2. Object with Data Array
```json
{
  "data": [
    { "id": 1, "name": "John", "total_count": 2 },
    { "id": 2, "name": "Jane", "total_count": 2 }
  ]
}
```

### 3. Object with Data Array and Pagination
```json
{
  "data": [ ... ],
  "pagination": { "totalItems": 2 }
}
```

### 4. Top-Level Total Count
```json
{
  "data": [ ... ],
  "total_count": 2
}
```

The service will extract the total count from any of these shapes, prioritizing the `pagination.totalItems` property, then `total_count` (or your custom field), or by inspecting the first row if present.

## Pagination & Total Count
For paginated queries, use SQL window functions to include the total count in each row:

```sql
SELECT id, name, COUNT(*) OVER() AS total_count FROM users LIMIT 10 OFFSET 0;
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
