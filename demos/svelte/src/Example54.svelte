<script lang="ts">
  import { WebMcpService, type SlickGridState } from '@slickgrid-universal/web-mcp';
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  const NB_ITEMS = 2000;
  const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
  const STATUSES = ['Todo', 'In Progress', 'Done', 'Blocked'];

  let gridOptions: GridOption = $state.raw({});
  let columns: Column[] = $state.raw([]);
  // mock some data (different in each dataset)
  let dataset: any[] = $state.raw(loadData(NB_ITEMS));
  let showSubTitle = $state(true);
  let textResult = $state('');
  const mcpService = new WebMcpService();
  let svelteGrid!: SlickgridSvelteInstance;

  defineGrid();

  showOutput(
    '// Click a button above to inspect or manipulate the grid via the MCP service API.\n// In a real WebMCP-capable browser, an AI assistant calls these same methods automatically.'
  );

  /* Define grid Options and Columns */
  function defineGrid() {
    columns = [
      { id: 'id', name: '#', field: 'id', sortable: true, width: 50 },
      { id: 'title', name: 'Title', field: 'title', sortable: true, filterable: true, width: 200 },
      { id: 'priority', name: 'Priority', field: 'priority', sortable: true, filterable: true, width: 110 },
      { id: 'status', name: 'Status', field: 'status', sortable: true, filterable: true, width: 120 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, filterable: true, type: 'number', width: 140 },
      { id: 'completed', name: 'Completed %', field: 'completed', sortable: true, filterable: true, type: 'number', width: 130 },
    ];

    gridOptions = {
      enableFiltering: true,
      enableSorting: true,
      gridHeight: 300,
      gridWidth: 800,
      externalResources: [mcpService],
    };
  }

  // ---------------------------------------------------------------------------
  // Button handlers — simulating what an LLM would call via WebMCP tools
  // ---------------------------------------------------------------------------

  function loadData(count: number): any[] {
    const data: any[] = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        priority: PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)],
        status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
        duration: Math.floor(Math.random() * 90) + 1,
        completed: Math.floor(Math.random() * 100),
      });
    }
    return data;
  }

  function showSchema() {
    const schema = mcpService.getStructuredSchema();
    showOutput(JSON.stringify(schema, null, 2));
  }

  function showState() {
    const state = mcpService.getGridState();
    showOutput(JSON.stringify(state, null, 2));
  }

  /** Simulate a typical LLM response: filter to High/Critical priority, sort by duration desc */
  async function applyAiState() {
    const aiGeneratedState: Partial<SlickGridState> = {
      filters: [{ columnId: 'priority', searchTerms: ['High'], operator: 'EQ' }],
      sorters: [{ columnId: 'duration', direction: 'DESC' }],
    };
    showOutput(`// Simulated LLM response — applying state:\n${JSON.stringify(aiGeneratedState, null, 2)}`);
    await mcpService.applyGridState(aiGeneratedState);
  }

  async function resetGrid() {
    await mcpService.applyGridState({ filters: [], sorters: [] });
    showOutput('// Grid state reset.');
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => svelteGrid.resizerService.resizeGrid());
  }

  function gridReady(grid: SlickgridSvelteInstance) {
    svelteGrid = grid;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function showOutput(text: string) {
    textResult = text;
  }
</script>

<h2>
  Example 54: AI / Web MCP Toolkit
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example54.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">
    Demonstrates the optional <code>@slickgrid-universal/web-mcp</code> package (<code>WebMcpService</code>), which exposes the grid as
    <a href="https://modelcontextprotocol.io" target="_blank">Model Context Protocol (MCP)</a> tools so that AI assistants can read and
    manipulate the grid via natural language. The buttons below simulate what an LLM would call — in a real WebMCP-capable browser the same
    methods are called automatically by the AI assistant via <code>navigator.modelContext</code>. See
    <a href="https://ghiscoding.gitbook.io/slickgrid-universal/ai/ai-toolkit" target="_blank">AI Toolkit docs</a> for full details.
  </div>
{/if}

<div class="row" style="margin-bottom: 4px">
  <div class="col-md-12">
    <button class="btn btn-outline-secondary btn-xs btn-icon" onclick={showSchema}>&lt;/&gt; "getStructuredSchema()"</button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" onclick={showState}>
      <span class="mdi mdi-eye-outline mr-1"></span> "getGridState()"
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" onclick={applyAiState}>
      🤖 "applyGridState()" — simulated LLM response
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" onclick={resetGrid}>
      <span class="mdi mdi-refresh mr-1"></span> Reset
    </button>
  </div>
</div>

<SlickgridSvelte options={gridOptions} {columns} {dataset} gridId="grid54" onSvelteGridCreated={gridReady}></SlickgridSvelte>

<div class="row mt-2">
  <h6 class="label is-small">Output (what the LLM sees / sends)</h6>
  <pre
    id="mcp-output"
    style="
        background-color: rgb(43, 43, 43);
        color: rgb(0, 187, 0);
        min-height: 260px;
        font-size: 0.75rem;
        overflow: auto;
        border-radius: 6px;
        white-space: pre-wrap;
      ">{textResult}</pre>
</div>
