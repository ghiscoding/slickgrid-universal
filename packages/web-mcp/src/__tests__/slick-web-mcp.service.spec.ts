import type { GridOption, SlickGrid } from '@slickgrid-universal/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContainerServiceStub } from '../../../../test/containerServiceStub.js';
import { WebMcpService } from '../slick-web-mcp.service.js';

const GRID_UID = 'slickgrid_123456';

const mockColumns = [
  { id: 'name', field: 'name', name: 'Name', type: 'string', filterable: true, sortable: true, hidden: false },
  { id: 'priority', field: 'priority', name: 'Priority', type: 'string', filterable: true, sortable: false, hidden: false },
  { id: 'done', field: 'done', name: 'Done', type: 'boolean', filterable: false, sortable: false, hidden: true },
];

const mockItems = [
  { id: 1, name: 'Task 1', priority: 'High' },
  { id: 2, name: 'Task 2', priority: 'Low' },
];

const dataViewStub = {
  getItems: vi.fn().mockReturnValue(mockItems),
  getLength: vi.fn().mockReturnValue(mockItems.length),
};

const gridStub = {
  getData: vi.fn().mockReturnValue(dataViewStub),
  getColumns: vi.fn().mockReturnValue(mockColumns),
  getOptions: () => ({}) as GridOption,
  getUID: () => GRID_UID,
} as unknown as SlickGrid;

const filterServiceStub = {
  getCurrentLocalFilters: vi.fn().mockReturnValue([]),
  updateFilters: vi.fn().mockResolvedValue(true),
};

const sortServiceStub = {
  getCurrentLocalSorters: vi.fn().mockReturnValue([]),
  updateSorting: vi.fn(),
};

const gridServiceStub = {
  showColumnByIds: vi.fn(),
};

function makeModelContext() {
  return { registerTool: vi.fn() };
}

/** Grab registered tools by name prefix from a mocked modelContext */
function getTool(modelContext: ReturnType<typeof makeModelContext>, prefix: string) {
  return modelContext.registerTool.mock.calls.map((c: any) => c[0]).find((t: any) => t.name.startsWith(prefix));
}

describe('WebMcpService', () => {
  let service: WebMcpService;
  let container: ContainerServiceStub;

  beforeEach(() => {
    service = new WebMcpService();
    container = new ContainerServiceStub();
    container.registerInstance('FilterService', filterServiceStub);
    container.registerInstance('SortService', sortServiceStub);
    container.registerInstance('GridService', gridServiceStub);
    Object.defineProperty(navigator, 'modelContext', { value: undefined, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should have the correct pluginName', () => {
    expect(service.pluginName).toBe('WebMCPService');
  });

  // -------------------------------------------------------------------------
  describe('init()', () => {
    it('should not register tools when navigator.modelContext is absent', () => {
      expect(() => service.init(gridStub, container)).not.toThrow();
    });

    it('should register 4 default tools when navigator.modelContext is available', () => {
      const modelContext = makeModelContext();
      Object.defineProperty(navigator, 'modelContext', { value: modelContext, writable: true, configurable: true });

      service.init(gridStub, container);

      expect(modelContext.registerTool).toHaveBeenCalledTimes(4);
      expect(getTool(modelContext, 'read_slickgrid_data_')).toBeDefined();
      expect(getTool(modelContext, 'get_slickgrid_schema_')).toBeDefined();
      expect(getTool(modelContext, 'get_slickgrid_state_')).toBeDefined();
      expect(getTool(modelContext, 'apply_slickgrid_state_')).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  describe('getStructuredSchema()', () => {
    it('should return a schema entry per column with correct fields', () => {
      service.init(gridStub, container);
      const schema = service.getStructuredSchema();

      expect(schema).toHaveLength(3);
      expect(schema[0]).toEqual({ id: 'name', name: 'Name', field: 'name', type: 'string', filterable: true, sortable: true });
      expect(schema[2]).toEqual({ id: 'done', name: 'Done', field: 'done', type: 'boolean', filterable: false, sortable: false });
    });

    it('should be callable via the get_slickgrid_schema tool', async () => {
      const modelContext = makeModelContext();
      Object.defineProperty(navigator, 'modelContext', { value: modelContext, writable: true, configurable: true });

      service.init(gridStub, container);
      const tool = getTool(modelContext, 'get_slickgrid_schema_');
      const result = await tool.execute({});

      expect(result).toHaveLength(3);
    });
  });

  // -------------------------------------------------------------------------
  describe('getGridState()', () => {
    it('should return current filters, sorters and visible column ids', () => {
      filterServiceStub.getCurrentLocalFilters.mockReturnValue([{ columnId: 'priority', searchTerms: ['High'] }]);
      sortServiceStub.getCurrentLocalSorters.mockReturnValue([{ columnId: 'name', direction: 'ASC' }]);

      service.init(gridStub, container);
      const state = service.getGridState();

      expect(state.filters).toEqual([{ columnId: 'priority', searchTerms: ['High'] }]);
      expect(state.sorters).toEqual([{ columnId: 'name', direction: 'ASC' }]);
      // hidden: true column should be excluded
      expect(state.visibleColumnIds).toEqual(['name', 'priority']);
    });

    it('should be callable via the get_slickgrid_state tool', async () => {
      const modelContext = makeModelContext();
      Object.defineProperty(navigator, 'modelContext', { value: modelContext, writable: true, configurable: true });

      service.init(gridStub, container);
      const tool = getTool(modelContext, 'get_slickgrid_state_');
      const result: any = await tool.execute({});

      expect(result).toHaveProperty('filters');
      expect(result).toHaveProperty('sorters');
      expect(result).toHaveProperty('visibleColumnIds');
    });
  });

  // -------------------------------------------------------------------------
  describe('applyGridState()', () => {
    beforeEach(() => {
      service.init(gridStub, container);
    });

    it('should apply filters when provided', async () => {
      await service.applyGridState({ filters: [{ columnId: 'priority', searchTerms: ['High'] }] });
      expect(filterServiceStub.updateFilters).toHaveBeenCalledWith([{ columnId: 'priority', searchTerms: ['High'] }]);
      expect(sortServiceStub.updateSorting).not.toHaveBeenCalled();
      expect(gridServiceStub.showColumnByIds).not.toHaveBeenCalled();
    });

    it('should apply sorters when provided', async () => {
      await service.applyGridState({ sorters: [{ columnId: 'name', direction: 'ASC' }] });
      expect(sortServiceStub.updateSorting).toHaveBeenCalledWith([{ columnId: 'name', direction: 'ASC' }]);
      expect(filterServiceStub.updateFilters).not.toHaveBeenCalled();
    });

    it('should apply column visibility when provided', async () => {
      await service.applyGridState({ visibleColumnIds: ['name'] });
      expect(gridServiceStub.showColumnByIds).toHaveBeenCalledWith(['name']);
      expect(filterServiceStub.updateFilters).not.toHaveBeenCalled();
    });

    it('should apply all three properties together', async () => {
      await service.applyGridState({
        filters: [{ columnId: 'priority', searchTerms: ['High'] }],
        sorters: [{ columnId: 'name', direction: 'DESC' }],
        visibleColumnIds: ['name', 'priority'],
      });
      expect(filterServiceStub.updateFilters).toHaveBeenCalled();
      expect(sortServiceStub.updateSorting).toHaveBeenCalled();
      expect(gridServiceStub.showColumnByIds).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  describe('apply_slickgrid_state tool', () => {
    it('should call applyGridState and return success', async () => {
      const modelContext = makeModelContext();
      Object.defineProperty(navigator, 'modelContext', { value: modelContext, writable: true, configurable: true });

      service.init(gridStub, container);
      const tool = getTool(modelContext, 'apply_slickgrid_state_');

      const state = { filters: [{ columnId: 'priority', searchTerms: ['Low'] }] };
      const result: any = await tool.execute(state);

      expect(filterServiceStub.updateFilters).toHaveBeenCalledWith(state.filters);
      expect(result).toEqual({ status: 'success', appliedState: state });
    });
  });

  // -------------------------------------------------------------------------
  describe('read_slickgrid_data tool', () => {
    it('should return sliced items and total count', async () => {
      const modelContext = makeModelContext();
      Object.defineProperty(navigator, 'modelContext', { value: modelContext, writable: true, configurable: true });

      service.init(gridStub, container);
      const tool = getTool(modelContext, 'read_slickgrid_data_');
      const result: any = await tool.execute({ limit: 1 });

      expect(result).toEqual({ data: [mockItems[0]], totalCount: mockItems.length });
    });

    it('should handle dataView returned as a raw array', async () => {
      const modelContext = makeModelContext();
      Object.defineProperty(navigator, 'modelContext', { value: modelContext, writable: true, configurable: true });

      // make grid.getData return a plain array instead of a DataView-like object
      (gridStub.getData as any).mockReturnValueOnce(mockItems);

      service.init(gridStub, container);
      const tool = getTool(modelContext, 'read_slickgrid_data_');
      const result: any = await tool.execute({ limit: 1 });

      expect(result).toEqual({ data: [mockItems[0]], totalCount: mockItems.length });
    });
  });
});
