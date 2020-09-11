import { Column, CompositeEditorOpenDetailOption, Editors, GridOption, GridService, GridStateService, SlickDataView, SlickGrid, SlickNamespace } from '@slickgrid-universal/common';
import { SlickCompositeEditorComponent } from '../slick-composite-editor.component';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

declare const Slick: SlickNamespace;

const gridOptionsMock = {
  editable: true,
  enableCellNavigation: true,
  enableCompositeEditor: true,
} as GridOption;

const dataViewStub = {
  getItem: jest.fn(),
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

describe('CompositeEditorService', () => {
  let component: SlickCompositeEditorComponent;
  let div: HTMLDivElement;
  let translateService: TranslateServiceStub;
  const columnsMock: Column[] = [
    { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE', editor: { model: Editors.text } },
    { id: 'field2', field: 'field2', width: 75 },
    { id: 'field3', field: 'field3', width: 75, editor: { model: Editors.date } }
  ];

  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
    translateService = new TranslateServiceStub();
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
        { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' },
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

    it('should make sure Slick-Composite-Editor is being created and rendered', () => {
      const mockProduct = { id: 222, address: { zip: 123456 }, product: { name: 'Product ABC', price: 12.55 } };
      jest.spyOn(gridStub, 'getDataItem').mockReturnValue(mockProduct);

      component = new SlickCompositeEditorComponent(gridStub, gridServiceStub, gridStateServiceStub);
      component.openDetails({ headerTitle: 'Details' });

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      const compositeHeaderElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-header');
      const compositeTitleElm = compositeHeaderElm.querySelector<HTMLSelectElement>('.slick-editor-modal-title');
      const compositeBodyElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-body');
      const compositeFooterElm = compositeContainerElm.querySelector<HTMLSelectElement>('.slick-editor-modal-footer');
      const compositeFooterCancelBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-cancel');
      const compositeFooterSaveBtnElm = compositeFooterElm.querySelector<HTMLSelectElement>('.btn-save');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
      expect(compositeHeaderElm).toBeTruthy();
      expect(compositeTitleElm).toBeTruthy();
      expect(compositeTitleElm.textContent).toBe('Details');
      expect(compositeBodyElm).toBeTruthy();
      expect(compositeFooterElm).toBeTruthy();
      expect(compositeFooterCancelBtnElm).toBeTruthy();
      expect(compositeFooterSaveBtnElm).toBeTruthy();
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

    describe('with Row Selections', () => {
      beforeEach(() => {
        const newGridOptions = { ...gridOptionsMock, enableRowSelection: true, };
        jest.spyOn(gridStub, 'getOptions').mockReturnValue(newGridOptions);
        jest.spyOn(gridStub, 'getSelectionModel').mockReturnValue({});
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
    });
  });
});
