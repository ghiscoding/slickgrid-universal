import { Column, Editors, GridOption, SlickDataView, SlickGrid, SlickNamespace } from '@slickgrid-universal/common';
import { SlickCompositeEditorComponent } from '../slick-composite-editor.component';

declare const Slick: SlickNamespace;

const gridOptionsMock = {
  enableTreeData: true,
  treeDataOptions: {
    columnId: 'file'
  }
} as GridOption;

const dataViewStub = {
  getItem: jest.fn(),
  getItems: jest.fn(),
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

const gridStub = {
  autosizeColumns: jest.fn(),
  getColumnIndex: jest.fn(),
  getActiveCell: jest.fn(),
  getData: jest.fn(),
  getDataItem: jest.fn(),
  editActiveCell: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: () => gridOptionsMock,
  getUID: () => 'slickgrid_123456',
  getColumns: jest.fn(),
  getSortColumns: jest.fn(),
  invalidate: jest.fn(),
  onLocalSortChanged: jest.fn(),
  onClick: new Slick.Event(),
  render: jest.fn(),
  setActiveCell: jest.fn(),
  setSortColumns: jest.fn(),
} as unknown as SlickGrid;

describe('CompositeEditorService', () => {
  let component: SlickCompositeEditorComponent;
  let div: HTMLDivElement;
  const columnsMock: Column[] = [
    { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE', editor: { model: Editors.text } },
    { id: 'field2', field: 'field2', width: 75 },
    { id: 'field3', field: 'field3', width: 75, editor: { model: Editors.date } }
  ];

  beforeEach(() => {
    div = document.createElement('div');
    document.body.appendChild(div);
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(true);
      jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 0, cell: 0 });
      jest.spyOn(gridStub, 'getColumns').mockReturnValue(columnsMock);
    });

    afterEach(() => {
      // clear all the spyOn mocks to not influence next test
      jest.clearAllMocks();
      component.dispose();
    });

    it('should throw an error when there are no rows or active cell selected', () => {
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(null);
      component = new SlickCompositeEditorComponent(gridStub);

      expect(() => component.openDetails()).toThrowError('No records selected for edit operation');
    });

    it('should throw an error when there are no Editors found in the column definitions', () => {
      jest.spyOn(gridStub, 'getColumns').mockReturnValue([
        { id: 'field1', field: 'field1', width: 100, nameKey: 'TITLE' },
        { id: 'field2', field: 'field2', width: 75 }
      ]);

      component = new SlickCompositeEditorComponent(gridStub);

      expect(() => component.openDetails()).toThrowError('We could not find any Editor in your Column Definition');
    });

    it('should not create neither render the component when isActive() returns True & commitCurrentEdit() returns false', () => {
      jest.spyOn(gridStub.getEditorLock(), 'isActive').mockReturnValue(true);
      jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit').mockReturnValue(false);

      component = new SlickCompositeEditorComponent(gridStub);
      component.openDetails();

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeFalsy();
    });

    it('should make sure Slick-Composite-Editor is being created and rendered', () => {
      component = new SlickCompositeEditorComponent(gridStub);
      component.openDetails();

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
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue({ row: 4, cell: 1 }); // column index 1 has no Editor
      const setActiveSpy = jest.spyOn(gridStub, 'setActiveCell');

      component = new SlickCompositeEditorComponent(gridStub);
      component.openDetails();

      const compositeContainerElm = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(setActiveSpy).toHaveBeenCalledTimes(1);
      expect(setActiveSpy).toHaveBeenCalledWith(4, 0, false);
      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm).toBeTruthy();
    });

    it('should be able to dispose the component', () => {
      component = new SlickCompositeEditorComponent(gridStub);
      component.openDetails();

      const compositeContainerElm1 = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');

      expect(component).toBeTruthy();
      expect(component.constructor).toBeDefined();
      expect(compositeContainerElm1).toBeTruthy();

      component.dispose();

      const compositeContainerElm2 = document.querySelector<HTMLSelectElement>('div.slick-editor-modal.slickgrid_123456');
      expect(compositeContainerElm2).toBeFalsy();
    });
  });

});
