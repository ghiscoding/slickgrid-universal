# AI Toolkit (`@slickgrid-universal/web-mcp`)

The AI Toolkit is an optional External Resource package that exposes SlickGrid data manipulation capabilities as [WebMCP](https://github.com/webmcp/webmcp) (Model Context Protocol) tools, allowing AI assistants running in the browser to read and manipulate a live grid via natural language.

It is inspired by the [AG Grid AI Toolkit](https://www.ag-grid.com/angular-data-grid/ai-toolkit/) and follows the same general pattern: provide the LLM with a structured schema of the grid so it understands what it can act on, then let it produce a state object that is applied back to the grid.

---

## How It Works

1. **Schema discovery** — the LLM calls `get_slickgrid_schema` to learn the columns available (id, type, sortable, filterable).
2. **State snapshot** — the LLM calls `get_slickgrid_state` to understand what filters/sorts/column visibility are currently active.
3. **Prompt + LLM call** — your application sends the user query, the schema and the current state to an LLM of your choice.
4. **State application** — the LLM response is passed to `apply_slickgrid_state`, which updates filters, sorting and column visibility in a single call.

```
User query
    │
    ▼
get_slickgrid_schema + get_slickgrid_state  →  LLM  →  apply_slickgrid_state
```

---

## Installation

```bash
npm install @slickgrid-universal/web-mcp
```

## Registration

```ts
import { SlickWebMcpService } from '@slickgrid-universal/web-mcp';

const gridOptions = {
  externalResources: [new SlickWebMcpService()],
  // ...
};
```

The service silently no-ops when the browser does not expose `navigator.modelContext`, so it is safe to include unconditionally.

---

## WebMCP Tools

All tool names are suffixed with the grid's UID to support multiple grids on the same page.

| Tool | Description |
|---|---|
| `read_slickgrid_data_<uid>` | Returns current data rows. Accepts an optional `limit` (default 20). |
| `get_slickgrid_schema_<uid>` | Returns column metadata (id, field, type, filterable, sortable). Call this first so the LLM knows what columns exist. |
| `get_slickgrid_state_<uid>` | Returns the current grid state: active filters, active sorters and visible column ids. |
| `apply_slickgrid_state_<uid>` | Applies a full or partial grid state. Any omitted key leaves that aspect unchanged. |

### `apply_slickgrid_state` payload

```ts
{
  // optional — replaces all active filters
  filters?: Array<{
    columnId: string;
    searchTerms: string[];
    operator?: 'EQ' | 'NE' | 'GT' | 'GE' | 'LT' | 'LE' | 'CONTAINS' | 'NOT_CONTAINS' | 'IN' | 'NIN';
  }>;

  // optional — replaces all active sorts
  sorters?: Array<{
    columnId: string;
    direction: 'ASC' | 'DESC';
  }>;

  // optional — ids of columns that should be visible (all others are hidden)
  visibleColumnIds?: string[];
}
```

---

## Public API

In addition to the WebMCP tools, these methods are available directly on the service instance for use without `navigator.modelContext` (e.g. integrating with a custom LLM call):

```ts
// Column metadata as JSON Schema
service.getStructuredSchema(): SlickColumnSchema[]

// Snapshot of current grid state
service.getGridState(): SlickGridState

// Apply a full or partial state
await service.applyGridState(state: Partial<SlickGridState>): Promise<void>
```

### Example: custom LLM integration

```ts
import { SlickWebMcpService } from '@slickgrid-universal/web-mcp';

const mcpService = new SlickWebMcpService();
// mcpService is already init'd via externalResources

async function onUserQuery(userQuery: string) {
  const schema = mcpService.getStructuredSchema();
  const currentState = mcpService.getGridState();

  const response = await callMyLlm({
    query: userQuery,
    schema,
    currentState,
  });

  await mcpService.applyGridState(response.newState);
}
```

---

## Extending

Override `_registerDefaultTools()` to add custom tools or replace the built-in ones:

```ts
import { SlickWebMcpService, type WebMcpTool } from '@slickgrid-universal/web-mcp';

class MyMcpService extends SlickWebMcpService {
  protected override _registerDefaultTools(modelContext: { registerTool: (t: WebMcpTool) => void }): void {
    super._registerDefaultTools(modelContext);

    modelContext.registerTool({
      name: `highlight_row_${this._grid.getUID()}`,
      description: 'Highlights a specific row by its id.',
      inputSchema: {
        type: 'object',
        properties: { rowId: { type: 'number' } },
        required: ['rowId'],
      },
      execute: async ({ rowId }) => {
        // custom logic here
        return { status: 'success' };
      },
    });
  }
}
```

---

## Notes

- `apply_slickgrid_state` delegates to `FilterService.updateFilters`, `SortService.updateSorting` and `GridService.showColumnByIds` under the hood — all the same rules that apply to those services apply here (e.g. `enableFiltering` must be `true` in your grid options to use filters).
- The service has no knowledge of backend services — when using OData/GraphQL, ensure `triggerBackendQuery` behaviour is acceptable. You may want to call `filterService.updateFilters` directly with the third argument set to `false` and batch the backend query yourself.

---

## Playwright / MCP example

Below is a minimal example that demonstrates the flow used by an MCP-capable client (for example a Playwright test running in an MCP-enabled browser):

1. Call `get_slickgrid_schema_<uid>` to discover column ids and types.
2. Locate the `columnId` for the column you want to filter (e.g. `cost`).
3. Call `filter_slickgrid_<uid>` (or `apply_slickgrid_state_<uid>`) with a validated payload.

Note: the exact tool invocation API depends on the MCP client/environment. The snippet below uses `navigator.modelContext.invokeTool(...)` as a concise example; replace with the appropriate client method if different.

```ts
// Playwright (browser) context example — runs inside the page
const uid = 'slickgrid_123456';
const mc = (navigator as any).modelContext;

// 1) discover schema
const schema = await mc.invokeTool(`get_slickgrid_schema_${uid}`, {});

// 2) find the cost column
const costCol = schema.find((c: any) => c.field === 'cost' || (c.name && c.name.toLowerCase().includes('cost')));
if (!costCol) throw new Error('cost column not found');

// 3) apply a filter: cost < 50
await mc.invokeTool(`filter_slickgrid_${uid}`, {
  columnId: costCol.id,
  search: '50',
  operator: 'LT',
});
```

Tool payload (JSON) for the example above:

```json
{
  "columnId": "cost",
  "search": "50",
  "operator": "LT"
}
```

Security note: exposing grid data and controls to external assistants is an opt-in decision. Consider adding consent gating, sanitization, logging and rate-limiting for production use.
