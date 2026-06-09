import { Component, inject, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WebMcpService, type SlickGridState } from '@slickgrid-universal/web-mcp';
import { AngularGridInstance, AngularSlickgridComponent, AngularUtilService, type Column, type GridOption } from '../../library';

const NB_ITEMS = 2000;
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Todo', 'In Progress', 'Done', 'Blocked'];

@Component({
  templateUrl: './example54.component.html',
  providers: [AngularUtilService],
  imports: [AngularSlickgridComponent, FormsModule],
})
export class Example54Component implements OnInit {
  protected readonly angularUtilService = inject(AngularUtilService);

  angularGrid!: AngularGridInstance;
  columns: Column[] = [];
  dataset: any[] = [];
  gridContainerElm!: HTMLDivElement;
  gridOptions!: GridOption;
  hideSubTitle = false;
  mcpService = new WebMcpService();
  textResult = '';

  constructor() {
    this.showOutput(
      '// Click a button above to inspect or manipulate the grid via the MCP service API.\n// In a real WebMCP-capable browser, an AI assistant calls these same methods automatically.'
    );
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
  }

  ngOnInit(): void {
    this.defineGrid();

    // mock a dataset
    this.dataset = this.loadData(NB_ITEMS);
  }

  /* Define grid Options and Columns */
  defineGrid() {
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
      gridHeight: 300,
      gridWidth: 800,
      externalResources: [this.mcpService],
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

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
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
