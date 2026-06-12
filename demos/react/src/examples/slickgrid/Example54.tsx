import { WebMcpService, type SlickGridState } from '@slickgrid-universal/web-mcp';
import React, { useEffect, useRef, useState } from 'react';
import { SlickgridReact, type Column, type GridOption, type SlickgridReactInstance } from 'slickgrid-react';

const NB_ITEMS = 2000;
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Todo', 'In Progress', 'Done', 'Blocked'];

const Example54: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(loadData(NB_ITEMS));
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);
  const [textResult, setTextResult] = useState('');

  const mcpService = useRef(new WebMcpService());
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    showOutput(
      '// Click a button above to inspect or manipulate the grid via the MCP service API.\n// In a real WebMCP-capable browser, an AI assistant calls these same methods automatically.'
    );
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    const columns: Column[] = [
      { id: 'id', name: '#', field: 'id', sortable: true, width: 50 },
      { id: 'title', name: 'Title', field: 'title', sortable: true, filterable: true, width: 200 },
      { id: 'priority', name: 'Priority', field: 'priority', sortable: true, filterable: true, width: 110 },
      { id: 'status', name: 'Status', field: 'status', sortable: true, filterable: true, width: 120 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, filterable: true, type: 'number', width: 140 },
      { id: 'completed', name: 'Completed %', field: 'completed', sortable: true, filterable: true, type: 'number', width: 130 },
    ];

    const gridOptions: GridOption = {
      enableFiltering: true,
      enableSorting: true,
      gridHeight: 300,
      gridWidth: 800,
      externalResources: [mcpService.current],
    };

    setColumns(columns);
    setGridOptions(gridOptions);
  }

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
    const schema = mcpService.current.getStructuredSchema();
    showOutput(JSON.stringify(schema, null, 2));
  }

  function showState() {
    const state = mcpService.current.getGridState();
    showOutput(JSON.stringify(state, null, 2));
  }

  /** Simulate a typical LLM response: filter to High/Critical priority, sort by duration desc */
  async function applyAiState() {
    const aiGeneratedState: Partial<SlickGridState> = {
      filters: [{ columnId: 'priority', searchTerms: ['High'], operator: 'EQ' }],
      sorters: [{ columnId: 'duration', direction: 'DESC' }],
    };
    showOutput(`// Simulated LLM response — applying state:\n${JSON.stringify(aiGeneratedState, null, 2)}`);
    await mcpService.current.applyGridState(aiGeneratedState);
  }

  async function resetGrid() {
    await mcpService.current.applyGridState({ filters: [], sorters: [] });
    showOutput('// Grid state reset.');
  }

  function showOutput(text: string) {
    setTextResult(text);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div className="demo54">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 54: AI / Web MCP Toolkit
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example54.tsx"
            >
              <span className="mdi mdi-link-variant"></span> code
            </a>
          </span>
          <button
            className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
            type="button"
            data-test="toggle-subtitle"
            onClick={() => toggleSubTitle()}
          >
            <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
          </button>
        </h2>

        <div className="subtitle">
          Demonstrates the optional <code>@slickgrid-universal/web-mcp</code> package (<code>WebMcpService</code>), which exposes the grid
          as
          <a href="https://modelcontextprotocol.io" target="_blank">
            Model Context Protocol (MCP)
          </a>{' '}
          tools so that AI assistants can read and manipulate the grid via natural language. The buttons below simulate what an LLM would
          call — in a real WebMCP-capable browser the same methods are called automatically by the AI assistant via{' '}
          <code>navigator.modelContext</code>. See
          <a href="https://ghiscoding.gitbook.io/slickgrid-universal/ai/ai-toolkit" target="_blank">
            AI Toolkit docs
          </a>{' '}
          for full details.
        </div>

        <div className="row" style={{ marginBottom: '4px' }}>
          <div className="col-md-12">
            <button className="btn btn-outline-secondary btn-xs btn-icon" onClick={showSchema}>
              &lt;/&gt; "getStructuredSchema()"
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon" onClick={showState}>
              <span className="mdi mdi-eye-outline mr-1"></span> "getGridState()"
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon" onClick={applyAiState}>
              🤖 "applyGridState()" — simulated LLM response
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon" onClick={resetGrid}>
              <span className="mdi mdi-refresh mr-1"></span> Reset
            </button>
          </div>
        </div>

        <SlickgridReact
          gridId="grid54"
          columns={columns}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />

        <div className="row mt-2">
          <h6 className="label is-small">Output (what the LLM sees / sends)</h6>
          <pre
            id="mcp-output"
            dangerouslySetInnerHTML={{ __html: textResult }}
            style={{
              backgroundColor: 'rgb(43, 43, 43)',
              color: 'rgb(0, 187, 0)',
              minHeight: '260px',
              fontSize: '0.75rem',
              overflow: 'auto',
              borderRadius: '6px',
              whiteSpace: 'pre-wrap',
            }}
          ></pre>
        </div>
      </div>
    </div>
  );
};

export default Example54;
