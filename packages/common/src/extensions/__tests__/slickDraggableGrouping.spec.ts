import 'jquery-ui/ui/widgets/sortable';
import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';

import { Aggregators } from '../../aggregators/aggregators.index';
import { SlickDraggableGrouping } from '../slickDraggableGrouping';
import { ExtensionUtility } from '../../extensions/extensionUtility';
import { Column, DraggableGroupingOption, GridOption, SlickGrid, SlickNamespace } from '../../interfaces/index';
import { BackendUtilityService, } from '../../services';
import { SharedService } from '../../services/shared.service';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;
const GRID_UID = 'slickgrid12345';

let addonOptions: DraggableGroupingOption = {
  dropPlaceHolderText: 'Drop a column header here to group by the column',
  hideToggleAllButton: false,
  toggleAllButtonText: '',
  toggleAllPlaceholderText: 'Toggle all Groups',
};

const gridOptionsMock = {
  enableDraggableGrouping: true,
  draggableGrouping: {
    hideToggleAllButton: false,
  },
  showHeaderRow: false,
  showTopPanel: false,
  showPreHeaderPanel: false
} as unknown as GridOption;

const dataViewStub = {
  collapseAllGroups: jest.fn(),
  expandAllGroups: jest.fn(),
  setGrouping: jest.fn(),
}

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
};

const gridStub = {
  getCellNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getColumns: jest.fn(),
  getHeaderColumn: jest.fn(),
  getOptions: jest.fn(),
  getPreHeaderPanel: jest.fn(),
  getData: () => dataViewStub,
  getEditorLock: () => getEditorLockMock,
  getUID: () => GRID_UID,
  registerPlugin: jest.fn(),
  updateColumnHeader: jest.fn(),
  onColumnsReordered: new Slick.Event(),
  onHeaderCellRendered: new Slick.Event(),
  onHeaderMouseEnter: new Slick.Event(),
  onMouseEnter: new Slick.Event(),
} as unknown as SlickGrid;

const mockColumns = [      // The column definitions
  { id: 'firstName', name: 'First Name', field: 'firstName', width: 100 },
  { id: 'lasstName', name: 'Last Name', field: 'lasstName', width: 100 },
  {
    id: 'age', name: 'Age', field: 'age', width: 50,
    grouping: {
      getter: 'age', aggregators: [new Aggregators.Avg('age')],
      formatter: (g) => `Age: ${g.value} <span style="color:green">(${g.count} items)</span>`,
      collapsed: true
    }
  },
  {
    id: 'medals', name: 'Medals', field: 'medals', width: 50,
    grouping: {
      getter: 'medals', aggregators: [new Aggregators.Sum('medals')],
      formatter: (g) => `Medals: ${g.value} <span style="color:green">(${g.count} items)</span>`,
    }
  },
  { name: 'Gender', field: 'gender', width: 75 },
] as Column[];

describe('Draggable Grouping Plugin', () => {
  let eventPubSubService: EventPubSubService;
  let plugin: SlickDraggableGrouping;
  let sharedService: SharedService;
  let backendUtilityService: BackendUtilityService;
  let extensionUtility: ExtensionUtility;
  let translateService: TranslateServiceStub;
  let headerDiv: HTMLDivElement;
  let preHeaderDiv: HTMLDivElement;
  let dragGroupDiv: HTMLDivElement;

  beforeEach(() => {
    preHeaderDiv = document.createElement('div');
    headerDiv = document.createElement('div');
    dragGroupDiv = document.createElement('div');
    dragGroupDiv.className = 'ui-droppable ui-sortable';
    headerDiv.className = 'slick-header-column';
    preHeaderDiv.className = 'slick-preheader-panel';
    preHeaderDiv.appendChild(dragGroupDiv);
    document.body.appendChild(preHeaderDiv);

    eventPubSubService = new EventPubSubService();
    backendUtilityService = new BackendUtilityService();
    sharedService = new SharedService();
    translateService = new TranslateServiceStub();
    extensionUtility = new ExtensionUtility(sharedService, backendUtilityService, translateService);
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue(gridOptionsMock);
    jest.spyOn(SharedService.prototype, 'slickGrid', 'get').mockReturnValue(gridStub);
    jest.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
    jest.spyOn(gridStub, 'getPreHeaderPanel').mockReturnValue(preHeaderDiv);
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
    const disposeSpy = jest.spyOn(plugin, 'dispose');
    expect(plugin).toBeTruthy();

    plugin.dispose();

    expect(plugin.eventHandler).toBeTruthy();
    expect(disposeSpy).toHaveBeenCalled();
  });

  it('should use default options when instantiating the plugin without passing any arguments', () => {
    plugin.init(gridStub, addonOptions);
    expect(plugin.addonOptions).toEqual(addonOptions);
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button text when provided to the plugin', () => {
    plugin.init(gridStub, { ...addonOptions, toggleAllButtonText: 'Toggle all Groups' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel');
    const toggleAllTextElm = preHeaderElm.querySelector('.slick-group-toggle-all-text');
    expect(preHeaderElm).toBeTruthy();
    expect(toggleAllTextElm.textContent).toBe('Toggle all Groups');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button text with translated value when provided to the plugin with "toggleAllButtonTextKey"', () => {
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, toggleAllButtonTextKey: 'TOGGLE_ALL_GROUPS' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel');
    const toggleAllTextElm = preHeaderElm.querySelector('.slick-group-toggle-all-text');

    expect(preHeaderElm).toBeTruthy();
    expect(toggleAllTextElm.textContent).toBe('Basculer tous les groupes');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button tooltip with translated value when provided to the plugin with "toggleAllPlaceholderText"', () => {
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, toggleAllPlaceholderTextKey: 'TOGGLE_ALL_GROUPS' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel');
    const toggleAllTextElm = preHeaderElm.querySelector('.slick-group-toggle-all') as HTMLDivElement;

    expect(preHeaderElm).toBeTruthy();
    expect(toggleAllTextElm.title).toBe('Basculer tous les groupes');
  });

  it('should initialize the Draggable Grouping and expect optional "Toggle All" button text with translated value when provided to the plugin with "toggleAllButtonTextKey"', () => {
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, dropPlaceHolderTextKey: 'GROUP_BY' });

    const preHeaderElm = document.querySelector('.slick-preheader-panel');
    const dropboxPlaceholderElm = preHeaderElm.querySelector('.slick-draggable-dropbox-toggle-placeholder');

    expect(preHeaderElm).toBeTruthy();
    expect(dropboxPlaceholderElm.textContent).toBe('Groupé par');
  });

  it('should add an icon beside each column title when "groupIconCssClass" is provided', () => {
    jest.spyOn(SharedService.prototype, 'gridOptions', 'get').mockReturnValue({ ...gridOptionsMock, enableTranslate: true });
    translateService.use('fr');
    plugin.init(gridStub, { ...addonOptions, groupIconCssClass: 'mdi mdi-drag' });
    const eventData = { ...new Slick.EventData(), preventDefault: jest.fn() };
    gridStub.onHeaderCellRendered.notify({ column: mockColumns[2], node: headerDiv, grid: gridStub }, eventData, gridStub);
    const groupableElm = headerDiv.querySelector('.slick-column-groupable') as HTMLSpanElement;

    expect(headerDiv.style.cursor).toBe('pointer');
    expect(groupableElm.classList.contains('mdi-drag')).toBeTruthy();
  });

  describe('setupColumnReorder definition', () => {
    let dropEvent;
    let dropTargetElm: HTMLSpanElement;
    let mockHelperElm: HTMLSpanElement;
    let $headerColumnElm: any;
    let $mockDivPaneContainer1: any;
    let $mockDivPaneContainer2: any;
    const setColumnsSpy = jest.fn();
    const setColumnResizeSpy = jest.fn();
    const getColumnIndexSpy = jest.fn();
    const triggerSpy = jest.fn();
    const setGroupingSpy = jest.spyOn(dataViewStub, 'setGrouping');

    beforeEach(() => {
      mockHelperElm = document.createElement('span');
      const mockDivPaneContainerElm = document.createElement('div');
      mockDivPaneContainerElm.className = 'slick-pane-header';
      const mockDivPaneContainerElm2 = document.createElement('div');
      mockDivPaneContainerElm2.className = 'slick-pane-header';
      const mockHeaderLeftDiv1 = document.createElement('div');
      const mockHeaderLeftDiv2 = document.createElement('div');
      mockHeaderLeftDiv1.className = 'slick-header-columns slick-header-columns-left ui-sortable';
      mockHeaderLeftDiv2.className = 'slick-header-columns slick-header-columns-right ui-sortable';
      const $mockHeaderLeftDiv1 = $(mockHeaderLeftDiv1);
      const $mockHeaderLeftDiv2 = $(mockHeaderLeftDiv2);
      $mockDivPaneContainer1 = $(mockDivPaneContainerElm);
      $mockDivPaneContainer2 = $(mockDivPaneContainerElm2);
      $mockHeaderLeftDiv1.appendTo($mockDivPaneContainer1);
      $mockHeaderLeftDiv2.appendTo($mockDivPaneContainer2);

      dropTargetElm = document.createElement('div');
      dropEvent = new Event('mouseup');
      preHeaderDiv.appendChild(dropTargetElm);
      Object.defineProperty(dropEvent, 'target', { writable: true, configurable: true, value: dropTargetElm });
      const headerColumnElm = document.createElement('div');
      headerColumnElm.className = 'slick-header-column';
      headerColumnElm.id = 'slickgrid12345age';
      headerColumnElm.dataset.id = 'age';
      const columnSpanElm = document.createElement('span');
      headerColumnElm.appendChild(columnSpanElm);
      preHeaderDiv.appendChild(headerColumnElm);
      $headerColumnElm = $(headerColumnElm);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the "start" callback of the jQueryUI Sortable and expect css classes to be updated', () => {
      plugin.init(gridStub, { ...addonOptions });
      const droppableOptions = ($(plugin.dropboxElement) as any).droppable('option') as any;
      droppableOptions.drop(dropEvent, { draggable: $headerColumnElm });
      const fn = plugin.setupColumnReorder(gridStub, $mockDivPaneContainer1, {}, setColumnsSpy, setColumnResizeSpy, mockColumns, getColumnIndexSpy, GRID_UID, triggerSpy);
      let placeholderElm = preHeaderDiv.querySelector('.slick-draggable-dropbox-toggle-placeholder') as HTMLDivElement;
      let dropGroupingElm = dropTargetElm.querySelector('.slick-dropped-grouping') as HTMLDivElement;
      const startFn = fn.sortable('option', 'start');
      startFn(new Event('click'), { helper: mockHelperElm });

      expect(mockHelperElm.classList.contains('slick-header-column-active')).toBeTruthy();
      expect(placeholderElm.style.display).toBe('inline-block');
      expect(dropGroupingElm.style.display).toBe('none');

      let groupByRemoveElm = preHeaderDiv.querySelector('.slick-groupby-remove');
      const groupByRemoveImageElm = document.querySelector('.slick-groupby-remove-image');

      expect(groupByRemoveElm).toBeTruthy();
      expect(groupByRemoveImageElm).toBeTruthy();

      groupByRemoveElm.dispatchEvent(new Event('click'));

      groupByRemoveElm = preHeaderDiv.querySelector('.slick-groupby-remove');
      placeholderElm = preHeaderDiv.querySelector('.slick-draggable-dropbox-toggle-placeholder') as HTMLDivElement;
      const toggleAllElm = preHeaderDiv.querySelector('.slick-group-toggle-all') as HTMLDivElement;

      expect(setGroupingSpy).toHaveBeenCalledWith([]);
      expect(groupByRemoveElm).toBeFalsy();
      expect(placeholderElm.style.display).toBe('inline-block');
      expect(toggleAllElm.style.display).toBe('none');
    });

    it('should execute the "beforeStop" callback of the jQueryUI Sortable and expect css classes to be updated', () => {
      plugin.init(gridStub, { ...addonOptions, deleteIconCssClass: 'mdi mdi-close' });
      const droppableOptions = ($(plugin.dropboxElement) as any).droppable('option') as any;
      droppableOptions.drop(dropEvent, { draggable: $headerColumnElm });
      const fn = plugin.setupColumnReorder(gridStub, $mockDivPaneContainer1, {}, setColumnsSpy, setColumnResizeSpy, mockColumns, getColumnIndexSpy, GRID_UID, triggerSpy);
      const beforeStopFn = fn.sortable('option', 'beforeStop');
      beforeStopFn(new Event('click'), { helper: mockHelperElm });

      let placeholderElm = preHeaderDiv.querySelector('.slick-draggable-dropbox-toggle-placeholder') as HTMLDivElement;
      let dropGroupingElm = dropTargetElm.querySelector('.slick-dropped-grouping') as HTMLDivElement;
      expect(placeholderElm.style.display).toBe('none');
      expect(dropGroupingElm.style.display).toBe('inline-block');
    });

    it('should execute the "stop" callback of the jQueryUI Sortable and expect sortable to be cancelled', () => {
      plugin.init(gridStub, { ...addonOptions, deleteIconCssClass: 'mdi mdi-close' });
      const droppableOptions = ($(plugin.dropboxElement) as any).droppable('option') as any;
      droppableOptions.drop(dropEvent, { draggable: $headerColumnElm });
      jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
      const fn = plugin.setupColumnReorder(gridStub, $mockDivPaneContainer1, {}, setColumnsSpy, setColumnResizeSpy, mockColumns, getColumnIndexSpy, GRID_UID, triggerSpy);
      const stopFn = fn.sortable('option', 'stop');

      const groupByRemoveElm = document.querySelector('.slick-groupby-remove.mdi-close');
      expect(groupByRemoveElm).toBeTruthy();

      stopFn(new Event('click'), { helper: mockHelperElm });

      expect(setColumnsSpy).not.toHaveBeenCalled();
      expect(setColumnResizeSpy).not.toHaveBeenCalled();
      expect(triggerSpy).not.toHaveBeenCalled();
    });

    it('should execute the "stop" callback of the jQueryUI Sortable and expect css classes to be updated', () => {
      plugin.init(gridStub, { ...addonOptions, deleteIconCssClass: 'mdi mdi-close' });
      plugin.setColumns(mockColumns);
      const droppableOptions = ($(plugin.dropboxElement) as any).droppable('option') as any;
      droppableOptions.drop(dropEvent, { draggable: $headerColumnElm });
      jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
      getColumnIndexSpy.mockReturnValue(2);
      const fn = plugin.setupColumnReorder(gridStub, $mockDivPaneContainer1.add($mockDivPaneContainer2), {}, setColumnsSpy, setColumnResizeSpy, mockColumns, getColumnIndexSpy, GRID_UID, triggerSpy);
      const stopFn = fn.sortable('option', 'stop');

      const groupByRemoveElm = document.querySelector('.slick-groupby-remove.mdi-close');
      expect(groupByRemoveElm).toBeTruthy();

      stopFn(new Event('click'), { helper: mockHelperElm });

      expect(setColumnsSpy).toHaveBeenCalledWith([mockColumns[2], mockColumns[2]]);
      expect(setColumnResizeSpy).toHaveBeenCalled();
      expect(triggerSpy).toHaveBeenCalledWith(gridStub.onColumnsReordered, { grid: gridStub });
    });

    describe('setupColumnDropbox method', () => {
      it('should expect denied class to be removed when "deactivate" is called', () => {
        plugin.init(gridStub, { ...addonOptions });
        const deactivateFn = plugin.droppableInstance.droppable('option', 'deactivate');
        plugin.dropboxElement.classList.add('slick-header-column-denied');
        deactivateFn();

        expect(plugin.dropboxElement.classList.contains('slick-header-column-denied')).toBeFalsy();
      });

      it('should expect denied class to be added when calling "over" with a header column that does not have a "grouping" property', () => {
        const mockHeaderColumnDiv = document.createElement('div');
        mockHeaderColumnDiv.id = 'slickgrid12345firstName';
        mockHeaderColumnDiv.className = 'slick-header-column';
        const $mockHeaderColumnDiv = $(mockHeaderColumnDiv);

        plugin.init(gridStub, { ...addonOptions });
        const overFn = plugin.droppableInstance.droppable('option', 'over');
        overFn(new Event('mouseup'), { draggable: $mockHeaderColumnDiv });

        expect(plugin.dropboxElement.classList.contains('slick-header-column-denied')).toBeTruthy();
      });

      describe('setupColumnDropbox update & toggler click event', () => {
        let groupChangedSpy: any;
        const updateEvent = new Event('mouseup');
        let mockHeaderColumnDiv1: HTMLDivElement;
        let mockHeaderColumnDiv2: HTMLDivElement;

        beforeEach(() => {
          groupChangedSpy = jest.spyOn(plugin.onGroupChanged, 'notify');
          mockHeaderColumnDiv1 = document.createElement('div');
          mockHeaderColumnDiv1.className = 'slick-dropped-grouping';
          mockHeaderColumnDiv1.id = 'age';
          mockHeaderColumnDiv1.dataset.id = 'age';
          mockColumns[2].grouping.collapsed = false;

          mockHeaderColumnDiv2 = document.createElement('div');
          mockHeaderColumnDiv2.className = 'slick-dropped-grouping';
          mockHeaderColumnDiv2.id = 'medals';
          mockHeaderColumnDiv2.dataset.id = 'medals';
          dragGroupDiv.appendChild(mockHeaderColumnDiv1);
          dragGroupDiv.appendChild(mockHeaderColumnDiv2);
          $(mockHeaderColumnDiv1).appendTo($mockDivPaneContainer1);
          $(mockHeaderColumnDiv2).appendTo($mockDivPaneContainer1);

          Object.defineProperty(updateEvent, 'target', { writable: true, configurable: true, value: $mockDivPaneContainer1.get(0) });

          plugin.init(gridStub, { ...addonOptions, deleteIconCssClass: 'mdi mdi-close' });
          const droppableOptions = ($(plugin.dropboxElement) as any).droppable('option') as any;
          droppableOptions.drop(dropEvent, { draggable: $headerColumnElm });
          jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);
          const fn = plugin.setupColumnReorder(gridStub, $mockDivPaneContainer1, {}, setColumnsSpy, setColumnResizeSpy, mockColumns, getColumnIndexSpy, GRID_UID, triggerSpy);
          const updateFn = plugin.sortableInstance.sortable('option', 'update');
          updateFn(updateEvent);
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it('should call sortable "update" from setupColumnDropbox and expect "updateGroupBy" to be called with a sort-group', () => {
          expect(plugin.columnsGroupBy.length).toBeGreaterThan(0);
          expect(groupChangedSpy).toHaveBeenCalledWith({
            caller: 'sort-group',
            groupColumns: [{ aggregators: expect.toBeArray(), formatter: mockColumns[2].grouping.formatter, getter: 'age', collapsed: false, }],
          });

          jest.spyOn(gridStub, 'getHeaderColumn').mockReturnValue(mockHeaderColumnDiv1);
          plugin.setDroppedGroups('age');
        });

        it('should call "clearDroppedGroups" and expect the grouping to be cleared', () => {
          const preHeaderElm = document.querySelector('.slick-preheader-panel');
          let dropboxPlaceholderElm = preHeaderElm.querySelector('.slick-draggable-dropbox-toggle-placeholder') as HTMLDivElement;
          expect(dropboxPlaceholderElm.style.display).toBe('none');

          plugin.clearDroppedGroups();
          dropboxPlaceholderElm = preHeaderElm.querySelector('.slick-draggable-dropbox-toggle-placeholder') as HTMLDivElement;
          expect(dropboxPlaceholderElm.style.display).toBe('inline-block');
          expect(groupChangedSpy).toHaveBeenCalledWith({ caller: 'clear-all', groupColumns: [], });
        });

        it('should use the Toggle All and expect classes to be toggled and DataView to call necessary method', () => {
          const dvExpandSpy = jest.spyOn(dataViewStub, 'expandAllGroups');
          const dvCollapseSpy = jest.spyOn(dataViewStub, 'collapseAllGroups');
          let toggleAllElm = document.querySelector('.slick-group-toggle-all');
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon');
          const clickEvent = new Event('click');
          Object.defineProperty(clickEvent, 'target', { writable: true, configurable: true, value: toggleAllIconElm });

          // initially collapsed
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeFalsy();
          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();

          // collapsed after toggle
          toggleAllElm.dispatchEvent(clickEvent);
          toggleAllElm = document.querySelector('.slick-group-toggle-all');
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeTruthy();
          expect(toggleAllIconElm.classList.contains('expanded')).toBeFalsy();
          expect(dvCollapseSpy).toHaveBeenCalled();

          // expanded after toggle
          toggleAllElm.dispatchEvent(clickEvent);
          toggleAllElm = document.querySelector('.slick-group-toggle-all');
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeFalsy();
          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();
          expect(dvExpandSpy).toHaveBeenCalled();
        });

        it('should clear all grouping when that action is called from Context Menu, it must be also cleared in the Draggable Grouping preheader', () => {
          const clearGroupSpy = jest.spyOn(plugin, 'clearDroppedGroups');
          eventPubSubService.publish('onContextMenuClearGrouping');
          expect(clearGroupSpy).toHaveBeenCalled();
        });

        it('should change the toggle icon to collapsed when that action is called from the Context Menu', () => {
          eventPubSubService.publish('onContextMenuCollapseAllGroups');
          const toggleAllElm = document.querySelector('.slick-group-toggle-all');
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon');

          expect(toggleAllIconElm.classList.contains('expanded')).toBeFalsy();
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeTruthy();
        });

        it('should change the toggle icon to expanded when that action is called from the Context Menu', () => {
          eventPubSubService.publish('onContextMenuExpandAllGroups');
          const toggleAllElm = document.querySelector('.slick-group-toggle-all');
          const toggleAllIconElm = toggleAllElm.querySelector('.slick-group-toggle-all-icon');

          expect(toggleAllIconElm.classList.contains('expanded')).toBeTruthy();
          expect(toggleAllIconElm.classList.contains('collapsed')).toBeFalsy();
        });
      });
    });
  });
});
