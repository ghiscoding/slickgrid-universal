# `@slickgrid-universal/web-mcp`

An optional External Resource that exposes SlickGrid data manipulation capabilities as [WebMCP](https://github.com/webmcp/webmcp) (Model Context Protocol) tools, allowing AI assistants running in the browser to read and manipulate the live grid via natural language.

> For full documentation see [docs/ai/ai-toolkit.md](../../docs/ai/ai-toolkit.md).

## Installation

```bash
npm install @slickgrid-universal/web-mcp
```

## Basic Usage

```ts
import { SlickWebMcpService } from '@slickgrid-universal/web-mcp';

const gridOptions = {
  externalResources: [new SlickWebMcpService()],
  // ...
};
```

The service silently no-ops when the browser does not expose `navigator.modelContext`, so it is safe to include unconditionally.

## License

MIT

