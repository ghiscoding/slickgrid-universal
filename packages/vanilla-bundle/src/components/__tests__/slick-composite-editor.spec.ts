import { Column, CompositeEditorOpenDetailOption, Editor, Editors, GridOption, GridService, GridStateService, SlickDataView, SlickGrid, SlickNamespace, SlickRowSelectionModel } from '@slickgrid-universal/common';
import { SlickCompositeEditorComponent } from '../slick-composite-editor.component';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;

const gridOptionsMock = {
  editable: true,
  enableCellNavigation: true,
  enableCompositeEditor: true,
  compositeEditorOptions: {
    labels: {
      cancelButton: 'Cancel',
      cancelButtonKey: 'CANCEL',
      massSelectionButton: 'Update Selection',
      massSelectionButtonKey: 'APPLY_TO_SELECTION',
      massSelectionStatus: '{{x}} of {{y}} selected',
      massSelectionStatusKey: 'X_OF_Y_MASS_SELECTED',
      massUpdateButton: 'Mass Update',
      massUpdateButtonKey: 'APPLY_MASS_UPDATE',
      massUpdateStatus: 'all {{x}} items',
      massUpdateStatusKey: 'ALL_X_RECORDS_SELECTED',
      saveButton: 'Save',
      saveButtonKey: 'SAVE',
    },
  },
} as GridOption;

const dataViewStub = {
  getItem: jest.fn(),
  getItemById: jest.fn(),
  getItems: jest.fn(),
  getLength: jest.fn(),
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

const gridStateServiceStub = {
  getCurrentRowSelections: jest.fn(),
} as unknown as GridStateService;

const gridStub = {
  autosizeColumns: jest.fn(),
  editActiveCell: jest.fn(),
  getColumnIndex: jest.fn(),
  getActiveCell: jest.fn(),
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
  onAddNewRow: new Slick.Event(),
  onBeforeEditCell: new Slick.Event(),
  onClick: new Slick.Event(),
  onCompositeEditorChange: new Slick.Event(),
  render: jest.fn(),
  setActiveCell: jest.fn(),
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
  onSelectedRangesChanged: new Slick.Event(),
} as SlickRowSelectionModel;

function createNewColumDefinitions(count) {
  const columnsMock = [];
  for (let i = 0; i < count; i++) {
    columnsMock.push({ id: `field${i}`, field: `field${i}`, name: `Field ${i}`, editor: { model: Editors.text, massUpdate: true }, width: 75 });
  }
  return columnsMock;
}

describe('CompositeEditorService', () => {
  let component: SlickCompositeEditorComponent;
  let div: HTMLDivElement;
  let translateService: TranslateServiceStub;
  const columnsMock: Column[] = [
    { id: 'field1', field: 'field1', width: 100, name: 'Field 1', nameKey: 'TITLE', editor: { model: Editors.text } },
    { id: 'field2', field: 'field2', width: 75, name: 'Field 2' },
    { id: 'field3', field: 'field3', width: 75, name: 'Field 3', nameKey: 'DURATION', editor: { model: Editors.date, massUpdate: true }, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' }
  ];

  beforeEach(() => {
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

    it('should throw an error when "enableTranslateLabel" is set without a valid I18N Service', (done) => {
      try {
        const newGridOptions = { ...gridOptionsMock, enableTranslate: true };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

        translateService = undefined;
        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub, translateService);
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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);

      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'create', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: 'ENABLE_ADD_ROW_REQUIRED', message: 'Composite Editor requires the flag "enableAddRow" to be set to True in your Grid Options when creating a new item.', });
        done();
      });
    });

    it('should throw an error when trying to edit a row that does not return any data context', (done) => {
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(null);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);

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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);

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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);

      const mockModalOptions = { headerTitle: 'Details' } as CompositeEditorOpenDetailOption;

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(consoleSpy).toHaveBeenCalledWith('Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.');
        done();
      });
    });

    it('should throw an error when there are no rows or active cell selected', (done) => {
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(null);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      const mockOnError = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', onError: mockOnError } as CompositeEditorOpenDetailOption;
      const spyOnError = jest.spyOn(mockModalOptions, 'onError');

      setTimeout(() => {
        component.openDetails(mockModalOptions);
        expect(spyOnError).toHaveBeenCalledWith({ type: 'warning', code: 'NO_RECORD_FOUND', message: 'No records selected for edit operation.' });
        done();
      });
    });

    it('should throw an error when grid is not editable (readonly)', (done) => {
      const newGridOptions = { ...gridOptionsMock, editable: false };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeFalsy();
    });

    it('should make sure Slick-Composite-Editor is being created and rendered with 1 column layout', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeHeaderElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
      const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
      const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
      const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-save');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(field1LabelElm.textContent).toBe('Field 1'); // regular, without column group
      expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(compositeBodyElm).toBeTruthy();
      expect(compositeFooterElm).toBeTruthy();
      expect(compositeFooterCancelBtnElm).toBeTruthy();
      expect(compositeFooterSaveBtnElm).toBeTruthy();
      expect(field1DetailContainerElm).toBeTruthy();
    });

    it('should make sure Slick-Composite-Editor is being created and rendered with 2 columns layout when having more than 8 but less than 15 column definitions', () => {
      const copyColumnsMock: Column[] = createNewColumDefinitions(8);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(copyColumnsMock);
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeContentElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-content.split-view');
      const compositeHeaderElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-6');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');

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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details', viewColumnLayout: 'auto' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeContentElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-content.triple-split-view');
      const compositeHeaderElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-6');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');

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

    it('should activate next available cell with an Editor when current active cell does not have an Editor', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 4, cell: 1 }); // column index 1 has no Editor
      const setActiveSpy = jest.spyOn(gridStub, 'setActiveCell');

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });
      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(setActiveSpy).toHaveBeenCalledTimes(2);
      expect(setActiveSpy).toHaveBeenCalledWith(4, 0, false);
      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
    });

    it('should be able to dispose the component', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });
      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();

      component.dispose();

      const compositeContainerElm2 = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      expect(compositeContainerElm2).toBeFalsy();
    });

    it('should dispose the component when clicking in the backdrop outside the modal window when using the options "backdrop: null"', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details', backdrop: null });
      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      compositeContainerElm.click();

      const compositeContainerElm2 = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      expect(compositeContainerElm2).toBeFalsy();
    });

    it('should execute "onClose" callback when user confirms the closing of the modal when "onClose" callback is defined', (done) => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');

      const mockOnClose = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'edit', onClose: mockOnClose } as CompositeEditorOpenDetailOption;
      const spyOnClose = jest.spyOn(mockModalOptions, 'onClose').mockReturnValue(Promise.resolve(true));
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails(mockModalOptions);
      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: { field1: 'test' }, editors: {}, grid: gridStub });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
      const field1DetailCellElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.slick-cell');
      const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
      compositeFooterCancelBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field1LabelElm.textContent).toBe('Field 1');
        expect(field1DetailCellElm.classList.contains('modified')).toBe(true);
        expect(compositeFooterCancelBtnElm).toBeTruthy();
        expect(spyOnClose).toHaveBeenCalled();
        expect(getEditSpy).toHaveBeenCalledTimes(2);
        expect(cancelSpy).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should NOT execute "onClose" callback when user confirms the closing of the modal when "onClose" callback is defined', (done) => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      const cancelSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');

      const mockOnClose = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'edit', onClose: mockOnClose } as CompositeEditorOpenDetailOption;
      const spyOnClose = jest.spyOn(mockModalOptions, 'onClose').mockReturnValue(Promise.resolve(false));
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails(mockModalOptions);
      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct, formValues: { fieldX: 'test' }, editors: {}, grid: gridStub });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
      const field1DetailCellElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.slick-cell');
      const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
      compositeFooterCancelBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.eventHandler).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field1LabelElm.textContent).toBe('Field 1');
        expect(field1DetailCellElm.classList.contains('modified')).toBe(false); // false since formValues: fieldX doesn't exist
        expect(compositeFooterCancelBtnElm).toBeTruthy();
        expect(spyOnClose).toHaveBeenCalled();
        expect(cancelSpy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should pass a Header Title that has to be parsed from the dataContext object', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Editing ({{id}}) - {{product.name}}' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeTitleElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();

      component.dispose();

      const compositeContainerElm2 = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      expect(compositeContainerElm2).toBeFalsy();
      expect(compositeTitleElm.textContent).toBe('Editing (222) - Product ABC');
    });

    it('should execute "cancelCurrentEdit" when the "Esc" key is typed', () => {
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
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

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
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
      const cancelSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterCancelBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-cancel');
      compositeFooterCancelBtnElm.click();

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeFooterCancelBtnElm).toBeTruthy();
      expect(getEditSpy).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
    });

    it('should execute "cancelCurrentEdit" when the "Close" button is clicked even with option "showCloseButtonOutside" is enabled', () => {
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const closeSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Some Details', showCloseButtonOutside: true });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterCloseBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.close');
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
      const saveSpy = jest.spyOn(gridStub.getEditController(), 'commitCurrentEdit');

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-save');
      compositeFooterSaveBtnElm.click();

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeFooterSaveBtnElm).toBeTruthy();
      expect(getEditSpy).toHaveBeenCalled();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should execute "onAddNewRow" callback when triggered by a new item', (done) => {
      const newGridOptions = { ...gridOptionsMock, enableAddRow: true };
      const mockProduct1 = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const mockProduct2 = { address: { zip: 345678 }, product: { name: 'Product DEF', price: 22.33 } };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);
      const gridSrvAddItemSpy = jest.spyOn(gridServiceStub, 'addItem');
      const saveSpy = jest.spyOn(gridStub.getEditController(), 'commitCurrentEdit');

      const mockModalOptions = { headerTitle: 'Details', modalType: 'create' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-save');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
      const field1DetailCellElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.slick-cell');
      const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');

      gridStub.onCompositeEditorChange.notify({ row: 0, cell: 0, column: columnsMock[0], item: mockProduct2, formValues: { field1: 'test' }, editors: {}, grid: gridStub });
      gridStub.onAddNewRow.notify({ grid: gridStub, item: mockProduct2, column: columnsMock[0] });

      compositeFooterSaveBtnElm.click();

      setTimeout(() => {
        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeHeaderElm).toBeTruthy();
        expect(compositeTitleElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Details');
        expect(field1LabelElm.textContent).toBe('Field 1');
        expect(field1DetailCellElm.classList.contains('modified')).toBe(true);
        expect(gridSrvAddItemSpy).toHaveBeenCalledWith({ ...mockProduct2, id: 2 }, undefined);
        expect(saveSpy).toHaveBeenCalled();
        done();
      }, 5);
    });

    describe('Form Logics', () => {
      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" to change dynamically any of the form input value', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
        const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
        const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
        const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
        const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
        const field3DetailCellElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.slick-cell');

        component.editors = { field3: mockEditor };
        component.changeFormInputValue('field3', 'Field 3 different text');

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(field1LabelElm.textContent).toBe('Field 1'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(field1DetailContainerElm).toBeTruthy();
        expect(field3DetailCellElm.classList.contains('modified')).toBe(true);
        expect(component.formValues).toEqual({ field3: 'Field 3 different text' });
      });

      it('should make sure Slick-Composite-Editor is being created and then call "changeFormInputValue" on a disabled field and expect the field to not be modified', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        mockEditor.disabled = true;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
        const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
        const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
        const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
        const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
        const field3DetailCellElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.slick-cell');

        component.editors = { field3: mockEditor };
        component.changeFormInputValue('field3', 'Field 3 different text');

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(field1LabelElm.textContent).toBe('Field 1'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(field1DetailContainerElm).toBeTruthy();
        expect(field3DetailCellElm.classList.contains('modified')).toBe(false);
        expect(component.formValues).toEqual({ field3: '' });
      });

      it('should make sure Slick-Composite-Editor is being created and then call "disableFormInput" to disable the field', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const disableSpy = jest.spyOn(mockEditor, 'disable');

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
        const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
        const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
        const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
        const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');

        component.editors = { field3: mockEditor };
        component.disableFormInput('field3');

        expect(component).toBeTruthy();
        expect(component.editors).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(field1LabelElm.textContent).toBe('Field 1'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(field1DetailContainerElm).toBeTruthy();
        expect(disableSpy).toHaveBeenCalledWith(true);
      });

      it('should make sure Slick-Composite-Editor is being created and then call "disableFormInput" by passing False as 2nd argument to enable the field', () => {
        const mockEditor = { setValue: jest.fn(), disable: jest.fn(), } as unknown as Editor;
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        const disableSpy = jest.spyOn(mockEditor, 'disable');

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: 'Details' });

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
        const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
        const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
        const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
        const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');

        component.editors = { field3: mockEditor };
        component.disableFormInput('field3', false);

        expect(component).toBeTruthy();
        expect(component.constructor).toBeDefined();
        expect(compositeContainerElm).toBeTruthy();
        expect(field1LabelElm.textContent).toBe('Field 1'); // regular, without column group
        expect(field3LabelElm.textContent).toBe('Group Name - Field 3'); // with column group
        expect(field1DetailContainerElm).toBeTruthy();
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

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);

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
        // @ts-ignore
        gridStub.getColumns.mockImplementation(() => { throw new Error('some error'); });
        const mockOnError = jest.fn();

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection', onError: mockOnError } as CompositeEditorOpenDetailOption;
        const spyOnError = jest.spyOn(mockModalOptions, 'onError');

        setTimeout(() => {
          component.openDetails(mockModalOptions);
          expect(spyOnError).toHaveBeenCalledWith({ type: 'error', code: `some error`, message: `some error` });
          done();
        });
      });

      it('should expect to have a header title & modal type representing "mass-update" when using "auto-mass" type and there are not row selected', () => {
        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: '', modalType: 'auto-mass', headerTitleMassUpdate: 'Mass Update', headerTitleMassSelection: 'Mass Selection' });

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeHeaderElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
        const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');

        expect(component).toBeTruthy();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Mass Update');
      });

      it('should expect to have a header title & modal type representing "mass-selection" when using "auto-mass" type and having some row(s) selected', () => {
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        jest.spyOn(gridStub, 'getSelectedRows').mockReturnValue([222]);
        jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct]);

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: '', modalType: 'auto-mass', headerTitleMassUpdate: 'Mass Update', headerTitleMassSelection: 'Mass Selection' });

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeHeaderElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
        const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');

        expect(component).toBeTruthy();
        expect(compositeContainerElm).toBeTruthy();
        expect(compositeTitleElm.textContent).toBe('Mass Selection');
      });

      it('should activate next available cell with an Editor when current active cell does not have an Editor', () => {
        const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
        columnsMock[2].internalColumnEditor = { massUpdate: true };
        jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
        jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 4, cell: 1 }); // column index 1 has no Editor
        const setActiveSpy = jest.spyOn(gridStub, 'setActiveCell');

        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails({ headerTitle: '', modalType: 'auto-mass', headerTitleMassUpdate: 'Mass Update', headerTitleMassSelection: 'Mass Selection' });
        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

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
        jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct);
        const cancelCommitSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');
        const setActiveRowSpy = jest.spyOn(gridStub, 'setActiveRow');
        const updateItemsSpy = jest.spyOn(gridServiceStub, 'updateItems');

        const mockOnError = jest.fn();
        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection', onError: mockOnError } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails(mockModalOptions);
        const spyOnError = jest.spyOn(mockModalOptions, 'onError');

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-save');
        const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
        const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
        const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
        const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
        const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
        const validationSummaryElm = compositeContainerElm.querySelector<HTMLSelectElement>('.validation-summary');

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
        jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });
        jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct);
        const getEditSpy = jest.spyOn(gridStub, 'getEditController');
        const cancelCommitSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');
        const setActiveRowSpy = jest.spyOn(gridStub, 'setActiveRow');
        const updateItemsSpy = jest.spyOn(gridServiceStub, 'updateItems');

        const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection' } as CompositeEditorOpenDetailOption;
        component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
        component.openDetails(mockModalOptions);

        const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
        const compositeFooterSaveBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-save');
        const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
        const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
        const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
        const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
        const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
        const validationSummaryElm = compositeContainerElm.querySelector<HTMLSelectElement>('.validation-summary');

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
          expect(compositeFooterSaveBtnElm.classList.contains('saving')).toBeFalsy();
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
      jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      const setItemsSpy = jest.spyOn(dataViewStub, 'setItems');

      const mockOnClose = jest.fn();
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onClose: mockOnClose } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-save');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
      const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
      const validationSummaryElm = compositeContainerElm.querySelector<HTMLSelectElement>('.validation-summary');

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
      jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');
      const setActiveCellSpy = jest.spyOn(gridStub, 'setActiveCell');
      const setItemsSpy = jest.spyOn(dataViewStub, 'setItems');

      const mockOnSave = jest.fn();
      mockOnSave.mockResolvedValue(Promise.resolve(true));
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onSave: mockOnSave } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-save');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
      const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
      const validationSummaryElm = compositeContainerElm.querySelector<HTMLSelectElement>('.validation-summary');

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
        expect(mockOnSave).toHaveBeenCalledWith({ field3: 'test' }, { gridRowIndexes: [0], dataContextIds: [222] }, expect.any(Function));
        expect(setItemsSpy).not.toHaveBeenCalled();
        expect(cancelCommitSpy).toHaveBeenCalled();
        expect(setActiveCellSpy).toHaveBeenCalledWith(0, 0, false);
        expect(validationSummaryElm.style.display).toBe('none');
        expect(validationSummaryElm.textContent).toBe('');
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
      jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');

      const mockOnSave = jest.fn();
      mockOnSave.mockResolvedValue(Promise.reject(new Error('some error')));
      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update', onSave: mockOnSave } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeFooterSaveBtnElm = compositeContainerElm.querySelector<HTMLSelectElement>('.btn-save');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
      const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
      const validationSummaryElm = compositeContainerElm.querySelector<HTMLSelectElement>('.validation-summary');

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
      const newGridOptions = { ...gridOptionsMock, enableRowSelection: true, enableTranslate: true };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
      translateService = new TranslateServiceStub();
      translateService.use('fr');
    });

    afterEach(() => {
      jest.clearAllMocks();
      component?.dispose();
    });

    it('should have translate text when opening Composite Editor with New Item', () => {
      const newGridOptions = { ...gridOptionsMock, enableAddRow: true, enableTranslate: true };
      const mockProduct1 = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
      jest.spyOn(dataViewStub, 'getItems').mockReturnValue([mockProduct1]);

      const mockModalOptions = { headerTitle: 'Details', modalType: 'create' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub, translateService);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field1DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field1.slick-col-medium-12');
      const field1LabelElm = field1DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field1');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-save');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(field1LabelElm.textContent).toBe('Titre');
      expect(compositeFooterCancelBtnElm.textContent).toBe('Annuler');
      expect(compositeFooterSaveBtnElm.textContent).toBe('Sauvegarder');
    });

    it('should have translated text when handling a saving of grid changes when "Mass Selection" save button is clicked', (done) => {
      const mockProduct = { id: 222, field3: 'something', address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      const currentEditorMock = { validate: jest.fn() };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);
      jest.spyOn(gridStub, 'getCellEditor').mockReturnValue(currentEditorMock as any);
      jest.spyOn(currentEditorMock, 'validate').mockReturnValue({ valid: true, msg: null });
      jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });
      jest.spyOn(dataViewStub, 'getItemById').mockReturnValue(mockProduct);
      const getEditSpy = jest.spyOn(gridStub, 'getEditController');
      const cancelCommitSpy = jest.spyOn(gridStub.getEditController(), 'cancelCurrentEdit');
      const setActiveRowSpy = jest.spyOn(gridStub, 'setActiveRow');
      const updateItemsSpy = jest.spyOn(gridServiceStub, 'updateItems');

      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-selection' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub, translateService);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
      const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-save');

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
        expect(compositeFooterSaveBtnElm.textContent).toBe('Mettre à jour la sélection');
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
      jest.spyOn(gridStateServiceStub, 'getCurrentRowSelections').mockReturnValue({ gridRowIndexes: [0], dataContextIds: [222] });

      const mockModalOptions = { headerTitle: 'Details', modalType: 'mass-update' } as CompositeEditorOpenDetailOption;
      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub, translateService);
      component.openDetails(mockModalOptions);

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeHeaderElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = document.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const field3DetailContainerElm = compositeBodyElm.querySelector<HTMLSelectElement>('.item-details-container.editor-field3.slick-col-medium-12');
      const field3LabelElm = field3DetailContainerElm.querySelector<HTMLSelectElement>('.item-details-label.editor-field3');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-save');

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
