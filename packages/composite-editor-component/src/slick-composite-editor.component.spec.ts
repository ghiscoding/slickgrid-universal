import 'jest-extended';
import {
  type Column,
  type CompositeEditorOpenDetailOption,
  type Editor,
  Editors,
  type GridOption,
  type GridService,
  type SlickDataView,
  SlickEvent,
  type SlickRowSelectionModel,
  type SlickGrid,
} from '@slickgrid-universal/common';

import { SlickCompositeEditorComponent } from './slick-composite-editor.component';
import { TranslateServiceStub } from '../../../test/translateServiceStub';
import { ContainerServiceStub } from '../../../test/containerServiceStub';

const gridOptionsMock = {
  editable: true,
  enableCellNavigation: true,
  enableCompositeEditor: true,
  compositeEditorOptions: {
    labels: {
      cancelButton: 'Cancel',
      cancelButtonKey: 'CANCEL',
      cloneButton: 'Clone',
      cloneButtonKey: 'CLONE',
      massSelectionButton: 'Update Selection',
      massSelectionButtonKey: 'APPLY_TO_SELECTION',
      massSelectionStatus: '{{x}} of {{y}} selected',
      massSelectionStatusKey: 'X_OF_Y_MASS_SELECTED',
      massUpdateButton: 'Mass Update',
      massUpdateButtonKey: 'APPLY_MASS_UPDATE',
      massUpdateStatus: 'all {{x}} items',
      massUpdateStatusKey: 'ALL_X_RECORDS_SELECTED',
      resetFormButton: 'Reset Form',
      resetFormButtonKey: 'RESET_FORM',
      saveButton: 'Save',
      saveButtonKey: 'SAVE',
    },
  },
} as GridOption;

const dataViewStub = {
  getAllSelectedIds: jest.fn(),
  getAllSelectedFilteredIds: jest.fn(),
  getAllSelectedFilteredItems: jest.fn(),
  getItem: jest.fn(),
  getItemById: jest.fn(),
  getItemCount: jest.fn(),
  getItems: jest.fn(),
  getLength: jest.fn(),
  mapIdsToRows: jest.fn(),
  mapRowsToIds: jest.fn(),
  refresh: jest.fn(),
  sort: jest.fn(),
  reSort: jest.fn(),
  setItems: jest.fn(),
  updateItem: jest.fn(),
} as unknown as SlickDataView;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
  isActive: jest.fn(),
};

const getEditControllerMock = {
  cancelCurrentEdit: jest.fn(),
  commitCurrentEdit: jest.fn(),
};

const gridServiceStub = {
  addItem: jest.fn(),
  updateItems: jest.fn(),
} as unknown as GridService;

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
  autosizeColumns: jest.fn(),
  editActiveCell: jest.fn(),
  getColumnIndex: jest.fn(),
  getActiveCell: jest.fn(),
  getCellNode: jest.fn(),
  getCellEditor: jest.fn(),
  getData: jest.fn(),
  getDataItem: jest.fn(),
  getEditController: () => getEditControllerMock,
  getSelectedRows: jest.fn(),
  getSelectionModel: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: jest.fn(),
  getUID: () => 'slickgrid_123456',
  getColumns: jest.fn(),
  getSortColumns: jest.fn(),
  invalidate: jest.fn(),
  onLocalSortChanged: jest.fn(),
  onAddNewRow: new SlickEvent(),
  onBeforeEditCell: new SlickEvent(),
  onClick: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
  render: jest.fn(),
  setActiveCell: jest.fn(),
  setSelectedRows: jest.fn(),
  setActiveRow: jest.fn(),
  setSortColumns: jest.fn(),
} as unknown as SlickGrid;

const rowSelectionModelStub = {
  pluginName: 'RowSelectionModel',
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
  getSelectedRanges: jest.fn(),
  setSelectedRanges: jest.fn(),
  getSelectedRows: jest.fn(),
  setSelectedRows: jest.fn(),
  onSelectedRangesChanged: new SlickEvent(),
} as unknown as SlickRowSelectionModel;

function createNewColumDefinitions(count: number) {
  const columnsMock: Column[] = [];
  for (let i = 0; i < count; i++) {
    columnsMock.push({ id: `field${i}`, field: `field${i}`, name: `Field ${i}`, editorClass: Editors.text, editor: { model: Editors.text, massUpdate: true }, width: 75 });
  }
  return columnsMock;
}

describe('CompositeEditorService', () => {
  let container: ContainerServiceStub;
  let component: SlickCompositeEditorComponent;
  let div: HTMLDivElement;
  let translateService: TranslateServiceStub;
  const columnsMock: Column[] = [
    { id: 'productName', field: 'productName', width: 100, name: 'Product', nameKey: 'PRODUCT', editorClass: Editors.text, editor: { model: Editors.text } },
    { id: 'field2', field: 'field2', width: 75, name: 'Field 2' },
    { id: 'field3', field: 'field3', width: 75, name: 'Field 3', nameKey: 'DURATION', editorClass: Editors.date, editor: { model: Editors.date, massUpdate: true }, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' },
    { id: 'zip', field: 'adress.zip', width: 75, name: 'Zip', editorClass: Editors.integer, editor: { model: Editors.integer, massUpdate: true }, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' }
  ];

  beforeEach(() => {
    container = new ContainerServiceStub();
    container.registerInstance('GridService', gridServiceStub);
    div = document.createElement('div');
    document.body.appendChild(div);
    Object.defineProperty(document.body, 'innerHeight', { writable: true, configurable: true, value: 1080 });
    Object.defineProperty(document.body, 'innerWidth', { writable: true, configurable: true, value: 1920 });
    Object.defineProperty(document.body, 'clientHeight', { writable: true, configurable: true, value: 1080 });
    Object.defineProperty(document.body, 'clientWidth', { writable: true, configurable: true, value: 1920 });
    window.dispatchEvent(new Event('resize'));
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
      jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 0, cell: 0 });
      jest.spyOn(gridStub, 'getCellNode').mockReturnValue(document.createElement('div'));
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
      jest.spyOn(gridStub, 'getData').mockReturnValue(dataViewStub);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);
      jest.spyOn(dataViewStub, 'getLength').mockReturnValue(50);
    });

    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      jest.clearAllMocks();
      component?.dispose();
      gridOptionsMock.enableCellNavigation = true;
    });

    it('should throw an error when trying to call "init()" method without finding GridService from the ContainerService', (done) => {
      try {
        container.registerInstance('GridService', null);
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
      } catch (e) {
        expect(e.toString()).toContain('[Slickgrid-Universal] it seems that the GridService is not being loaded properly, make sure the Container Service is properly implemented.');
        done();
      }
    });

    it('should throw an error when "enableTranslateLabel" is set without a valid Translater Service', (done) => {
      try {
        const newGridOptions = { ...gridOptionsMock, enableTranslate: true };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

        translateService = undefined as any;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.`);
        done();
      }
    });

    it('should throw an error when the Grid Option flag "enableAddRow" is not enabled', (done) => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const newGridOptions = { ...gridOptionsMock, enableAddRow: false };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);

      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'create', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: 'ENABLE_ADD_ROW_REQUIRED', message: 'Composite Editor requires the flag "enableAddRow" to be set to True in your Grid Options when cloning/creating a new item.', });
        done();
      });
    });

    it('should throw an error when trying to edit a row that does not return any data context', (done) => {
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(null);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);

      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'edit', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'warning', code: 'ROW_NOT_EDITABLE', message: 'Current row is not editable.', });
        done();
      });
    });

    it('should throw an error when the Grid Option flag "enableCellNavigation" is not enabled', (done) => {
      const newGridOptions = { ...gridOptionsMock, enableCellNavigation: false };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);

      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: 'ENABLE_CELL_NAVIGATION_REQUIRED', message: 'Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.' });
        done();
      });
    });

    it('should show an error in console log when using default onError and the Grid Option flag "enableCellNavigation" is not enabled', (done) => {
      const consoleSpy = jest.spyOn(global.console, 'log').mockReturnValue();
      const newGridOptions = { ...gridOptionsMock, enableCellNavigation: false };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);

      const mockModalOptions = { headerTitle: 'Details' } as CompositeEditorOpenDetailOption;

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(consoleSpy).toHaveBeenCalledWith('Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.');
        done();
      });
    });

    it('should throw an error when there are no rows or active cell selected', (done) => {
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(null as any);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'warning', code: 'NO_RECORD_FOUND', message: 'No records selected for edit or clone operation.' });
        done();
      });
    });

    it('should throw an error when grid is not editable (readonly)', (done) => {
      const newGridOptions = { ...gridOptionsMock, editable: false };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: 'EDITABLE_GRID_REQUIRED', message: 'Your grid must be editable in order to use the Composite Editor Modal.', });
        done();
      });
    });

    it('should throw an error when there are no Editors found in the column definitions', (done) => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'field1', field: 'field1', width: 100, nameKey: 'FIELD_1' },
        { id: 'field2', field: 'field2', width: 75 }
      ]);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: 'NO_EDITOR_FOUND', message: 'We could not find any Editor in your Column Definition' });
        done();
      });
    });

    it('should not create neither render the component when isActive() returns True & commitCurrentEdit() returns false', () => {
      jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
      jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeFalsy();
    });

    it('should make sure Slick-Composite-Editor is being created and rendered with 1 column layout & also expect column name html to be rendered as well', () => {
      columnsMock[2].name = '<span class="mdi mdi-alert-circle" title="tooltip text"></span> Field 3'; // add tooltip
      const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeHeaderElm = compositeContainerElm.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(productNameLabelElm.textContent).toBe('Product'); // regular, without column group
      expect(field3LabelElm.innerHTML).toBe('Group Name - <span class="mdi mdi-alert-circle" title="tooltip text"></span> Field 3'); // with column group
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(compositeBodyElm).toBeTruthy();
      expect(compositeFooterElm).toBeTruthy();
      expect(compositeFooterCancelBtnElm).toBeTruthy();
      expect(compositeFooterSaveBtnElm).toBeTruthy();
      expect(productNameDetailContainerElm).toBeTruthy();

      // reset Field 3 column name
      columnsMock[2].name = 'Field 3';
    });

    it('should make sure Slick-Composite-Editor is being created and expect form inputs to be in specific order when user provides column def "compositeEditorFormOrder"', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
      const sortedColumnsMock = [
        { id: 'age', field: 'age', width: 100, name: 'Age', editorClass: Editors.float, editor: { model: Editors.float, compositeEditorFormOrder: 2, } },
        { id: 'middleName', field: 'middleName', width: 100, name: 'Middle Name', editorClass: Editors.text, editor: { model: Editors.text } },
        { id: 'lastName', field: 'lastName', width: 100, name: 'Last Name', editorClass: Editors.text, editor: { model: Editors.text, compositeEditorFormOrder: 1, } },
        { id: 'firstName', field: 'firstName', width: 100, name: 'First Name', editorClass: Editors.text, editor: { model: Editors.text, compositeEditorFormOrder: 0, } },
      ] as Column[];
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(sortedColumnsMock);
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeHeaderElm = compositeContainerElm.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const itemDetailsContainerElm = compositeBodyElm.querySelectorAll<HTMLSelectElement>('.item-details-container');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(compositeBodyElm).toBeTruthy();

      // it shouldn't have the order it was added in the column definitions array
      expect(itemDetailsContainerElm[0].classList.contains('editor-age')).toBeFalse();
      expect(itemDetailsContainerElm[1].classList.contains('editor-middleName')).toBeFalse();
      expect(itemDetailsContainerElm[2].classList.contains('editor-lastName')).toBeFalse();
      expect(itemDetailsContainerElm[3].classList.contains('editor-firstName')).toBeFalse();

      // but it should have the order it was defined by `compositeEditorFormOrder` sort order
      expect(itemDetailsContainerElm[0].classList.contains('editor-firstName')).toBeTrue();
      expect(itemDetailsContainerElm[1].classList.contains('editor-lastName')).toBeTrue();
      expect(itemDetailsContainerElm[2].classList.contains('editor-age')).toBeTrue();
      expect(itemDetailsContainerElm[3].classList.contains('editor-middleName')).toBeTrue();
    });

    it('should make sure Slick-Composite-Editor is being created and rendered with 2 columns layout when having more than 8 but less than 15 column definitions', () => {
      const copyColumnsMock: Column[] = createNewColumDefinitions(8);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(copyColumnsMock);
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeContentElm = compositeContainerElm.querySelector('.slick-editor-modal-content.split-view') as HTMLSelectElement;
      const compositeHeaderElm = compositeContainerElm.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field1DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field1.slick-col-medium-6') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeContentElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(compositeBodyElm).toBeTruthy();
      expect(compositeFooterElm).toBeTruthy();
      expect(field1DetailContainerElm).toBeTruthy();
    });

    it('should make sure Slick-Composite-Editor is being created and rendered with 3 columns layout when having more than 15 column definitions', () => {
      const copyColumnsMock: Column[] = createNewColumDefinitions(15);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(copyColumnsMock);
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details', viewColumnLayout: 'auto' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeContentElm = compositeContainerElm.querySelector('.slick-editor-modal-content.triple-split-view') as HTMLSelectElement;
      const compositeHeaderElm = compositeContainerElm.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field1DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field1.slick-col-medium-6') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeContentElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(compositeBodyElm).toBeTruthy();
      expect(compositeFooterElm).toBeTruthy();
      expect(field1DetailContainerElm).toBeTruthy();
    });

    it('should add Dark Mode CSS classes to the modal when option is enabled in grid options', () => {
      const newGridOptions = { ...gridOptionsMock, darkMode: true } as GridOption;
      const copyColumnsMock: Column[] = createNewColumDefinitions(15);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(copyColumnsMock);
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details', viewColumnLayout: 'auto' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeContentElm = compositeContainerElm.querySelector('.slick-editor-modal-content') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeContentElm.classList.contains('slick-dark-mode')).toBeTruthy();
    });

    it('should activate next available cell with an Editor when current active cell does not have an Editor', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 4, cell: 1 }); // column index 1 has no Editor
      const setActiveSpy = jest.spyOn(gridStub, 'setActiveCell');

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });
      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

      expect(setActiveSpy).toHaveBeenCalledTimes(2);
      expect(setActiveSpy).toHaveBeenCalledWith(4, 0, false);
      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
    });

    it('should be able to dispose the component', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });
      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();

      component.dispose();

      const compositeContainerElm2 = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      expect(compositeContainerElm2).toBeFalsy();
    });

    it('should dispose the component when clicking in the backdrop outside the modal window when using the options "backdrop: null"', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details', backdrop: null });
      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      compositeContainerElm.click();

      const compositeContainerElm2 = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      expect(compositeContainerElm2).toBeFalsy();
    });

    it('should execute "onBeforeOpen" callback before opening the composite modal window', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      const mockOnBeforeCallback = jest.fn();

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details', onBeforeOpen: mockOnBeforeCallback });
      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

      expect(mockOnBeforeCallback).toHaveBeenCalled();
      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
    });

    it('should execute "onRendered" callback after creating & rendering the composite modal window', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      const mockOnRenderedCallback = jest.fn();

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details', onRendered: mockOnRenderedCallback });
      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

      expect(mockOnRenderedCallback).toHaveBeenCalledWith(expect.any(HTMLDivElement));
      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
    });

    it('should execute "onClose" callback when user confirms the closing of the modal when "onClose" callback is defined', (done) => {
      const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55, field2: 'Test' };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');

      const mockOnClose = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'edit', onClose: mockOnClose } as CompositeEditorOpenDetailOption;
      const spyOnClose = jest.spyOn(mockModalOptions, 'onClose').mockReturnValue(Promise.resolve(true));
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);
      component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed
      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: { productName: 'test' }, editors: {}, grid: gridStub });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
      const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
      const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
      compositeFooterCancelBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(productNameLabelElm.textContent).toBe('Product');
        expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
        expect(compositeFooterCancelBtnElm).toBeTruthy();
        expect(spyOnClose).toHaveBeenCalled();
        expect(getEditSpy).toHaveBeenCalledTimes(2);
        expect(cancelSpy).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should NOT execute "onClose" callback when user confirms the closing of the modal when "onClose" callback is defined', (done) => {
      const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      const cancelSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');

      const mockOnClose = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'edit', onClose: mockOnClose } as CompositeEditorOpenDetailOption;
      const spyOnClose = jest.spyOn(mockModalOptions, 'onClose').mockReturnValue(Promise.resolve(false));
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);
      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: { fieldX: 'test' }, editors: {}, grid: gridStub });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
      const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
      const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
      compositeFooterCancelBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.eventHandler).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(productNameLabelElm.textContent).toBe('Product');
        expect(productNameDetailCellElm.classList.contains('modified')).toBe(false); // false since formValues: fieldX doesn't exist
        expect(compositeFooterCancelBtnElm).toBeTruthy();
        expect(spyOnClose).toHaveBeenCalled();
        expect(cancelSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should pass a Header Title that has to be parsed from the dataContext object', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Editing ({{id}}) - {{product.name}}' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeTitleElm = compositeContainerElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();

      component.dispose();

      const compositeContainerElm2 = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      expect(compositeContainerElm2).toBeFalsy();
      expect(compositeTitleElm.textContent).toBe('Editing (222) - Product ABC');
    });

    it('should execute "cancelCurrentEdit" when the "Esc" key is typed', () => {
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      compositeContainerElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
        code: 'Escape',
        bubbles: true
      }));

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(getEditSpy).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should execute "validate" on current Editor when the "Tab" key is typed', () => {
      const currentEditorMock = { validate: jest.fn() };
      const getEditCellSpy = jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      const validateSpy = jest.spyOn(currentEditorMock, 'validate');

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      compositeContainerElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
        code: 'Tab',
        bubbles: true
      }));

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(getEditCellSpy).toHaveBeenCalled();
      expect(validateSpy).toHaveBeenCalled();
    });

    it('should execute "cancelCurrentEdit" when the "Cancel" button is clicked', () => {
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeContainerElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeFooterCloseBtnElm = compositeContainerElm.querySelector('.close') as HTMLSelectElement;
      compositeFooterCancelBtnElm.click();

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeFooterCancelBtnElm).toBeTruthy();
      expect(compositeFooterCancelBtnElm.ariaLabel).toBe('Cancel');
      expect(compositeFooterCloseBtnElm.ariaLabel).toBe('Close');
      expect(getEditSpy).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should execute "cancelCurrentEdit" when the "Close" button is clicked even with option "showCloseButtonOutside" is enabled', () => {
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const closeSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Some Details', showCloseButtonOutside: true });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterCloseBtnElm = compositeContainerElm.querySelector('.close') as HTMLSelectElement;
      compositeFooterCloseBtnElm.click();

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeFooterCloseBtnElm).toBeTruthy();
      expect(getEditSpy).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('should execute "commitCurrentEdit" when the "Save" button is clicked', () => {
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const saveSpy = jest.spyOn(gridStub.getEditController() as any, 'commitCurrentEdit');

      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
      compositeFooterSaveBtnElm.click();

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeFooterSaveBtnElm).toBeTruthy();
      expect(getEditSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    describe('clone modal type', () => {
      beforeEach(() => {
        jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([]);
        jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([]);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should add a new cloned item in the grid and leave the selected row be to cloned untouched when the "Clone" button is clicked', () => {
        const mockProduct1 = { id: 222, productName: 'Product 1', address: { zip: 123456 }, price: 12.55 };
        const mockProduct2 = { id: 333, productName: 'Product 2', address: { zip: 456789 }, price: 33.44 };
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const currentEditorMock = { validate: jest.fn() };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct2);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(null);
        jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
        jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');

        const mockOnClose = jest.fn();
        const mockModalOptions = { headerTitle: 'Details', modalType: 'clone', insertNewId: 3, onClose: mockOnClose } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed
        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'Product Cloned' }, editors: {}, grid: gridStub });
        const disposeSpy = jest.spyOn(component, 'dispose');

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        compositeFooterSaveBtnElm.click();

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeFooterCancelBtnElm.ariaLabel).toBe('Cancel');
        expect(compositeFooterSaveBtnElm.ariaLabel).toBe('Clone');
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(productNameLabelElm.textContent).toBe('Product');
        expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
        expect(compositeFooterCancelBtnElm).toBeTruthy();
        expect(gridSrvAddItemSpy).toHaveBeenCalledWith({ ...mockProduct2, id: 3, productName: 'Product Cloned' }, undefined);
        expect(disposeSpy).toHaveBeenCalled();
      });

      it('should throw an error when trying to clone an item with an Id that already exist in the grid', () => {
        const mockProduct1 = { id: 222, productName: 'Product 1', address: { zip: 123456 }, price: 12.55 };
        const mockProduct2 = { id: 333, productName: 'Product 2', address: { zip: 456789 }, price: 33.44 };
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const currentEditorMock = { validate: jest.fn() };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct2);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct1); // find existing item
        jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
        jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');

        const mockOnClose = jest.fn();
        const mockOnError = jest.fn();
        const mockModalOptions = { headerTitle: 'Details', modalType: 'clone', insertNewId: 222, onClose: mockOnClose, onError: mockOnError } as CompositeEditorOpenDetailOption;
        const spyOnError = jest.spyOn(mockModalOptions, 'onError');
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed
        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'Product Cloned' }, editors: {}, grid: gridStub });
        const disposeSpy = jest.spyOn(component, 'dispose');

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        compositeFooterSaveBtnElm.click();

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(productNameLabelElm.textContent).toBe('Product');
        expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
        expect(compositeFooterCancelBtnElm).toBeTruthy();
        expect(gridSrvAddItemSpy).not.toHaveBeenCalled();
        expect(disposeSpy).toHaveBeenCalled();
        expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: 'ITEM_ALREADY_EXIST', message: 'The item object which you are trying to add already exist with the same Id:: 222' });
      });

      it('should handle saving and grid changes when "Clone" save button is clicked and user provides a custom "onSave" async function', (done) => {
        const mockProduct1 = { id: 222, productName: 'Product 1', address: { zip: 123456 }, price: 12.55 };
        const mockProduct2 = { id: 333, productName: 'Product 2', address: { zip: 456789 }, price: 33.44 };
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const currentEditorMock = { validate: jest.fn() };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct2);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(null);
        jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
        jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
        const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');

        const mockOnSave = jest.fn();
        mockOnSave.mockResolvedValue(Promise.resolve(true));
        const mockModalOptions = { headerTitle: 'Details', modalType: 'clone', insertNewId: 3, onSave: mockOnSave } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed
        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'Product Cloned' }, editors: {}, grid: gridStub });
        const disposeSpy = jest.spyOn(component, 'dispose');

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

        compositeFooterSaveBtnElm.click();
        expect(compositeFooterSaveBtnElm.disabled).toBeTruthy();
        expect(compositeFooterSaveBtnElm.classList.contains('saving')).toBeTruthy();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(productNameLabelElm.textContent).toBe('Product');
          expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
          expect(compositeFooterCancelBtnElm).toBeTruthy();
          expect(gridSrvAddItemSpy).toHaveBeenCalledWith({ ...mockProduct2, id: 3, productName: 'Product Cloned' }, undefined);
          expect(disposeSpy).toHaveBeenCalled();
          expect(validationSummaryElm.style.display).toBe('none');
          expect(validationSummaryElm.textContent).toBe('');
          expect(cancelCommitSpy).toHaveBeenCalled();
          expect(mockOnSave).toHaveBeenCalledWith({ productName: 'Product Cloned' }, { gridRowIndexes: [], dataContextIds: [] }, { ...mockProduct2, id: 3, productName: 'Product Cloned' });
          done();
        });
      });

      it('should show a validation summary when clicking "Clone" save button and the custom "onSave" async function throws an error', (done) => {
        const mockProduct1 = { id: 222, productName: 'Product 1', address: { zip: 123456 }, price: 12.55 };
        const mockProduct2 = { id: 333, productName: 'Product 2', address: { zip: 456789 }, price: 33.44 };
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const currentEditorMock = { validate: jest.fn() };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct2);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(null);
        jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
        jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
        const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');

        const mockOnSave = jest.fn();
        mockOnSave.mockResolvedValue(Promise.reject(new Error('some error')));
        const mockModalOptions = { headerTitle: 'Details', modalType: 'clone', insertNewId: 3, onSave: mockOnSave } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed
        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'Product Cloned' }, editors: {}, grid: gridStub });
        const disposeSpy = jest.spyOn(component, 'dispose');

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

        compositeFooterSaveBtnElm.click();
        expect(compositeFooterSaveBtnElm.disabled).toBeTruthy();
        expect(compositeFooterSaveBtnElm.classList.contains('saving')).toBeTruthy();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(productNameLabelElm.textContent).toBe('Product');
          expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
          expect(compositeFooterCancelBtnElm).toBeTruthy();
          expect(gridSrvAddItemSpy).not.toHaveBeenCalled();
          expect(disposeSpy).not.toHaveBeenCalled();
          expect(validationSummaryElm.style.display).toBe('block');
          expect(validationSummaryElm.textContent).toBe('some error');
          expect(cancelCommitSpy).not.toHaveBeenCalled();
          done();
        });
      });
    });

    describe('create item', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should execute "onAddNewRow" callback when triggered by a new item', (done) => {
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        const mockProduct2 = { address: { zip: 345678 }, product: { name: 'Product DEF', price: 22.33 } };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(dataViewStub, 'getItemCount').mockReturnValue(1);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');
        (getEditControllerMock as any).commitCurrentEdit = () => {
          gridStub.onAddNewRow.notify({ grid: gridStub, item: mockProduct2, column: columnsMock[0] });
          return true;
        };

        const mockModalOptions = { headerTitle: 'Details', modalType: 'create' } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'test' }, editors: {}, grid: gridStub });

        compositeFooterSaveBtnElm.click();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(productNameLabelElm.textContent).toBe('Product');
          expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
          expect(gridSrvAddItemSpy).toHaveBeenCalledWith({ ...mockProduct2, id: 2 }, undefined);
          done();
        });
      });

      it('should expect the first element to be reset when "showResetButtonOnEachEditor" is enabled and first input reset button is clicked', () => {
        const mockReset1 = jest.fn();
        const mockReset2 = jest.fn();
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55, field3: 'foo' };
        const mockProduct2 = { address: { zip: 345678 }, product: { name: 'Product DEF', price: 22.33 }, field3: 'foo' };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);

        const mockModalOptions = {
          headerTitle: 'Details', modalType: 'create', showResetButtonOnEachEditor: true, resetEditorButtonCssClass: 'mdi mdi-refresh'
        } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = {
          productName: { setValue: jest.fn(), reset: mockReset1, isValueTouched: () => true } as unknown as Editor,
          field3: { setValue: jest.fn(), reset: mockReset2, isValueTouched: () => true } as unknown as Editor,
        }; // return True for value changed

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const input1ResetButtonElm = compositeContainerElm.querySelectorAll<HTMLButtonElement>('button.btn-editor-reset')[0];
        const input2ResetButtonElm = compositeContainerElm.querySelectorAll<HTMLButtonElement>('button.btn-editor-reset')[1];
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'test', field3: 'test2' }, editors: {}, grid: gridStub });

        expect(component).toBeTruthy();
        expect(input1ResetButtonElm).toBeTruthy();
        expect(input2ResetButtonElm).toBeTruthy();
        expect(input1ResetButtonElm.ariaLabel).toBe('Reset');
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(productNameLabelElm.textContent).toBe('Product');
        expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
        expect(component.formValues).toEqual({ productName: 'test', field3: 'test2' });

        input1ResetButtonElm.click();

        expect(mockReset1).toHaveBeenCalled();
        expect(mockReset2).not.toHaveBeenCalled();
        expect(component.formValues).toEqual({ field3: 'test2' });
      });

      it('should expect the form to be reset when "showFormResetButton" is enabled and button is clicked', () => {
        const mockReset1 = jest.fn();
        const mockReset2 = jest.fn();
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55, field3: 'foo' };
        const mockProduct2 = { address: { zip: 345678 }, product: { name: 'Product DEF', price: 22.33 }, field3: 'foo' };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);

        const mockModalOptions = { headerTitle: 'Details', modalType: 'create', showFormResetButton: true } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = {
          productName: { setValue: jest.fn(), reset: mockReset1, isValueTouched: () => true } as unknown as Editor,
          field3: { setValue: jest.fn(), reset: mockReset2, isValueTouched: () => true } as unknown as Editor,
        }; // return True for value changed

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const formResetButtonElm = compositeContainerElm.querySelector('.reset-container button') as HTMLButtonElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { productName: 'test', field3: 'test2' }, editors: {}, grid: gridStub });

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(productNameLabelElm.textContent).toBe('Product');
        expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
        expect(component.formValues).toEqual({ productName: 'test', field3: 'test2' });

        formResetButtonElm.click();

        expect(mockReset1).toHaveBeenCalled();
        expect(mockReset2).toHaveBeenCalled();
        expect(component.formValues).toEqual({});
      });

      it('should handle Create saving and grid changes when save button is clicked and user provides a custom "onSave" async function and datacontext is was triggered by onAddNewRow', (done) => {
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        const mockNewProduct2 = { address: { zip: 345678 }, product: { name: 'Product DEF', price: 22.33 } };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockNewProduct2);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');
        (getEditControllerMock as any).commitCurrentEdit = () => {
          gridStub.onAddNewRow.notify({ grid: gridStub, item: mockNewProduct2, column: columnsMock[0] });
          return true;
        };
        const mockCreateOnSave = jest.fn();
        mockCreateOnSave.mockResolvedValue(Promise.resolve(true));

        const mockModalOptions = { headerTitle: 'Details', modalType: 'create', insertNewId: 3, onSave: mockCreateOnSave } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockNewProduct2, formValues: { productName: 'test' }, editors: {}, grid: gridStub });

        compositeFooterSaveBtnElm.click();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(productNameLabelElm.textContent).toBe('Product');
          expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
          expect(gridSrvAddItemSpy).toHaveBeenCalledWith({ ...mockNewProduct2, id: 3 }, undefined);
          expect(mockCreateOnSave).toHaveBeenCalledWith({ productName: 'test' }, { gridRowIndexes: [], dataContextIds: [] }, { ...mockNewProduct2, id: 3 });
          done();
        });
      });
    });

    describe('edit item', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should handle Edit saving and grid changes when save button is clicked and user provides a custom "onSave" async function', (done) => {
        const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
        const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        const mockNewProduct2 = { address: { zip: 345678 }, product: { name: 'Product DEF', price: 22.33 } };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockNewProduct2);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
        (getEditControllerMock as any).commitCurrentEdit = () => {
          gridStub.onAddNewRow.notify({ grid: gridStub, item: mockNewProduct2, column: columnsMock[0] });
          return true;
        };
        const mockEditOnSave = jest.fn();
        mockEditOnSave.mockResolvedValue(Promise.resolve(true));

        const mockModalOptions = { headerTitle: 'Details', modalType: 'edit', insertNewId: 3, onSave: mockEditOnSave } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        component.editors = { productName: { setValue: jest.fn(), isValueChanged: () => true } as unknown as Editor }; // return True for value changed

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const productNameDetailCellElm = productNameDetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockNewProduct2, formValues: { productName: 'test' }, editors: {}, grid: gridStub });

        compositeFooterSaveBtnElm.click();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(productNameLabelElm.textContent).toBe('Product');
          expect(productNameDetailCellElm.classList.contains('modified')).toBe(true);
          expect(mockEditOnSave).toHaveBeenCalledWith({ productName: 'test' }, { gridRowIndexes: [], dataContextIds: [] }, { ...mockNewProduct2, id: 3 });
          done();
        });
      });
    });

    describe('Form Logics', () => {
      beforeEach(() => {
        // reset Field 3 column name
        columnsMock[2].name = 'Field 3';
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" to change dynamically any of the form input value', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const setValueSpy = jest.spyOn(mockEditor, 'setValue');

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
        const field3DetailCellElm = field3DetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;

        component.editors = { field3: mockEditor };
        component.changeFormValue('field3', 'value before');
        component.changeFormInputValue('field3', 'Field 3 different text');

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(productNameLabelElm.textContent).toBe('Product'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(productNameDetailContainerElm).toBeTruthy();
        expect(field3DetailCellElm.classList.contains('modified')).toBe(true);
        expect(component.formValues).toEqual({ field3: 'Field 3 different text' });
        expect(setValueSpy).toHaveBeenCalledWith('Field 3 different text', true, true);
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" and call setValue without triggering event when 4th argument is False', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const setValueSpy = jest.spyOn(mockEditor, 'setValue');

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        component.editors = { zip: mockEditor };
        const zipCol = columnsMock.find(col => col.id === 'zip') as Column;
        component.changeFormValue(zipCol, 123456);
        component.changeFormInputValue(zipCol, 123456, true, false);

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(component.formValues).toEqual({ adress: { zip: 123456 } });
        expect(setValueSpy).toHaveBeenCalledWith(123456, true, false);
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" on a disabled field and expect the field to be modified but empty', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        mockEditor.disabled = true;
        const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
        const field3DetailCellElm = field3DetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;

        component.editors = { field3: mockEditor };
        component.changeFormInputValue('field3', 'Field 3 different text');

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(productNameLabelElm.textContent).toBe('Product'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(productNameDetailContainerElm).toBeTruthy();
        expect(field3DetailCellElm.classList.contains('modified')).toBe(true);
        expect(component.formValues).toEqual({ field3: '' });
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" on a disabled field and expect the field to be empty and not modified when "excludeDisabledFieldFormValues" grid option is set to True', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        mockEditor.disabled = true;
        const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        gridOptionsMock.compositeEditorOptions!.excludeDisabledFieldFormValues = true;

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
        const field3DetailCellElm = field3DetailContainerElm.querySelector('.slick-cell') as HTMLSelectElement;

        component.editors = { field3: mockEditor };
        component.changeFormInputValue('field3', 'Field 3 different text');

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(productNameLabelElm.textContent).toBe('Product'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(productNameDetailContainerElm).toBeTruthy();
        expect(field3DetailCellElm.classList.contains('modified')).toBe(false);
        expect(component.formValues).toEqual({ field3: '' });
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" on an invalid Editor of the Form would thrown an error', (done) => {
        const mockEditor = {
          changeEditorOption: jest.fn(),
          disable: jest.fn(),
          setValue: jest.fn(),
        } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.editors = { field3: mockEditor };
        component.openDetails({ headerTitle: 'Details' });

        try {
          component.changeFormInputValue('field4', 'Field 4 different text');
        } catch (e) {
          expect(e.toString()).toContain(`Composite Editor with column id "field4" not found`);
          done();
        }
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" on an invalid Editor BUT not throw an error when user want to skip the error', () => {
        const mockEditor = {
          changeEditorOption: jest.fn(),
          disable: jest.fn(),
          setValue: jest.fn(),
        } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const setValueSpy = jest.spyOn(mockEditor, 'setValue');

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.editors = { field3: mockEditor };
        component.openDetails({ headerTitle: 'Details' });
        component.changeFormInputValue('field4', 'Field 4 different text', true);

        expect(component.formValues).toEqual({ field4: 'Field 4 different text' });
        expect(setValueSpy).not.toHaveBeenCalled();
      });

      it('should make sure Slick-Composite-Editor is being created and then call "disableFormInput" to disable the field', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const disableSpy = jest.spyOn(mockEditor, 'disable');

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;

        component.editors = { field3: mockEditor };
        component.disableFormInput('field3');

        expect(component).toBeTruthy();
        expect(component.editors).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(productNameLabelElm.textContent).toBe('Product'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(productNameDetailContainerElm).toBeTruthy();
        expect(disableSpy).toHaveBeenCalledWith(true);
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormEditorOption" on a Editor of the Form and expect it to call the Editor "changeEditorOption" method', () => {
        const mockEditor = {
          changeEditorOption: jest.fn(),
          disable: jest.fn(),
          setValue: jest.fn(),
        } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, producName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;

        component.editors = { field3: mockEditor };
        component.changeFormEditorOption('field3', 'minDate', 'today');

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();

        expect(productNameDetailContainerElm).toBeTruthy();
        expect(field3DetailContainerElm).toBeTruthy();
        expect(mockEditor.changeEditorOption).toHaveBeenCalledWith('minDate', 'today');
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormEditorOption" on an invalid Editor of the Form would thrown an error', (done) => {
        const mockEditor = {
          changeEditorOption: jest.fn(),
          disable: jest.fn(),
          setValue: jest.fn(),
        } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.editors = { field3: mockEditor };
        component.openDetails({ headerTitle: 'Details' });

        try {
          component.changeFormEditorOption('field4', 'minDate', 'today');
        } catch (e) {
          expect(e.toString()).toContain(`Editor with column id "field4" not found OR the Editor does not support "changeEditorOption"`);
          done();
        }
      });

      it('should make sure Slick-Composite-Editor is being created and then call "disableFormInput" by passing False as 2nd argument to enable the field', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const disableSpy = jest.spyOn(mockEditor, 'disable');

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeBodyElm = compositeContainerElm.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;

        component.editors = { field3: mockEditor };
        component.disableFormInput('field3', false);

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(productNameLabelElm.textContent).toBe('Product'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(productNameDetailContainerElm).toBeTruthy();
        expect(disableSpy).toHaveBeenCalledWith(false);
      });
    });

    describe('with Row Selections and Mass Selection Change', () => {
      beforeEach(() => {
        const newGridOptions = { ...gridOptionsMock, enableRowSelection: true, };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
        jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue(rowSelectionModelStub);
      });

      afterEach(() => {
        component?.dispose();
      });

      it('should throw an error when trying to edit a row that does not return any data context', (done) => {
        jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([]);

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);

        const mockOnError = jest.fn();
        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection', onError: mockOnError } as CompositeEditorOpenDetailOption;
        const spyOnError = jest.spyOn(mockModalOptions, 'onError');

        setTimeout(() => {
          component.openDetails(mockModalOptions);
          expect(spyOnError).toHaveBeenCalledWith({ type: 'warning', code: 'ROW_SELECTION_REQUIRED', message: 'You must select some rows before trying to apply new value(s).' });
          done();
        });
      });

      it('should expect that any error that are not defined as the built-in errors to still be caught then sent to the "onError"', (done) => {
        (gridStub.getColumns as jest.Mock).mockImplementation(() => { throw new Error('some error'); });
        const mockOnError = jest.fn();

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection', onError: mockOnError } as CompositeEditorOpenDetailOption;
        const spyOnError = jest.spyOn(mockModalOptions, 'onError');

        setTimeout(() => {
          component.openDetails(mockModalOptions);
          expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: `some error`, message: `some error` });
          done();
        });
      });

      it('should expect to have a header title & modal type representing "mass-update" when using "auto-mass" type and there are not row selected', () => {
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: '', modalType: 'auto-mass', headerTitleMassUpdate: 'Mass Update', headerTitleMassSelection: 'Mass Selection' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeHeaderElm = compositeContainerElm.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;

        expect(component).toBeTruthy();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Mass Update');
        expect(compositeFooterSaveBtnElm.textContent).toBe('Mass Update');
        expect(compositeFooterSaveBtnElm.ariaLabel).toBe('Mass Update');
      });

      it('should expect to have a header title & modal type representing "mass-selection" when using "auto-mass" type and having some row(s) selected', () => {
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([222]);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct]);

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: '', modalType: 'auto-mass', headerTitleMassUpdate: 'Mass Update', headerTitleMassSelection: 'Mass Selection' });

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeHeaderElm = compositeContainerElm.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;

        expect(component).toBeTruthy();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Mass Selection');
        expect(compositeFooterSaveBtnElm.textContent).toBe('Update Selection');
        expect(compositeFooterSaveBtnElm.ariaLabel).toBe('Update Selection');
      });

      it('should activate next available cell with an Editor when current active cell does not have an Editor', () => {
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        columnsMock[2].editor = { massUpdate: true };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 4, cell: 1 }); // column index 1 has no Editor
        const setActiveSpy = jest.spyOn(gridStub, 'setActiveCell');

        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails({ headerTitle: '', modalType: 'auto-mass', headerTitleMassUpdate: 'Mass Update', headerTitleMassSelection: 'Mass Selection' });
        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;

        expect(setActiveSpy).toHaveBeenCalledTimes(2);
        expect(setActiveSpy).toHaveBeenCalledWith(4, 2, false);
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
      });

      it('should throw an error when no rows are selected', (done) => {
        const mockProduct = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        const currentEditorMock = { validate: jest.fn() };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
        jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
        jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
        jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct);
        const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
        const setActiveRowSpy = jest.spyOn(gridStub, 'setActiveRow');
        const clearSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');
        const updateItemsSpy = jest.spyOn(gridServiceStub, 'updateItems');

        const mockOnError = jest.fn();
        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection', onError: mockOnError } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        const spyOnError = jest.spyOn(mockModalOptions, 'onError');

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
        const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: {}, editors: {}, grid: gridStub });

        compositeFooterSaveBtnElm.click();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(field3LabelElm.textContent).toBe('Group Name - Field 3');
          expect(compositeFooterSaveBtnElm).toBeTruthy();
          expect(cancelCommitSpy).not.toHaveBeenCalled();
          expect(setActiveRowSpy).not.toHaveBeenCalled();
          expect(updateItemsSpy).not.toHaveBeenCalled();
          expect(validationSummaryElm.style.display).toBe('none');
          expect(validationSummaryElm.textContent).toBe('');
          expect(clearSelectionSpy).not.toHaveBeenCalled();
          expect(spyOnError).toHaveBeenCalledWith({ type: 'warning', code: 'NO_CHANGES_DETECTED', message: 'Sorry we could not detect any changes.' });
          done();
        });
      });

      it('should handle saving and grid changes when "Mass Selection" save button is clicked', (done) => {
        const mockProduct = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        const currentEditorMock = { validate: jest.fn() };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
        jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
        jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
        jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct);
        const getEditSpy = jest.spyOn(gridStub, 'getEditController');
        const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
        const setActiveRowSpy = jest.spyOn(gridStub, 'setActiveRow');
        const clearSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');
        const updateItemsSpy = jest.spyOn(gridServiceStub, 'updateItems');

        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection' } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent();
        component.init(gridStub, container);
        component.openDetails(mockModalOptions);
        const disposeSpy = jest.spyOn(component, 'dispose');

        const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
        const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
        const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
        const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
        const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
        const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
        const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

        gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: { field3: 'test' }, editors: {}, grid: gridStub });

        compositeFooterSaveBtnElm.click();

        setTimeout(() => {
          expect(component).toBeTruthy();
          expect(component.constructor).toBeDefined();
          expect(compositeContainerElm).toBeTruthy();
          expect(compositeHeaderElm).toBeTruthy();
          expect(compositeTitleElm).toBeTruthy();
          expect(compositeTitleElm.textContent).toBe('Details');
          expect(field3LabelElm.textContent).toBe('Group Name - Field 3');
          expect(updateItemsSpy).toHaveBeenCalledWith([mockProduct]);
          expect(cancelCommitSpy).toHaveBeenCalled();
          expect(setActiveRowSpy).toHaveBeenCalledWith(0);
          expect(getEditSpy).toHaveBeenCalledTimes(2);
          expect(validationSummaryElm.style.display).toBe('none');
          expect(validationSummaryElm.textContent).toBe('');
          expect(clearSelectionSpy).toHaveBeenCalled();
          expect(disposeSpy).toHaveBeenCalled();
          done();
        });
      });
    });
  });

  describe('with Mass Update', () => {
    beforeEach(() => {
      const newGridOptions = { ...gridOptionsMock, enableRowSelection: true, };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    });

    afterEach(() => {
      jest.clearAllMocks();
      component?.dispose();
    });

    it('should handle saving and grid changes when "Mass Update" save button is clicked', (done) => {
      const mockProduct1 = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const mockProduct2 = { id: 333, field3: 'else', address: { zip: 789123 }, product: { name: 'Product XYZ', price: 33.44 } };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1, mockProduct2]);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
      jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      const clearSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const setItemsSpy = jest.spyOn(dataViewStub, 'setItems');

      const mockOnClose = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onClose: mockOnClose } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct1, formValues: { field3: 'test' }, editors: {}, grid: gridStub });

      compositeFooterSaveBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3');
        expect(getEditSpy).toHaveBeenCalledTimes(2);
        expect(setItemsSpy).toHaveBeenCalledWith([{ ...mockProduct1, field3: 'test' }, { ...mockProduct2, field3: 'test' }], undefined);
        expect(cancelCommitSpy).toHaveBeenCalled();
        expect(setActiveCellSpy).toHaveBeenCalledWith(0, 0, false);
        expect(validationSummaryElm.style.display).toBe('none');
        expect(validationSummaryElm.textContent).toBe('');
        expect(clearSelectionSpy).toHaveBeenCalled();
        done();
      });
    });

    it('should handle saving and grid changes when "Mass Update" save button is clicked and user provides a custom "onSave" async function', (done) => {
      const mockProduct1 = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const mockProduct2 = { id: 333, field3: 'else', address: { zip: 789123 }, product: { name: 'Product XYZ', price: 33.44 } };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1, mockProduct2]);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
      jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      const clearSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const setItemsSpy = jest.spyOn(dataViewStub, 'setItems');

      const mockOnSave = jest.fn();
      mockOnSave.mockResolvedValue(Promise.resolve(true));
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onSave: mockOnSave, shouldClearRowSelectionAfterMassAction: false } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct1, formValues: { field3: 'test' }, editors: {}, grid: gridStub });

      compositeFooterSaveBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3');
        expect(getEditSpy).toHaveBeenCalledTimes(2);
        expect(mockOnSave).toHaveBeenCalledWith({ field3: 'test' }, { gridRowIndexes: [0], dataContextIds: [222] }, undefined);
        expect(setItemsSpy).toHaveBeenCalled();
        expect(cancelCommitSpy).toHaveBeenCalled();
        expect(setActiveCellSpy).toHaveBeenCalledWith(0, 0, false);
        expect(validationSummaryElm.style.display).toBe('none');
        expect(validationSummaryElm.textContent).toBe('');
        expect(clearSelectionSpy).not.toHaveBeenCalled(); // shouldClearRowSelectionAfterMassAction is false
        done();
      });
    });

    it('should handle saving and expect a dataset preview of the change when "shouldPreviewMassChangeDataset" is enabled and grid changes when "Mass Update" save button is clicked and user provides a custom "onSave" async function', (done) => {
      const mockProduct1 = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const mockProduct2 = { id: 333, field3: 'else', address: { zip: 789123 }, product: { name: 'Product XYZ', price: 33.44 } };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1, mockProduct2]);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
      jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      const clearSelectionSpy = jest.spyOn(gridStub, 'setSelectedRows');
      const setItemsSpy = jest.spyOn(dataViewStub, 'setItems');

      const mockOnSave = jest.fn();
      mockOnSave.mockResolvedValue(Promise.resolve(true));
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onSave: mockOnSave, shouldClearRowSelectionAfterMassAction: false, shouldPreviewMassChangeDataset: true } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct1, formValues: { field3: 'test' }, editors: {}, grid: gridStub });

      compositeFooterSaveBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3');
        expect(getEditSpy).toHaveBeenCalledTimes(2);
        expect(mockOnSave).toHaveBeenCalledWith(
          { field3: 'test' },
          { gridRowIndexes: [0], dataContextIds: [222] },
          [{ address: { zip: 123456 }, field3: 'test', id: 222, product: { name: 'Product ABC', price: 12.55 } }, { address: { zip: 789123 }, field3: 'test', id: 333, product: { name: 'Product XYZ', price: 33.44 } }]
        );
        expect(setItemsSpy).toHaveBeenCalled();
        expect(cancelCommitSpy).toHaveBeenCalled();
        expect(setActiveCellSpy).toHaveBeenCalledWith(0, 0, false);
        expect(validationSummaryElm.style.display).toBe('none');
        expect(validationSummaryElm.textContent).toBe('');
        expect(clearSelectionSpy).not.toHaveBeenCalled(); // shouldClearRowSelectionAfterMassAction is false
        done();
      });
    });

    it('should show a validation summary when clicking "Mass Update" save button and the custom "onSave" async function throws an error', (done) => {
      const mockProduct1 = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const mockProduct2 = { id: 333, field3: 'else', address: { zip: 789123 }, product: { name: 'Product XYZ', price: 33.44 } };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1, mockProduct2]);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
      jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');

      const mockOnSave = jest.fn();
      mockOnSave.mockResolvedValue(Promise.reject(new Error('some error')));
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onSave: mockOnSave } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector('.btn-save') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const validationSummaryElm = compositeContainerElm.querySelector('.validation-summary') as HTMLSelectElement;

      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct1, formValues: { field3: 'test' }, editors: {}, grid: gridStub });

      compositeFooterSaveBtnElm.click();
      expect(compositeFooterSaveBtnElm.disabled).toBeTruthy();
      expect(compositeFooterSaveBtnElm.classList.contains('saving')).toBeTruthy();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3');
        expect(validationSummaryElm.style.display).toBe('block');
        expect(validationSummaryElm.textContent).toBe('some error');
        expect(compositeFooterSaveBtnElm.disabled).toBeFalsy();
        expect(compositeFooterSaveBtnElm.classList.contains('saving')).toBeFalsy();
        expect(cancelCommitSpy).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('with Translate Service', () => {
    beforeEach(() => {
      container = new ContainerServiceStub();
      translateService = new TranslateServiceStub();
      translateService.use('fr');
      container.registerInstance('GridService', gridServiceStub);
      container.registerInstance('TranslaterService', translateService);

      const newGridOptions = { ...gridOptionsMock, enableRowSelection: true, enableTranslate: true };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    });

    afterEach(() => {
      jest.clearAllMocks();
      component?.dispose();
    });

    it('should have translate text when opening Composite Editor when calling a Create New Item', () => {
      const newGridOptions = { ...gridOptionsMock, enableAddRow: true, enableTranslate: true };
      const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);

      const mockModalOptions = { headerTitle: 'Details', modalType: 'create' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
      const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(productNameLabelElm.textContent).toBe('Produit');
      expect(compositeFooterCancelBtnElm.textContent).toBe('Annuler');
      expect(compositeFooterSaveBtnElm.textContent).toBe('Sauvegarder');
      expect(compositeFooterCancelBtnElm.ariaLabel).toBe('Annuler');
      expect(compositeFooterSaveBtnElm.ariaLabel).toBe('Sauvegarder');
    });

    it('should have translate text when opening Composite Editor when cloning an Item', () => {
      const newGridOptions = { ...gridOptionsMock, enableAddRow: true, enableTranslate: true };
      const mockProduct1 = { id: 222, address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);

      const mockModalOptions = { headerTitle: 'Details', modalType: 'clone' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const productNameDetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-productName.slick-col-medium-12') as HTMLSelectElement;
      const productNameLabelElm = productNameDetailContainerElm.querySelector('.item-details-label.editor-productName') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(productNameLabelElm.textContent).toBe('Produit');
      expect(compositeFooterCancelBtnElm.textContent).toBe('Annuler');
      expect(compositeFooterSaveBtnElm.textContent).toBe('Cloner');
      expect(compositeFooterSaveBtnElm.ariaLabel).toBe('Cloner');
    });

    it('should have translated text when handling a saving of grid changes when "Mass Selection" save button is clicked', (done) => {
      const mockProduct = { id: 222, field3: 'something', address: { zip: 123456 }, productName: 'Product ABC', price: 12.55 };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
      jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);
      jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController() as any, 'cancelCurrentEdit');
      const setActiveRowSpy = jest.spyOn(gridStub, 'setActiveRow');
      const updateItemsSpy = jest.spyOn(gridServiceStub, 'updateItems');

      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;

      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: { field3: 'test' }, editors: {}, grid: gridStub });

      compositeFooterSaveBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field3LabelElm.textContent).toBe('Nom du Groupe - Durée');
        expect(compositeFooterCancelBtnElm.textContent).toBe('Annuler');
        expect(compositeFooterCancelBtnElm.ariaLabel).toBe('Annuler');
        expect(compositeFooterSaveBtnElm.textContent).toBe('Mettre à jour la sélection');
        expect(compositeFooterSaveBtnElm.ariaLabel).toBe('Mettre à jour la sélection');
        expect(updateItemsSpy).toHaveBeenCalledWith([mockProduct]);
        expect(cancelCommitSpy).toHaveBeenCalled();
        expect(setActiveRowSpy).toHaveBeenCalledWith(0);
        expect(getEditSpy).toHaveBeenCalledTimes(2);
        done();
      });
    });

    it('should have translated text when handling a saving of grid changes when "Mass Update" save button is clicked', (done) => {
      const mockProduct1 = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const mockProduct2 = { id: 333, field3: 'else', address: { zip: 789123 }, product: { name: 'Product XYZ', price: 33.44 } };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1, mockProduct2]);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(dataViewStub, 'getAllSelectedIds').mockReturnValue([222]);
      jest.spyOn(dataViewStub, 'mapIdsToRows').mockReturnValue([0]);

      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent();
      component.init(gridStub, container);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector('div.slick-editor-modal.slickgrid_123456') as HTMLSelectElement;
      const compositeHeaderElm = document.querySelector('.slick-editor-modal-header') as HTMLSelectElement;
      const compositeTitleElm = compositeHeaderElm.querySelector('.slick-editor-modal-title') as HTMLSelectElement;
      const compositeBodyElm = document.querySelector('.slick-editor-modal-body') as HTMLSelectElement;
      const field3DetailContainerElm = compositeBodyElm.querySelector('.item-details-container.editor-field3.slick-col-medium-12') as HTMLSelectElement;
      const field3LabelElm = field3DetailContainerElm.querySelector('.item-details-label.editor-field3') as HTMLSelectElement;
      const compositeFooterElm = compositeContainerElm.querySelector('.slick-editor-modal-footer') as HTMLSelectElement;
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector('.btn-cancel') as HTMLSelectElement;
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector('.btn-save') as HTMLSelectElement;

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field3LabelElm.textContent).toBe('Nom du Groupe - Durée');
        expect(compositeFooterCancelBtnElm.textContent).toBe('Annuler');
        expect(compositeFooterSaveBtnElm.textContent).toBe('Mettre à jour en masse');
        done();
      });
    });
  });
});
