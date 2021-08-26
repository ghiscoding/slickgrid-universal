import { Column, CompositeEditorOption, Editors, ElementPosition, GridOption, SlickDataView, SlickGrid, SlickNamespace } from '@slickgrid-universal/common';
import { CompositeEditor } from './compositeEditor.factory';

declare const Slick: SlickNamespace;

const dataViewStub = {
  getItem: jest.fn(),
  getItemById: jest.fn(),
  getItemCount: jest.fn(),
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

const gridStub = {
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
  onAddNewRow: new Slick.Event(),
  onBeforeEditCell: new Slick.Event(),
  onClick: new Slick.Event(),
  onCompositeEditorChange: new Slick.Event(),
  render: jest.fn(),
  setActiveCell: jest.fn(),
  setSelectedRows: jest.fn(),
  setActiveRow: jest.fn(),
  setSortColumns: jest.fn(),
} as unknown as SlickGrid;

const columnsMock: Column[] = [
  { id: 'productName', field: 'productName', width: 100, name: 'Product', nameKey: 'PRODUCT', editor: Editors.text as any },
  { id: 'field2', field: 'field2', width: 75, name: 'Field 2' },
  { id: 'field3', field: 'field3', width: 75, name: 'Field 3', nameKey: 'DURATION', editor: Editors.date as any, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' },
  { id: 'zip', field: 'adress.zip', width: 75, name: 'Zip', editor: Editors.integer as any, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' }
];
const compositeEditorOptionsMock = {
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
};
const gridOptionsMock = {
  autoCommitEdit: true,
  editable: true,
  enableCellNavigation: true,
  enableCompositeEditor: true,
  compositeEditorOptions: compositeEditorOptionsMock,
} as GridOption;
const container1 = document.createElement('div');
const container2 = document.createElement('div');
const container3 = document.createElement('div');
const container4 = document.createElement('div');
const containers = [container1, container2, container3, container4];

describe('Composite Editor Factory', () => {
  let factory: any;
  let cancelChangeMock;
  let commitChangeMock;
  let destroyMock;
  let textEditor;
  let editors;
  let compositeOptions;
  let textEditorArgs;

  beforeEach(() => {
    cancelChangeMock = jest.fn();
    commitChangeMock = jest.fn();
    destroyMock = jest.fn();
    jest.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

    textEditorArgs = {
      column: columnsMock[0],
      columnMetaData: {},
      container: container1,
      dataView: dataViewStub,
      event: new Event('click'),
      grid: gridStub,
      gridPosition: { top: 0, left: 0, right: 0, bottom: 0, } as unknown as ElementPosition,
      item: {},
      position: { top: 0, left: 0, right: 0, bottom: 0, } as unknown as ElementPosition,
      compositeEditorOptions: {} as unknown as CompositeEditorOption,
      cancelChanges: cancelChangeMock,
      commitChanges: commitChangeMock,
    };
    textEditor = new Editors.text(textEditorArgs, 'text');
    editors = columnsMock.map(col => col.editor);
    compositeOptions = { destroy: destroyMock, modalType: 'create', validationMsgPrefix: '* ', formValues: {}, editors };

    factory = new (CompositeEditor as any)(columnsMock, containers, compositeOptions);
  });

  it('should instantiate the factory', () => {
    const output = new factory(textEditorArgs);

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.destroy).toBe('function');
    output.destroy();
  });
});