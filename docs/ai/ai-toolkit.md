# AI Toolkit (`@slickgrid-universal/web-mcp`)

The AI Toolkit is an optional external resource (plugin) package that bridges SlickGrid with the browser's [Web Model Context Protocol (WebMCP)](https://github.com/webmcp/webmcp). When a user — or an automated agent — makes a natural-language request about the grid ("show me only High-priority tasks sorted by duration"), this package provides the standard MCP surface that lets an AI assistant discover what the grid looks like, read its current state, and push changes back to it — all without any custom glue code in your application.

It is inspired by the [AG Grid AI Toolkit](https://www.ag-grid.com/angular-data-grid/ai-toolkit/) and follows the same general pattern: provide the LLM with a structured schema of the grid so it understands what it can act on, then let it produce a state object that is applied back to the grid.

---

## Why use this?

Data grids are powerful but their filter and sort UIs can be intimidating for non-technical users and verbose to drive from automated agents. The AI Toolkit solves this by exposing a well-defined, LLM-friendly interface on top of SlickGrid's existing services.

**Key use cases:**

- **Natural-language grid queries** — let users type or speak queries like _"show me overdue tasks assigned to Alice, sorted by priority"_ and have an in-app assistant translate them directly into grid filters and sorts, no filter UI required.
- **AI-powered dashboards** — embed a Copilot/GPT-style assistant sidebar in your application that can drive the grid on the user's behalf, reducing friction for complex multi-column filtering scenarios.
- **Playwright / MCP browser automation** — Playwright's MCP-enabled browser mode can call `get_slickgrid_schema` and `apply_slickgrid_state` directly, making it trivial to write intent-based E2E tests: _"filter by status = Done, then assert row count"_ rather than hard-coding CSS selectors.
- **Accessibility** — users who find filter forms difficult to use can interact with the grid through a text/voice interface backed by an LLM.
- **Developer productivity** — during local development, ask an AI agent to pre-populate filters for a specific scenario without manually clicking through the UI every time.

Because the package is purely opt-in and makes no changes to `@slickgrid-universal/common` or any framework wrapper, adding it carries zero cost for applications that do not use it.

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
import { WebMcpService } from '@slickgrid-universal/web-mcp';

const gridOptions = {
  externalResources: [new WebMcpService()],
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
import { WebMcpService } from '@slickgrid-universal/web-mcp';

const mcpService = new WebMcpService();
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

## Prompting

The AI Toolkit does not include any prompting logic — the right prompt depends on your LLM and your data. A few practices that consistently improve results:

- **Include the current grid state** so the LLM understands what is already applied.
- **Include a few sample rows** (or the full dataset for small data) so the LLM understands the data format and domain values.
- **Ask for an `explanation` string** alongside the state change — your UI can show users what changed.
- **List the available features** (filtering, sorting, column visibility) so the LLM knows what it can and cannot do.
- **Include domain context** inline, e.g. _"In this dataset, 'priority' values are 'Low', 'Medium' and 'High'"_.
- **Ask for only the changed state**, not the full state, so that unchanged properties are not accidentally reset.

### Starter system prompt

```ts
const systemPrompt = `
You are an expert data analyst working with a data grid.
Respond to user requests by returning a JSON object with the following shape:

{
  "newState": { /* partial grid state — only include what changed */ },
  "propertiesToIgnore": [ /* list state keys you did NOT change */ ],
  "explanation": "short human-readable description of changes"
}

Available state keys: "filters", "sorters", "visibleColumnIds".

Current grid schema (columns and their capabilities):
${JSON.stringify(schema, null, 2)}

Current grid state:
${JSON.stringify(currentState, null, 2)}
`;
```

Using `propertiesToIgnore` is optional but recommended: pass it as a hint to `applyGridState` so that partial responses do not inadvertently clear state keys the LLM left out.

---

## Schema validation

When using an LLM that does not support [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs), the response may not always conform to the expected shape. Validate it against a JSON schema before calling `applyGridState` to avoid runtime errors:

```ts
import Ajv from 'ajv';

const ajv = new Ajv();
const validate = ajv.compile({
  type: 'object',
  properties: {
    filters: { type: 'array' },
    sorters: { type: 'array' },
    visibleColumnIds: { type: 'array', items: { type: 'string' } },
  },
  additionalProperties: false,
});

const parsed = JSON.parse(llmResponse);
if (!validate(parsed.newState)) {
  console.error('LLM returned invalid grid state', validate.errors);
  return;
}

await mcpService.applyGridState(parsed.newState);
```

---

## Handling schema size

`getStructuredSchema()` returns metadata for every column. For grids with many columns this can inflate your prompt and exceed the LLM's context window. Practical mitigations:

- **Filter the schema** before sending — strip columns that should not be AI-manipulable:
  ```ts
  const schema = mcpService.getStructuredSchema().filter(col => col.filterable || col.sortable);
  ```
- **Add column descriptions sparingly** — if you augment schema entries with free-text descriptions, keep them concise.
- **Monitor total prompt size** — aim to leave at least 20–25 % of the context window for the model's response.

---

## Extending

Override `_registerDefaultTools()` to add custom tools or replace the built-in ones:

```ts
import { WebMcpService, type WebMcpTool } from '@slickgrid-universal/web-mcp';

class MyMcpService extends WebMcpService {
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
- **Backend services (OData / GraphQL):** the service has no knowledge of remote data services. When your grid is backed by OData or GraphQL, each call to `applyGridState` will trigger a backend query just as a manual filter would. If you need to batch several state changes and fire only one request, call `filterService.updateFilters(filters, true, false)` / `sortService.updateSorting(sorters, false)` directly (the third argument suppresses the automatic backend call) and then trigger the backend query yourself once all changes are applied.
- **Multiple grids on the same page:** every tool name includes the grid's UID suffix, so two grids each with their own `WebMcpService` register independent, non-conflicting tool sets.

### Try it locally

For quick experimentation you can use the Model Context Tool Inspector project which connects to the browser's WebMCP surface and lets you invoke registered tools interactively: https://github.com/beaufortfrancois/model-context-tool-inspector. It also supports recent browser LLM integrations (for example Chrome's Gemini Nano) so you can run free, local prompt-driven calls against your running demo without wiring a full assistant UI.

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
