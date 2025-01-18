import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('sortablejs', () => ({
  default: {
    el: undefined,
    options: {} as SortableOptions,
    constructor: vi.fn(),
    create: (el, options) => {
      return {
        el,
        options,
        destroy: vi.fn(),
        toArray: vi.fn(),
      };
    },
    utils: {
      clone: (el) => el.cloneNode(true),
    },
  },
}));

import { type SortableOptions } from 'sortablejs';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import { createDomElement, deepCopy } from '@slickgrid-universal/utils';

import { Aggregators } from '../../aggregators/aggregators.index.js';
import { SlickDraggableGrouping } from '../slickDraggableGrouping.js';
import { ExtensionUtility } from '../../extensions/extensionUtility.js';
import type { Column, DraggableGroupingOption, GridOption } from '../../interfaces/index.js';
import { BackendUtilityService } from '../../services/backendUtility.service.js';
import { SharedService } from '../../services/shared.service.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { SortDirectionNumber } from '../../enums/index.js';
import { SlickEvent, SlickEventData, type SlickGrid } from '../../core/index.js';

const GRID_UID = 'slickgrid12345';

const addonOptions: DraggableGroupingOption = {
  dropPlaceHolderText: 'Drop a column header here to group by the column',
  hideGroupSortIcons: false,
  hideToggleAllButton: false,
  toggleAllButtonText: '',
  toggleAllPlaceholderText: 'Toggle all Groups',
};

const gridOptionsMock = {
  enableDraggableGrouping: true,
  draggableGrouping: {
    hideToggleAllButton: false,
    deleteIconCssClass: 'mdi mdi-close text-color-danger',
  },
  showHeaderRow: false,
  showTopPanel: false,
  showPreHeaderPanel: false,
} as unknown as GridOption;

const dataViewStub = {
  collapseAllGroups: vi.fn(),
  expandAllGroups: vi.fn(),
  setGrouping: vi.fn(),
};

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
};

const gridStub = {
  getCellNode: vi.fn(),
  getCellFromEvent: vi.fn(),
  getColumns: vi.fn(),
  getContainerNode: vi.fn(),
  getHeaderColumn: vi.fn(),
  getOptions: vi.fn(),
  getPreHeaderPanel: vi.fn(),
  getTopHeaderPanel: vi.fn(),
  getData: () => dataViewStub,
  getEditorLock: () => getEditorLockMock,
  getUID: () => GRID_UID,
  invalidate: vi.fn(),
  registerPlugin: vi.fn(),
  updateColumnHeader: vi.fn(),
  onColumnsReordered: new SlickEvent(),
  onHeaderCellRendered: new SlickEvent(),
  onHeaderMouseEnter: new SlickEvent(),
  onMouseEnter: new SlickEvent(),
} as unknown as SlickGrid;

const mockColumns = [
  { id: 'firstName', name: 'First Name', field: 'firstName', width: 100 },
  { id: 'lastName', name: 'Last Name', field: 'lastName', width: 100 },
  {
    id: 'age',
    name: 'Age',
    field: 'age',
    width: 50,
    sortable: true,
    grouping: {
      getter: 'age',
      aggregators: [new Aggregators.Avg('age')],
      formatter: (g) => `Age: ${g.value} <span class="text-green">(${g.count} items)</span>`,
      collapsed: true,
    },
  },
  {
    id: 'medals',
    name: 'Medals',
    field: 'medals',
    width: 50,
    sortable: true,
    grouping: {
      getter: 'medals',
      aggregators: [new Aggregators.Sum('medals')],
      formatter: (g) => `Medals: ${g.value} <span class="text-green">(${g.count} items)</span>`,
    },
  },
  { name: 'Gender', field: 'gender', width: 75 },
] as Column[];

describe('Draggable Grouping Plugin', () => {
  let eventPubSubService: EventPubSubService;
  let plugin: SlickDraggableGrouping;
  let sharedService: SharedService;
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let gridContainerDiv: HTMLDivElement;
  let translateService: TranslateServiceStub;
  let headerDiv: HTMLDivElement;
  let preHeaderDiv: HTMLDivElement;
  let dropzoneElm: HTMLDivElement;

  beforeEach(() => {
    gridContainerDiv = document.createElement('div');
    gridContainerDiv.className = `slickgrid-container ${GRID_UID}`;
    headerDiv = document.createElement('div');
    dropzoneElm = document.createElement('div');
    dropzoneElm.className = 'slick-dropzone';
    headerDiv.className = 'slick-header-column';
    preHeaderDiv = document.createElement('div');
    preHeaderDiv.className = 'slick-preheader-panel';
    gridContainerDiv.appendChild(preHeaderDiv);
    preHeaderDiv.appendChild(dropzoneElm);
    document.body.appendChild(gridContainerDiv);

    eventPubSubService = new EventPubSubService();
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    sharedService.slickGrid = gridStub;
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    vi.spyOn(gridStub, 'getContainerNode').mockReturnValue(document.body as HTMLDivElement);
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    vi.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(dropzoneElm);
    plugin = new SlickDraggableGrouping(extensionUtility, eventPubSubService, sharedService);
  });

  afterEach(() => {
    plugin.dispose();
    document.body.innerHTML = '';
  });

  it('should create the plugin', () => {
    expect(plugin).toBeTruthy();
    expect(plugin.gridUid).toBe('slickgrid12345');
    expect(plugin.eventHandler).toBeTruthy();
  });

  it('should create and dispose of the plugin', () => {
    const disposeSpy = vi.spyOn(plugin, 'dispose');
    expect(plugin).toBeTruthy();

    plugin.dispose();

    expect(plugin.eventHandler).toBeTruthy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should use default options when instantiating the plugin without passing any arguments', () => {
    plugin.init(gridStub, addonOptions);
    expect(plugin.addonOptions).toEqual(addonOptions);
  });

  it('should throw when pre-header is missing and not enabled', () => {
    vi.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValueOnce(null as any);
    expect(() => plugin.init(gridStub, addonOptions)).toThrow('[Slickgrid-Universal] Draggable Grouping requires the pre-header to be created and shown');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button text when provided to the plugin', () => {
    plugin.init(gridStub, { ...addonOptions, toggleAllButtonText: 'Toggle all Groups' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel') as HTMLDivElement;
    const toggleAllTextElm = preHeaderElm.querySelector('.slick-group-toggle-all-text') as HTMLDivElement;
    expect(preHeaderElm).toBeTruthy();
    expect(toggleAllTextElm.textContent).toBe('Toggle all Groups');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button text with translated value when provided to the plugin with "toggleAllButtonTextKey"', () => {
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, toggleAllButtonTextKey: 'TOGGLE_ALL_GROUPS' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel') as HTMLDivElement;
    const toggleAllTextElm = preHeaderElm.querySelector('.slick-group-toggle-all-text') as HTMLDivElement;

    expect(preHeaderElm).toBeTruthy();
    expect(toggleAllTextElm.textContent).toBe('Basculer tous les groupes');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button tooltip with translated value when provided to the plugin with "toggleAllPlaceholderText"', () => {
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, toggleAllPlaceholderTextKey: 'TOGGLE_ALL_GROUPS' });

    const dropzoneElm = document.querySelector('.slick-preheader-panel') as HTMLDivElement;
    const toggleAllTextElm = dropzoneElm.querySelector('.slick-group-toggle-all') as HTMLDivElement;

    expect(dropzoneElm).toBeTruthy();
    expect(toggleAllTextElm.title).toBe('Basculer tous les groupes');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button text with translated value when provided to the plugin with "toggleAllButtonTextKey"', () => {
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, dropPlaceHolderTextKey: 'GROUP_BY' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel') as HTMLDivElement;
    const dropboxPlaceholderElm = preHeaderElm.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;

    expect(preHeaderElm).toBeTruthy();
    expect(dropboxPlaceholderElm.textContent).toBe('Groupé par');
  });

  it('should add an icon beside each column title when "groupIconCssClass" is provided', () => {
    vi.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, groupIconCssClass: 'mdi mdi-drag' });
    const eventData = { ...new SlickEventData(), preventDefault: vi.fn() };
    gridStub.onHeaderCellRendered.notify({ column: mockColumns[2], node: headerDiv, grid: gridStub }, eventData as any, gridStub);
    const groupableElm = headerDiv.querySelector('.slick-column-groupable') as HTMLSpanElement;

    expect(headerDiv.style.cursor).toBe('pointer');
    expect(groupableElm.classList.contains('mdi-drag')).toBeTruthy();
  });

  describe('setupColumnReorder definition', () => {
    let mockDivPaneContainer1: HTMLDivElement;
    let headerColumnDiv1: HTMLDivElement;
    let headerColumnDiv2: HTMLDivElement;
    let headerColumnDiv3: HTMLDivElement;
    let headerColumnDiv4: HTMLDivElement;
    let mockHeaderLeftDiv1: HTMLDivElement;
    let mockHeaderLeftDiv2: HTMLDivElement;
    const setColumnsSpy = vi.fn();
    const setColumnResizeSpy = vi.fn();
    const getColumnIndexSpy = vi.fn();
    const triggerSpy = vi.fn();
    const setGroupingSpy = vi.spyOn(dataViewStub, 'setGrouping');

    beforeEach(() => {
      mockDivPaneContainer1 = document.createElement('div');
      const mockDivPaneContainerElm = document.createElement('div');
      mockDivPaneContainerElm.className = 'slick-pane-header';
      const mockDivPaneContainerElm2 = document.createElement('div');
      mockDivPaneContainerElm2.className = 'slick-pane-header';
      mockHeaderLeftDiv1 = document.createElement('div');
      mockHeaderLeftDiv2 = document.createElement('div');
      mockHeaderLeftDiv1.className = 'slick-header-columns slick-header-columns-left';
      mockHeaderLeftDiv2.className = 'slick-header-columns slick-header-columns-right';

      mockDivPaneContainerElm.appendChild(mockHeaderLeftDiv1);
      mockDivPaneContainerElm2.appendChild(mockHeaderLeftDiv2);
      gridContainerDiv.appendChild(mockDivPaneContainerElm);
      gridContainerDiv.appendChild(mockDivPaneContainerElm2);
      headerColumnDiv1 = createDomElement('div', { className: 'slick-header-column', id: `${GRID_UID}firstName`, dataset: { id: 'firstName' } }, preHeaderDiv);
      headerColumnDiv2 = createDomElement('div', { className: 'slick-header-column', id: `${GRID_UID}lastName`, dataset: { id: 'lastName' } }, preHeaderDiv);
      headerColumnDiv3 = createDomElement('div', { className: 'slick-header-column', id: `${GRID_UID}age`, dataset: { id: 'age' } }, preHeaderDiv);
      headerColumnDiv4 = createDomElement('div', { className: 'slick-header-column', id: `${GRID_UID}medals`, dataset: { id: 'medals' } }, preHeaderDiv);
      headerColumnDiv1.appendChild(createDomElement('span', { className: 'slick-column-name', textContent: 'First Name' }));
      headerColumnDiv2.appendChild(createDomElement('span', { className: 'slick-column-name', textContent: 'Last Name' }));
      headerColumnDiv3.appendChild(createDomElement('span', { className: 'slick-column-name', textContent: 'Age' }));
      headerColumnDiv4.appendChild(createDomElement('span', { className: 'slick-column-name', textContent: 'Medals' }));
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should execute the "onStart" and "onAdd" callbacks of Sortable and expect css classes to be updated', () => {
      plugin.init(gridStub, { ...addonOptions });
      const fn = plugin.setupColumnReorder(
        gridStub,
        mockHeaderLeftDiv1,
        {},
        setColumnsSpy,
        setColumnResizeSpy,
        mockColumns,
        getColumnIndexSpy,
        GRID_UID,
        triggerSpy
      );
      vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['age', 'medals']);

      fn.sortableLeftInstance!.options.onStart!({} as any);
      plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);

      let groupByRemoveElm = preHeaderDiv.querySelector('.slick-groupby-remove') as HTMLDivElement;
      const groupByRemoveImageElm = document.querySelector('.slick-groupby-remove-icon') as HTMLDivElement;
      let placeholderElm = preHeaderDiv.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;

      expect(fn.sortableLeftInstance).toEqual(plugin.sortableLeftInstance);
      expect(fn.sortableRightInstance).toEqual(plugin.sortableRightInstance);
      expect(fn.sortableLeftInstance.destroy).toBeTruthy();
      expect(groupByRemoveElm).toBeTruthy();
      expect(groupByRemoveImageElm).toBeTruthy();

      groupByRemoveElm.dispatchEvent(new Event('click'));

      groupByRemoveElm = preHeaderDiv.querySelector('.slick-groupby-remove') as HTMLDivElement;
      placeholderElm = preHeaderDiv.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;
      const toggleAllElm = preHeaderDiv.querySelector('.slick-group-toggle-all') as HTMLDivElement;

      expect(setGroupingSpy).toHaveBeenCalledWith([]);
      expect(groupByRemoveElm).toBeFalsy();
      expect(placeholderElm.style.display).toBe('inline-block');
      expect(toggleAllElm.style.display).toBe('none');
    });

    it('should execute the "onEnd" callback of Sortable and expect css classes to be updated', () => {
      plugin.init(gridStub, { ...addonOptions });
      const fn = plugin.setupColumnReorder(
        gridStub,
        mockHeaderLeftDiv1,
        {},
        setColumnsSpy,
        setColumnResizeSpy,
        mockColumns,
        getColumnIndexSpy,
        GRID_UID,
        triggerSpy
      );
      vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue([]);

      fn.sortableLeftInstance!.options.onStart!({} as any);
      plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);
      fn.sortableLeftInstance.options.onEnd!(new CustomEvent('end') as any);

      const placeholderElm = preHeaderDiv.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;
      const dropGroupingElm = preHeaderDiv.querySelector('.slick-dropped-grouping') as HTMLDivElement;
      expect(placeholderElm.style.display).toBe('none');
      expect(dropGroupingElm.style.display).toBe('flex');
    });

    it('should execute the "onEnd" callback of Sortable and expect sortable to be cancelled', () => {
      plugin.init(gridStub, { ...addonOptions });
      plugin.setAddonOptions({ deleteIconCssClass: 'mdi mdi-close text-color-danger' });
      const fn = plugin.setupColumnReorder(
        gridStub,
        mockHeaderLeftDiv1,
        {},
        setColumnsSpy,
        setColumnResizeSpy,
        mockColumns,
        getColumnIndexSpy,
        GRID_UID,
        triggerSpy
      );

      fn.sortableLeftInstance!.options.onStart!({} as any);
      plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);
      fn.sortableLeftInstance.options.onEnd!(new CustomEvent('end') as any);

      const groupByRemoveElm = document.querySelector('.slick-groupby-remove.mdi-close') as HTMLDivElement;
      expect(groupByRemoveElm).toBeTruthy();

      expect(setColumnsSpy).not.toHaveBeenCalled();
      expect(setColumnResizeSpy).not.toHaveBeenCalled();
      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('should clear grouping and expect placeholder to be displayed when calling "onEnd" callback', () => {
      plugin.init(gridStub, { ...addonOptions });
      plugin.setAddonOptions({ deleteIconCssClass: 'mdi mdi-close text-color-danger' });
      const fn = plugin.setupColumnReorder(
        gridStub,
        mockHeaderLeftDiv1,
        {},
        setColumnsSpy,
        setColumnResizeSpy,
        mockColumns,
        getColumnIndexSpy,
        GRID_UID,
        triggerSpy
      );

      fn.sortableLeftInstance!.options.onStart!({} as any);
      plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);
      plugin.clearDroppedGroups();
      fn.sortableLeftInstance.options.onEnd!(new CustomEvent('end') as any);

      const draggablePlaceholderElm = dropzoneElm.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;
      expect(draggablePlaceholderElm.style.display).toEqual('inline-block');
    });

    it('should execute the "onEnd" callback of Sortable and expect css classes to be updated', () => {
      plugin.init(gridStub, { ...addonOptions });
      plugin.setColumns(mockColumns);
      plugin.setAddonOptions({ deleteIconCssClass: 'mdi mdi-close' });
      vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
      getColumnIndexSpy.mockReturnValue(2);
      const fn = plugin.setupColumnReorder(
        gridStub,
        mockHeaderLeftDiv1,
        {},
        setColumnsSpy,
        setColumnResizeSpy,
        mockColumns,
        getColumnIndexSpy,
        GRID_UID,
        triggerSpy
      );
      vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['age', 'medals']);

      fn.sortableLeftInstance!.options.onStart!({} as any);
      plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);

      const groupByRemoveElm = document.querySelector('.slick-groupby-remove.mdi-close');
      expect(groupByRemoveElm).toBeTruthy();

      fn.sortableLeftInstance.options.onEnd!(new CustomEvent('end') as any);

      expect(setColumnsSpy).toHaveBeenCalledWith([mockColumns[2], mockColumns[2]]);
      expect(setColumnResizeSpy).toHaveBeenCalled();
      expect(triggerSpy).toHaveBeenCalledWith(gridStub.onColumnsReordered, { grid: gridStub, impactedColumns: expect.arrayContaining([mockColumns[2]]) });
    });

    it('should drag over dropzone and expect hover css class be added and removed when dragging outside of dropzone', () => {
      plugin.init(gridStub, { ...addonOptions });
      plugin.setAddonOptions({ deleteIconCssClass: 'mdi mdi-close text-color-danger' });
      const fn = plugin.setupColumnReorder(
        gridStub,
        mockHeaderLeftDiv1,
        {},
        setColumnsSpy,
        setColumnResizeSpy,
        mockColumns,
        getColumnIndexSpy,
        GRID_UID,
        triggerSpy
      );

      fn.sortableLeftInstance!.options.onStart!({} as any);
      plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);
      fn.sortableLeftInstance.options.onEnd!(new CustomEvent('end') as any);
      const dropzonePlaceholderElm = dropzoneElm.querySelector('.slick-draggable-dropzone-placeholder');

      const dragoverEvent = new CustomEvent('dragover', { bubbles: true, detail: {} });
      dropzonePlaceholderElm?.dispatchEvent(dragoverEvent);

      const dragenterEvent = new CustomEvent('dragenter', { bubbles: true, detail: {} });
      dropzonePlaceholderElm?.dispatchEvent(dragenterEvent);
      expect(dropzoneElm.classList.contains('slick-dropzone-hover')).toBeTruthy();

      const dragleaveEvent = new CustomEvent('dragleave', { bubbles: true, detail: {} });
      dropzonePlaceholderElm?.dispatchEvent(dragleaveEvent);
      expect(dropzoneElm.classList.contains('slick-dropzone-hover')).toBeFalsy();
    });

    describe('setupColumnDropbox method', () => {
      describe('setupColumnDropbox update & toggler click event', () => {
        let groupChangedSpy: any;
        let mockHeaderColumnDiv1: HTMLDivElement;
        let mockHeaderColumnDiv2: HTMLDivElement;
        let onGroupChangedCallbackSpy: any;

        beforeEach(() => {
          onGroupChangedCallbackSpy = vi.fn();
          groupChangedSpy = vi.spyOn(plugin.onGroupChanged, 'notify');
          mockHeaderColumnDiv1 = document.createElement('div');
          mockHeaderColumnDiv1.className = 'slick-dropped-grouping';
          mockHeaderColumnDiv1.id = 'age';
          mockHeaderColumnDiv1.dataset.id = 'age';
          mockColumns[2].grouping!.collapsed = false;

          mockHeaderColumnDiv2 = document.createElement('div');
          mockHeaderColumnDiv2.className = 'slick-dropped-grouping';
          mockHeaderColumnDiv2.id = 'medals';
          mockHeaderColumnDiv2.dataset.id = 'medals';
          dropzoneElm.appendChild(mockHeaderColumnDiv1);
          dropzoneElm.appendChild(mockHeaderColumnDiv2);

          mockHeaderColumnDiv1.appendChild(mockDivPaneContainer1);
          mockHeaderColumnDiv2.appendChild(mockDivPaneContainer1);

          plugin.init(gridStub, { ...addonOptions, deleteIconCssClass: 'mdi mdi-close', onGroupChanged: onGroupChangedCallbackSpy });
          plugin.setAddonOptions({ deleteIconCssClass: 'mdi mdi-close' });

          vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
          const fn = plugin.setupColumnReorder(
            gridStub,
            mockHeaderLeftDiv1,
            {},
            setColumnsSpy,
            setColumnResizeSpy,
            mockColumns,
            getColumnIndexSpy,
            GRID_UID,
            triggerSpy
          );
          vi.spyOn(plugin.droppableInstance!, 'toArray').mockReturnValue(['age', 'medals']);
          fn.sortableLeftInstance!.options.onStart!({} as any);
          plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);
          plugin.droppableInstance?.options.onUpdate!({ item: mockDivPaneContainer1, clone: mockDivPaneContainer1.cloneNode(true) } as any);
        });

        afterEach(() => {
          plugin.dispose();
          vi.clearAllMocks();
        });

        it('should initialize the Draggable Grouping with initial groups when provided to the plugin', () => {
          const setGroupedSpy = vi.spyOn(plugin, 'setDroppedGroups');
          plugin.init(gridStub, { ...addonOptions, initialGroupBy: ['duration'] });
          plugin.isInitialized = false;
          vi.spyOn(gridStub, 'getHeaderColumn').mockReturnValue(mockHeaderColumnDiv1);
          plugin.setupColumnReorder(gridStub, mockHeaderLeftDiv1, {}, setColumnsSpy, setColumnResizeSpy, mockColumns, getColumnIndexSpy, GRID_UID, triggerSpy);

          const preHeaderElm = document.querySelector('.slick-preheader-panel') as HTMLDivElement;
          expect(preHeaderElm).toBeTruthy();
          expect(setGroupedSpy).toHaveBeenCalledWith(['duration']);
        });

        it('should call sortable "update" from setupColumnDropbox and expect "updateGroupBy" to be called with a sort-group', () => {
          expect(plugin.dropboxElement).toEqual(dropzoneElm);
          expect(plugin.columnsGroupBy.length).toBeGreaterThan(0);
          const onGroupChangedArgs = {
            caller: 'sort-group',
            groupColumns: [
              {
                aggregators: expect.any(Array),
                formatter: mockColumns[2].grouping!.formatter,
                getter: 'age',
                collapsed: false,
                sortAsc: true,
              },
            ],
          };
          expect(onGroupChangedCallbackSpy).toHaveBeenCalledWith(expect.anything(), onGroupChangedArgs);
          expect(groupChangedSpy).toHaveBeenCalledWith(onGroupChangedArgs);

          vi.spyOn(gridStub, 'getHeaderColumn').mockReturnValue(mockHeaderColumnDiv1);
          plugin.setDroppedGroups('age');
        });

        it('should call "clearDroppedGroups" and expect the grouping to be cleared', () => {
          const preHeaderElm = document.querySelector('.slick-preheader-panel') as HTMLDivElement;
          let dropboxPlaceholderElm = preHeaderElm.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;

          plugin.clearDroppedGroups();
          dropboxPlaceholderElm = preHeaderElm.querySelector('.slick-draggable-dropzone-placeholder') as HTMLDivElement;
          expect(dropboxPlaceholderElm.style.display).toBe('inline-block');
          expect(onGroupChangedCallbackSpy).toHaveBeenCalledWith(expect.anything(), { caller: 'clear-all', groupColumns: [] });
          expect(groupChangedSpy).toHaveBeenCalledWith({ caller: 'clear-all', groupColumns: [] });
        });

        it('should use the Toggle All and expect classes to be toggled and DataView to call necessary method', () => {
          const dvExpandSpy = vi.spyOn(dataViewStub, 'expandAllGroups');
          const dvCollapseSpy = vi.spyOn(dataViewStub, 'collapseAllGroups');
          let toggleAllElm = document.querySelector('.slick-group-toggle-all') as HTMLDivElement;
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon') as HTMLDivElement;
          const clickEvent = new Event('click');
          Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: toggleAllIconElm });

          // initially collapsed
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeFalsy();
          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();

          // collapsed after toggle
          toggleAllElm.dispatchEvent(clickEvent);
          toggleAllElm = document.querySelector('.slick-group-toggle-all') as HTMLDivElement;
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeTruthy();
          expect(toggleAllIconElm.classList.contains('expanded')).toBeFalsy();
          expect(dvCollapseSpy).toHaveBeenCalled();

          // expanded after toggle
          toggleAllElm.dispatchEvent(clickEvent);
          toggleAllElm = document.querySelector('.slick-group-toggle-all') as HTMLDivElement;
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeFalsy();
          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();
          expect(dvExpandSpy).toHaveBeenCalled();
        });

        it('should clear all grouping when that action is called from Context Menu, it must be also cleared in the Draggable Grouping preheader', () => {
          const clearGroupSpy = vi.spyOn(plugin, 'clearDroppedGroups');
          eventPubSubService.publish('onContextMenuClearGrouping');
          expect(clearGroupSpy).toHaveBeenCalled();
        });

        it('should change the toggle icon to collapsed when that action is called from the Context Menu', () => {
          eventPubSubService.publish('onContextMenuCollapseAllGroups');
          const toggleAllElm = document.querySelector('.slick-group-toggle-all') as HTMLDivElement;
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon') as HTMLDivElement;

          expect(toggleAllIconElm.classList.contains('expanded')).toBeFalsy();
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeTruthy();
        });

        it('should change the toggle icon to expanded when that action is called from the Context Menu', () => {
          eventPubSubService.publish('onContextMenuExpandAllGroups');
          const toggleAllElm = document.querySelector('.slick-group-toggle-all') as HTMLDivElement;
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon') as HTMLDivElement;

          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeFalsy();
        });
      });

      describe('setupColumnDropbox sort icon and click events', () => {
        let groupChangedSpy: any;
        let mockHeaderColumnDiv1: HTMLDivElement;
        let mockHeaderColumnDiv2: HTMLDivElement;

        beforeEach(() => {
          groupChangedSpy = vi.spyOn(plugin.onGroupChanged, 'notify');
          mockHeaderColumnDiv1 = document.createElement('div');
          mockHeaderColumnDiv1.className = 'slick-dropped-grouping';
          mockHeaderColumnDiv1.id = 'age';
          mockHeaderColumnDiv1.dataset.id = 'age';
          mockColumns[2].grouping!.collapsed = false;

          mockHeaderColumnDiv2 = document.createElement('div');
          mockHeaderColumnDiv2.className = 'slick-dropped-grouping';
          mockHeaderColumnDiv2.id = 'medals';
          mockHeaderColumnDiv2.dataset.id = 'medals';
          dropzoneElm.appendChild(mockHeaderColumnDiv1);
          dropzoneElm.appendChild(mockHeaderColumnDiv2);

          mockHeaderColumnDiv1.appendChild(mockDivPaneContainer1);
          mockHeaderColumnDiv2.appendChild(mockDivPaneContainer1);
        });

        afterEach(() => {
          plugin.dispose();
          vi.clearAllMocks();
        });

        it('should ', () => {});

        it('should not expect any sort icons displayed when "hideGroupSortIcons" is set to True', () => {
          plugin.init(gridStub, { ...addonOptions, hideGroupSortIcons: true });
          const fn = plugin.setupColumnReorder(
            gridStub,
            mockHeaderLeftDiv1,
            {},
            setColumnsSpy,
            setColumnResizeSpy,
            mockColumns,
            getColumnIndexSpy,
            GRID_UID,
            triggerSpy
          );
          vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['age', 'medals']);

          fn.sortableLeftInstance!.options.onStart!({} as any);
          plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);

          expect(plugin.addonOptions.hideGroupSortIcons).toBe(true);
          const groupBySortElm = preHeaderDiv.querySelector('.slick-groupby-sort') as HTMLDivElement;
          const groupBySortAscIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-asc-icon') as HTMLDivElement;

          expect(fn.sortableLeftInstance).toEqual(plugin.sortableLeftInstance);
          expect(fn.sortableRightInstance).toEqual(plugin.sortableRightInstance);
          expect(fn.sortableLeftInstance.destroy).toBeTruthy();
          expect(groupBySortElm).toBeFalsy();
          expect(groupBySortAscIconElm).toBeFalsy();
        });

        it('should not expect any sort icons displayed when the Column is not Sortable', () => {
          const mockColumnsCopy = deepCopy(mockColumns);
          mockColumnsCopy[2].sortable = false; // change age column to not sortable
          vi.spyOn(gridStub, 'getColumns').mockReturnValueOnce(mockColumnsCopy);
          plugin.init(gridStub, { ...addonOptions });
          const fn = plugin.setupColumnReorder(
            gridStub,
            mockHeaderLeftDiv1,
            {},
            setColumnsSpy,
            setColumnResizeSpy,
            mockColumnsCopy,
            getColumnIndexSpy,
            GRID_UID,
            triggerSpy
          );
          vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['age']);

          fn.sortableLeftInstance!.options.onStart!({} as any);
          plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);

          const groupBySortElm = preHeaderDiv.querySelector('.slick-groupby-sort') as HTMLDivElement;
          const groupBySortAscIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-asc-icon') as HTMLDivElement;

          // we're not hiding the columns, but it's not Sortable so the result is the same
          expect(plugin.addonOptions.hideGroupSortIcons).toBe(false);
          expect(groupBySortElm).toBeFalsy();
          expect(groupBySortAscIconElm).toBeFalsy();
        });

        it('should toggle ascending/descending order when original sort is ascending then user clicked the sorting icon twice', () => {
          const onGroupChangedCallbackSpy = vi.fn();
          plugin.init(gridStub, { ...addonOptions, onGroupChanged: onGroupChangedCallbackSpy });
          const fn = plugin.setupColumnReorder(
            gridStub,
            mockHeaderLeftDiv1,
            {},
            setColumnsSpy,
            setColumnResizeSpy,
            mockColumns,
            getColumnIndexSpy,
            GRID_UID,
            triggerSpy
          );
          vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['age', 'medals']);
          const invalidateSpy = vi.spyOn(gridStub, 'invalidate');

          fn.sortableLeftInstance!.options.onStart!({} as any);
          plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);

          const groupBySortElm = preHeaderDiv.querySelector('.slick-groupby-sort') as HTMLDivElement;
          let groupBySortAscIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-asc-icon') as HTMLDivElement;

          expect(fn.sortableLeftInstance).toEqual(plugin.sortableLeftInstance);
          expect(fn.sortableRightInstance).toEqual(plugin.sortableRightInstance);
          expect(fn.sortableLeftInstance.destroy).toBeTruthy();
          expect(groupBySortElm).toBeTruthy();
          expect(groupBySortAscIconElm).toBeTruthy();

          groupBySortAscIconElm.dispatchEvent(new Event('click'));
          const toggleAllElm = document.querySelector('.slick-group-toggle-all') as HTMLDivElement;
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon') as HTMLDivElement;
          groupBySortAscIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-asc-icon') as HTMLDivElement;
          let groupBySortDescIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-desc-icon') as HTMLDivElement;

          expect(setGroupingSpy).toHaveBeenCalledWith(expect.any(Array));
          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();
          expect(groupBySortAscIconElm).toBeFalsy();
          expect(groupBySortDescIconElm).toBeTruthy();

          groupBySortDescIconElm.dispatchEvent(new Event('click'));
          groupBySortAscIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-asc-icon') as HTMLDivElement;
          groupBySortDescIconElm = preHeaderDiv.querySelector('.slick-groupby-sort-desc-icon') as HTMLDivElement;

          expect(setGroupingSpy).toHaveBeenCalledWith(expect.any(Array));
          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();
          expect(groupBySortAscIconElm).toBeTruthy();
          expect(groupBySortDescIconElm).toBeFalsy();
          expect(invalidateSpy).toHaveBeenCalledTimes(2);
          expect(onGroupChangedCallbackSpy).toHaveBeenCalledWith(expect.anything(), { caller: 'sort-group', groupColumns: expect.any(Array) });
          expect(groupChangedSpy).toHaveBeenCalledWith({ caller: 'sort-group', groupColumns: expect.any(Array) });
        });

        it('should toggle ascending/descending order with different icons when original sort is ascending then user clicked the sorting icon twice', () => {
          const onGroupChangedCallbackSpy = vi.fn();
          plugin.init(gridStub, {
            ...addonOptions,
            sortAscIconCssClass: 'mdi mdi-arrow-up',
            sortDescIconCssClass: 'mdi mdi-arrow-down',
            onGroupChanged: onGroupChangedCallbackSpy,
          });
          const fn = plugin.setupColumnReorder(
            gridStub,
            mockHeaderLeftDiv1,
            {},
            setColumnsSpy,
            setColumnResizeSpy,
            mockColumns,
            getColumnIndexSpy,
            GRID_UID,
            triggerSpy
          );
          vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['age', 'medals']);
          const invalidateSpy = vi.spyOn(gridStub, 'invalidate');

          fn.sortableLeftInstance!.options.onStart!({} as any);
          plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);

          const groupBySortElm = preHeaderDiv.querySelector('.slick-groupby-sort') as HTMLDivElement;
          let groupBySortAscIconElm = preHeaderDiv.querySelector('.mdi-arrow-up') as HTMLDivElement;

          expect(fn.sortableLeftInstance).toEqual(plugin.sortableLeftInstance);
          expect(fn.sortableRightInstance).toEqual(plugin.sortableRightInstance);
          expect(fn.sortableLeftInstance.destroy).toBeTruthy();
          expect(groupBySortElm).toBeTruthy();
          expect(groupBySortAscIconElm).toBeTruthy();

          groupBySortAscIconElm.dispatchEvent(new Event('click'));
          groupBySortAscIconElm = preHeaderDiv.querySelector('.mdi-arrow-up') as HTMLDivElement;
          let groupBySortDescIconElm = preHeaderDiv.querySelector('.mdi-arrow-down') as HTMLDivElement;

          expect(setGroupingSpy).toHaveBeenCalledWith(expect.any(Array));
          expect(groupBySortAscIconElm).toBeFalsy();
          expect(groupBySortDescIconElm).toBeTruthy();

          groupBySortDescIconElm.dispatchEvent(new Event('click'));
          groupBySortAscIconElm = preHeaderDiv.querySelector('.mdi-arrow-up') as HTMLDivElement;
          groupBySortDescIconElm = preHeaderDiv.querySelector('.mdi-arrow-down') as HTMLDivElement;

          expect(setGroupingSpy).toHaveBeenCalledWith(expect.any(Array));
          expect(groupBySortAscIconElm).toBeTruthy();
          expect(groupBySortDescIconElm).toBeFalsy();
          expect(invalidateSpy).toHaveBeenCalledTimes(2);
          expect(onGroupChangedCallbackSpy).toHaveBeenCalledWith(expect.anything(), { caller: 'sort-group', groupColumns: expect.any(Array) });
          expect(groupChangedSpy).toHaveBeenCalledWith({ caller: 'sort-group', groupColumns: expect.any(Array) });

          const sortResult1 = mockColumns[2].grouping!.comparer!({ value: 'John', count: 0 }, { value: 'Jane', count: 1 });
          expect(sortResult1).toBe(SortDirectionNumber.asc);

          const sortResult2 = mockColumns[2].grouping!.comparer!({ value: 'Jane', count: 1 }, { value: 'John', count: 0 });
          expect(sortResult2).toBe(SortDirectionNumber.desc);
        });
      });
    });

    describe('with Frozen Grid', () => {
      beforeEach(() => {
        gridOptionsMock.frozenColumn = 2;
        setColumnsSpy.mockClear();
        vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
        getColumnIndexSpy.mockReturnValueOnce(0).mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3).mockReturnValueOnce(4);
      });

      it('should execute the "onEnd" callback of Sortable and expect sortable to be cancelled', () => {
        plugin.init(gridStub, { ...addonOptions });
        plugin.setAddonOptions({ deleteIconCssClass: 'mdi mdi-close text-color-danger' });
        const fn = plugin.setupColumnReorder(
          gridStub,
          [mockHeaderLeftDiv1, mockHeaderLeftDiv2],
          {},
          setColumnsSpy,
          setColumnResizeSpy,
          mockColumns,
          getColumnIndexSpy,
          GRID_UID,
          triggerSpy
        );
        vi.spyOn(fn.sortableLeftInstance, 'toArray').mockReturnValue(['firstName', 'lastName', 'age']);
        vi.spyOn(fn.sortableRightInstance, 'toArray').mockReturnValue(['gender']);

        fn.sortableLeftInstance!.options.onStart!({} as any);
        plugin.droppableInstance!.options.onAdd!({ item: headerColumnDiv3, clone: headerColumnDiv3.cloneNode(true) } as any);
        fn.sortableLeftInstance.options.onEnd!(new CustomEvent('end') as any);

        const groupByRemoveElm = document.querySelector('.slick-groupby-remove.mdi-close') as HTMLDivElement;
        expect(groupByRemoveElm).toBeTruthy();

        mockColumns.pop(); // all original columns except last column which is what we returned on sortableRightInstance
        expect(setColumnsSpy).toHaveBeenCalledWith(mockColumns);
      });
    });
  });
});
