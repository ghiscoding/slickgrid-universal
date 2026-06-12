import type {
  Column,
  ContainerService,
  CurrentFilter,
  CurrentSorter,
  ExternalResource,
  FilterService,
  GridService,
  SlickGrid,
  SortService,
} from '@slickgrid-universal/common';

// -------------------------------------------------------------------------
// Public interfaces
// -------------------------------------------------------------------------

/** A single WebMCP tool definition */
export interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/** Snapshot of the current grid state returned by getGridState / the state tool */
export interface SlickGridState {
  filters: CurrentFilter[];
  sorters: CurrentSorter[];
  /** IDs of currently visible columns */
  visibleColumnIds: Array<string | number>;
}

/** JSON-Schema representation of one column (used in getStructuredSchema) */
export interface SlickColumnSchema {
  id: string | number;
  name: string | undefined;
  field: string;
  type: string;
  filterable: boolean;
  sortable: boolean;
}

// -------------------------------------------------------------------------
// Minimal typings for the browser WebMCP modelContext API (not in lib.dom.d.ts)
// -------------------------------------------------------------------------
interface ModelContext {
  registerTool: (tool: WebMcpTool) => void;
}

declare global {
  interface Navigator {
    /** WebMCP model context — available only in supporting browsers/extensions */
    modelContext?: ModelContext;
  }
}

// -------------------------------------------------------------------------
// Service
// -------------------------------------------------------------------------

/**
 * WebMcpService — an optional External Resource that exposes SlickGrid
 * data manipulation capabilities as WebMCP (Model Context Protocol) tools,
 * allowing AI assistants running in the browser to read and manipulate the
 * live grid via natural language.
 *
 * Add it to your grid via `externalResources: [new WebMcpService()]`.
 *
 * The service silently no-ops when the browser does not expose
 * `navigator.modelContext`, so it is safe to include unconditionally.
 *
 * @see docs/ai/ai-toolkit.md for full documentation.
 */
export class WebMcpService implements ExternalResource {
  readonly pluginName = 'WebMCPService';

  protected _grid!: SlickGrid;
  protected _filterService?: FilterService | null;
  protected _sortService?: SortService | null;
  protected _gridService?: GridService | null;

  // -----------------------------------------------------------------------
  // ExternalResource lifecycle
  // -----------------------------------------------------------------------

  init(grid: SlickGrid, containerService: ContainerService): void {
    this._grid = grid;
    this._filterService = containerService.get<FilterService>('FilterService');
    this._sortService = containerService.get<SortService>('SortService');
    this._gridService = containerService.get<GridService>('GridService');

    if (!('modelContext' in navigator) || !navigator.modelContext) {
      return;
    }

    this._registerDefaultTools(navigator.modelContext);
  }

  // -----------------------------------------------------------------------
  // Public API (usable independently of WebMCP)
  // -----------------------------------------------------------------------

  /**
   * Returns a JSON-Schema representation of the grid's columns so an LLM
   * knows what it can act on (ids, types, sortable/filterable flags).
   */
  getStructuredSchema(): SlickColumnSchema[] {
    return this._grid.getColumns().map((col: Column) => ({
      id: col.id,
      name: typeof col.name === 'string' ? col.name : col.field,
      field: col.field,
      type: col.type ?? 'string',
      filterable: col.filterable ?? false,
      sortable: col.sortable ?? false,
    }));
  }

  /**
   * Returns a snapshot of the current grid state:
   * active filters, active sorters and visible column ids.
   */
  getGridState(): SlickGridState {
    const filters = this._filterService?.getCurrentLocalFilters() ?? [];
    const sorters = this._sortService?.getCurrentLocalSorters() ?? [];
    const visibleColumnIds = this._grid
      .getColumns()
      .filter((c) => !c.hidden)
      .map((c) => c.id);
    return { filters, sorters, visibleColumnIds };
  }

  /**
   * Applies a full grid state object produced by an LLM (or any other source).
   * Each property is optional — omit any key to leave that aspect of the grid untouched.
   */
  async applyGridState(state: Partial<SlickGridState>): Promise<void> {
    const validation = this._validateGridState(state);
    if (!validation.valid) {
      throw new Error(`Invalid grid state: ${validation.errors?.join('; ')}`);
    }

    if (state.filters !== undefined && this._filterService) {
      await this._filterService.updateFilters(state.filters);
    }
    if (state.sorters !== undefined && this._sortService) {
      this._sortService.updateSorting(state.sorters);
    }
    if (state.visibleColumnIds !== undefined && this._gridService) {
      this._gridService.showColumnByIds(state.visibleColumnIds);
    }
  }

  /**
   * Basic validation for incoming grid state objects. Returns {valid, errors}.
   * This is intentionally conservative — it only checks shapes and primitive types.
   */
  protected _validateGridState(state: Partial<SlickGridState>): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    if (state.filters !== undefined) {
      if (!Array.isArray(state.filters)) {
        errors.push('filters must be an array');
      } else {
        state.filters.forEach((f, idx) => {
          if (!f || (typeof f as unknown) !== 'object') {
            errors.push(`filters[${idx}] must be an object`);
            return;
          }
          // columnId and searchTerms are required per schema
          if ((f as any).columnId === undefined) {
            errors.push(`filters[${idx}].columnId is required`);
          }
          if (!Array.isArray((f as any).searchTerms)) {
            errors.push(`filters[${idx}].searchTerms must be an array of strings`);
          }
        });
      }
    }

    if (state.sorters !== undefined) {
      if (!Array.isArray(state.sorters)) {
        errors.push('sorters must be an array');
      } else {
        state.sorters.forEach((s, idx) => {
          if (!s || (typeof s as unknown) !== 'object') {
            errors.push(`sorters[${idx}] must be an object`);
            return;
          }
          if ((s as any).columnId === undefined) {
            errors.push(`sorters[${idx}].columnId is required`);
          }
          const dir = (s as any).direction;
          if (dir !== 'ASC' && dir !== 'DESC') {
            errors.push(`sorters[${idx}].direction must be 'ASC' or 'DESC'`);
          }
        });
      }
    }

    if (state.visibleColumnIds !== undefined) {
      if (!Array.isArray(state.visibleColumnIds)) {
        errors.push('visibleColumnIds must be an array');
      } else {
        state.visibleColumnIds.forEach((id, idx) => {
          const t = typeof id;
          if (t !== 'string' && t !== 'number') {
            errors.push(`visibleColumnIds[${idx}] must be a string or number`);
          }
        });
      }
    }

    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  // -----------------------------------------------------------------------
  // Protected helpers
  // -----------------------------------------------------------------------

  /**
   * Register the built-in WebMCP tools on the provided modelContext instance.
   * Override this method to add extra tools or replace the built-in ones.
   */
  protected _registerDefaultTools(modelContext: ModelContext): void {
    const uid = this._grid.getUID();

    // Tool 1 — read current grid data rows
    modelContext.registerTool({
      name: `read_slickgrid_data_${uid}`,
      description: 'Returns the current rows from the SlickGrid data grid.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 20 },
        },
      },
      execute: async ({ limit }: { limit?: number }) => {
        const dataView = this._grid.getData<any>();
        const items: unknown[] =
          typeof dataView?.getItems === 'function'
            ? (dataView.getItems() as unknown[]).slice(0, limit ?? 20)
            : (dataView as unknown[]).slice(0, limit ?? 20);
        const totalCount: number =
          typeof dataView?.getLength === 'function' ? (dataView.getLength() as number) : (dataView as unknown[]).length;
        return { data: items, totalCount };
      },
    });

    // Tool 2 — get structured schema (column metadata)
    modelContext.registerTool({
      name: `get_slickgrid_schema_${uid}`,
      description:
        'Returns a JSON-Schema description of the grid columns (id, type, sortable, filterable). Use this before filtering or sorting.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => this.getStructuredSchema(),
    });

    // Tool 3 — get current grid state
    modelContext.registerTool({
      name: `get_slickgrid_state_${uid}`,
      description: 'Returns the current grid state: active filters, active sorters and visible column ids.',
      inputSchema: { type: 'object', properties: {} },
      execute: async () => this.getGridState(),
    });

    // Tool 4 — apply a full or partial grid state
    modelContext.registerTool({
      name: `apply_slickgrid_state_${uid}`,
      description:
        'Applies a full or partial grid state (filters, sorters, visibleColumnIds). ' +
        'Omit any key to leave that aspect unchanged. ' +
        'Call get_slickgrid_schema first to know valid columnIds and types.',
      inputSchema: {
        type: 'object',
        properties: {
          filters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                columnId: { type: 'string' },
                searchTerms: { type: 'array', items: { type: 'string' } },
                operator: {
                  type: 'string',
                  // add all OperatorType values here to avoid forcing LLMs to guess the operator syntax
                  enum: [
                    '=',
                    '!=',
                    '<>',
                    '>',
                    '>=',
                    '<',
                    '<=',
                    '*',
                    'a*',
                    '*z',
                    'a*z',
                    'EQ',
                    'NE',
                    'GT',
                    'GE',
                    'LT',
                    'LE',
                    'CONTAINS',
                    'NOT_CONTAINS',
                    'IN',
                    'NIN',
                    'IN_COLLECTION',
                    'NOT_IN_COLLECTION',
                    'Custom',
                    'EndsWith',
                    'StartsWith',
                    'StartsWithEndsWith',
                    'RangeInclusive',
                    'RangeExclusive',
                  ],
                },
              },
              required: ['columnId', 'searchTerms'],
            },
          },
          sorters: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                columnId: { type: 'string' },
                direction: { type: 'string', enum: ['ASC', 'DESC'] },
              },
              required: ['columnId', 'direction'],
            },
          },
          visibleColumnIds: { type: 'array', items: { type: 'string' } },
        },
      },
      execute: async (state: Partial<SlickGridState>) => {
        try {
          await this.applyGridState(state);
          return { status: 'success', appliedState: state };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { status: 'error', message };
        }
      },
    });
  }
}
