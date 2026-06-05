import type { Column, GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { WebMcpService, type SlickGridState } from '@slickgrid-universal/web-mcp';
import { ExampleGridOptions } from './example-grid-options.js';
import '../material-styles.scss';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Todo', 'In Progress', 'Done', 'Blocked'];

export default class Example43 {
  columns: Column[] = [];
  gridOptions!: GridOption;
  dataset: any[] = [];
  sgb!: SlickVanillaGridBundle;
  mcpService!: WebMcpService;
  textResult = '';

  attached() {
    this.initializeGrid();
    this.dataset = this.loadData(200);
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid43')!;

    this.mcpService = new WebMcpService();

    this.sgb = new Slicker.GridBundle(
      gridContainerElm,
      this.columns,
      { ...ExampleGridOptions, ...this.gridOptions, externalResources: [this.mcpService] },
      this.dataset
    );

    document.body.classList.add('material-theme');
    this.showOutput(
      '// Click a button above to inspect or manipulate the grid via the MCP service API.\n// In a real WebMCP-capable browser, an AI assistant calls these same methods automatically.'
    );
  }

  dispose() {
    this.sgb?.dispose();
    document.body.classList.remove('material-theme');
  }

  initializeGrid() {
    this.columns = [
      { id: 'id', name: '#', field: 'id', sortable: true, width: 50 },
      { id: 'title', name: 'Title', field: 'title', sortable: true, filterable: true, width: 200 },
      { id: 'priority', name: 'Priority', field: 'priority', sortable: true, filterable: true, width: 110 },
      { id: 'status', name: 'Status', field: 'status', sortable: true, filterable: true, width: 120 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, filterable: true, type: 'number', width: 140 },
      { id: 'completed', name: 'Completed %', field: 'completed', sortable: true, filterable: true, type: 'number', width: 130 },
    ];

    this.gridOptions = {
      enableFiltering: true,
      enableSorting: true,
    };
  }

  // ---------------------------------------------------------------------------
  // Button handlers — simulating what an LLM would call via WebMCP tools
  // ---------------------------------------------------------------------------

  showSchema() {
    const schema = this.mcpService.getStructuredSchema();
    this.showOutput(JSON.stringify(schema, null, 2));
  }

  showState() {
    const state = this.mcpService.getGridState();
    this.showOutput(JSON.stringify(state, null, 2));
  }

  /** Simulate a typical LLM response: filter to High/Critical priority, sort by duration desc */
  async applyAiState() {
    const aiGeneratedState: Partial<SlickGridState> = {
      filters: [{ columnId: 'priority', searchTerms: ['High'], operator: 'EQ' }],
      sorters: [{ columnId: 'duration', direction: 'DESC' }],
    };
    this.showOutput(`// Simulated LLM response — applying state:\n${JSON.stringify(aiGeneratedState, null, 2)}`);
    await this.mcpService.applyGridState(aiGeneratedState);
  }

  async resetGrid() {
    await this.mcpService.applyGridState({ filters: [], sorters: [] });
    this.showOutput('// Grid state reset.');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private showOutput(text: string) {
    this.textResult = text;
  }

  private loadData(count: number): any[] {
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
}
