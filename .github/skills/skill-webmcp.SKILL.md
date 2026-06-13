# Skill: WebMCP / AI Toolkit

Purpose
- Help AI agents discover WebMCP (Model Context Protocol) tools, docs and interfaces for the WebMCP integration in this repo.

Quick summary
- The WebMCP feature is implemented in the `packages/web-mcp` package. It registers MCP tools when `navigator.modelContext` is available and exposes helpers usable directly via the `WebMcpService` instance.
- Tools of interest: `read_slickgrid_data_<uid>`, `get_slickgrid_schema_<uid>`, `get_slickgrid_state_<uid>`, `apply_slickgrid_state_<uid>`.

Where to read (priority order)
1. Concept & examples: `docs/ai/ai-toolkit.md`
2. Package README: `packages/web-mcp/README.md`
3. Implementation & types: `packages/web-mcp/src/web-mcp.service.ts`
4. Core/common interfaces used: `packages/common` (search for `CurrentFilter`, `CurrentSorter`, external resource (plugin), `FilterService`, `GridService`)
5. Demo using WebMCP: `demos/vanilla/src/examples/example43.ts` and `demos/vanilla/src/examples/example43.html`
6. Unit tests: `packages/web-mcp/src/__tests__/web-mcp.service.spec.ts`

Notes for agents
- Prefer docs for conceptual questions and examples. Inspect `web-mcp.service.ts` for precise tool names, input shapes and runtime behavior.
- `apply_slickgrid_state` performs basic validation; the service returns structured error objects for malformed input instead of throwing at the tool boundary. Use the tests as concrete examples of validation behavior.
- WebMCP is opt-in — only demos that instantiate `WebMcpService` will register tools. Confirm the demo before attempting to call `navigator.modelContext` tools.

Common search hints
- Keywords: `WebMCP`, `WebMcpService`, `modelContext`, `apply_slickgrid_state`, `get_slickgrid_schema`.
- Files: `packages/web-mcp/src/**/*.ts`, `packages/common/src/**/*.ts`, `docs/ai/**/*.md`, `demos/**/src/examples/**`.

Example checklist for answering requests about WebMCP
- Link to `docs/ai/ai-toolkit.md` for overview and prompting guidance.
- Quote the exact tool name pattern and input schema from `web-mcp.service.ts` when suggesting client invocations.
- If recommending local testing, point to `demos/vanilla/example43` and the Model Context Tool Inspector link: https://github.com/beaufortfrancois/model-context-tool-inspector
