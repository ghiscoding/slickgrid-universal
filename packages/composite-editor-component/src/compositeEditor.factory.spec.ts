import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Column,
  type CompositeEditorOption,
  Editors,
  type ElementPosition,
  type GridOption,
  type SlickDataView,
  SlickEvent,
  type SlickGrid
} from '@slickgrid-universal/common';

import { SlickCompositeEditor } from './compositeEditor.factory.js';

vi.useFakeTimers();

const dataViewStub = {
  getItem: vi.fn(),
  getItemById: vi.fn(),
  getItemCount: vi.fn(),
  getItems: vi.fn(),
  getLength: vi.fn(),
  refresh: vi.fn(),
  sort: vi.fn(),
  reSort: vi.fn(),
  setItems: vi.fn(),
  updateItem: vi.fn(),
} as unknown as SlickDataView;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
  isActive: vi.fn(),
};
const getEditControllerMock = {
  cancelCurrentEdit: vi.fn(),
  commitCurrentEdit: vi.fn(),
};

const gridStub = {
  autosizeColumns: vi.fn(),
  editActiveCell: vi.fn(),
  focus: vi.fn(),
  getColumnIndex: vi.fn(),
  getActiveCell: vi.fn(),
  getCellNode: vi.fn(),
  getCellEditor: vi.fn(),
  getData: vi.fn(),
  getDataItem: vi.fn(),
  getEditController: () => getEditControllerMock,
  getSelectedRows: vi.fn(),
  getSelectionModel: vi.fn(),
  getEditorLock: () => getEditorLockMock,
  getOptions: vi.fn(),
  getUID: () => 'slickgrid_123456',
  getColumns: vi.fn(),
  getSortColumns: vi.fn(),
  invalidate: vi.fn(),
  onLocalSortChanged: vi.fn(),
  onAddNewRow: new SlickEvent(),
  onBeforeEditCell: new SlickEvent(),
  onClick: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
  render: vi.fn(),
  setActiveCell: vi.fn(),
  setSelectedRows: vi.fn(),
  setActiveRow: vi.fn(),
  setSortColumns: vi.fn(),
} as unknown as SlickGrid;

const columnsMock: Column[] = [
  { id: 'productName', field: 'productName', width: 100, name: 'Product', nameKey: 'PRODUCT', editorClass: Editors.text as any },
  { id: 'field2', field: 'field2', width: 75, name: 'Field 2' },
  { id: 'field3', field: 'field3', width: 75, name: 'Field 3', nameKey: 'DURATION', editorClass: Editors.float as any, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' },
  { id: 'zip', field: 'adress.zip', width: 75, name: 'Zip', editorClass: Editors.integer as any, columnGroup: 'Group Name', columnGroupKey: 'GROUP_NAME' }
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

describe('Composite Editor Factory', () => {
  let factory: any;
  let cancelChangeMock;
  let commitChangeMock;
  let destroyMock;
  let editors;
  let compositeOptions;
  let textEditorArgs;
  let containers;

  beforeEach(() => {
    cancelChangeMock = vi.fn();
    commitChangeMock = vi.fn();
    destroyMock = vi.fn();
    vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

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
    editors = columnsMock.map(col => col.editorClass);
    compositeOptions = { destroy: destroyMock, modalType: 'create', validationMsgPrefix: '* ', formValues: {}, editors };

    containers = [container1, container2, container3, container4];
    factory = new (SlickCompositeEditor as any)(columnsMock, containers, compositeOptions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should focus on first Editor input after initialization', () => {
    const output = new factory(textEditorArgs);

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();

    vi.advanceTimersByTime(1);

    expect(document.activeElement).not.toBeUndefined();
  });

  it('should be able to call the cancelChanges & commitChanges function to test the noop function after initialization', () => {
    const output = new factory(textEditorArgs);
    const cancelOutput = output.getEditors()[0].args.cancelChanges();
    const commitOutput = output.getEditors()[0].args.commitChanges();

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(cancelOutput).toBeUndefined();
    expect(commitOutput).toBeUndefined();
  });

  it('should instantiate the factory and expect "destroy" to be called when asked for', () => {
    const compOptDestroySpy = vi.spyOn(compositeOptions, 'destroy');

    factory = new (SlickCompositeEditor as any)(columnsMock, containers, compositeOptions);
    const output = new factory(textEditorArgs);
    const ctxDestroySpy = vi.spyOn(output, 'destroy');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.destroy).toBe('function');
    output.destroy();

    expect(compOptDestroySpy).toHaveBeenCalled();
    expect(ctxDestroySpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "focus" to be called when asked for', () => {
    const output = new factory(textEditorArgs);
    const editorFocusSpy = vi.spyOn(output, 'focus');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.focus).toBe('function');
    output.focus();

    expect(editorFocusSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "isValueChanged" to be called and return False when Editor returns False', () => {
    const output = new factory(textEditorArgs);
    const editorIsValueChangedSpy = vi.spyOn(output, 'isValueChanged');
    vi.spyOn(output.getEditors()[0], 'isValueChanged').mockReturnValue(false);

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.isValueChanged).toBe('function');
    const isChanged = output.isValueChanged();

    expect(isChanged).toBe(false);
    expect(editorIsValueChangedSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "isValueChanged" to be called and return True when Editor returns True', () => {
    const output = new factory(textEditorArgs);
    const editorIsValueChangedSpy = vi.spyOn(output, 'isValueChanged');
    vi.spyOn(output.getEditors()[0], 'isValueChanged').mockReturnValue(true);

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.isValueChanged).toBe('function');
    const isChanged = output.isValueChanged();

    expect(isChanged).toBe(true);
    expect(editorIsValueChangedSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "serializeValue" to be called when asked for', () => {
    const output = new factory(textEditorArgs);
    const editorSerializeValueSpy = vi.spyOn(output, 'serializeValue');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.serializeValue).toBe('function');
    output.serializeValue();

    expect(editorSerializeValueSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "applyValue" to be called when asked for', () => {
    const output = new factory(textEditorArgs);
    const editorApplyValueSpy = vi.spyOn(output, 'applyValue');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.applyValue).toBe('function');
    output.applyValue({ firstName: 'John' }, { firstName: 'Jane' });

    expect(editorApplyValueSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "loadValue" to be called when asked for', () => {
    const valueMock = 25;
    const output = new factory(textEditorArgs);
    const editorLoadValueSpy = vi.spyOn(output, 'loadValue');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.loadValue).toBe('function');
    output.loadValue(valueMock);

    expect(editorLoadValueSpy).toHaveBeenCalledWith(valueMock);
  });

  it('should instantiate the factory and expect "hide" to be called when asked for', () => {
    const output = new factory(textEditorArgs);
    const editorHideSpy = vi.spyOn(output, 'hide');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.hide).toBe('function');
    output.hide();

    expect(editorHideSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "show" to be called when asked for', () => {
    const output = new factory(textEditorArgs);
    const editorShowSpy = vi.spyOn(output, 'show');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.show).toBe('function');
    output.show();

    expect(editorShowSpy).toHaveBeenCalled();
  });

  it('should instantiate the factory and expect "position" to be called when asked for', () => {
    const newPositionMock = { top: 10, bottom: 15, left: 20, right: 25 };
    const output = new factory(textEditorArgs);
    const editorPositionSpy = vi.spyOn(output, 'position');

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.position).toBe('function');
    output.position(newPositionMock);

    expect(editorPositionSpy).toHaveBeenCalledWith(newPositionMock);
  });

  it('should instantiate the factory and expect "validate" to be called and return True when all editors are valid', () => {
    const modalElm = document.createElement('div');
    modalElm.className = 'slick-editor-modal';

    for (const column of columnsMock) {
      if (column.editorClass) {
        const validationEditorElm = document.createElement('div');
        validationEditorElm.className = `item-details-validation editor-${column.id}`;
        const labelEditorElm = document.createElement('div');
        labelEditorElm.className = `item-details-label editor-${column.id}`;
        const inputEditorElm = document.createElement('input');
        inputEditorElm.dataset.editorid = `${column.id}`;
        modalElm.appendChild(validationEditorElm);
        modalElm.appendChild(labelEditorElm);
        modalElm.appendChild(inputEditorElm);
      }
    }
    document.body.appendChild(modalElm);

    const output = new factory(textEditorArgs);
    const editorValidateSpy = vi.spyOn(output, 'validate');
    for (const editor of output.getEditors()) {
      vi.spyOn(editor, 'validate').mockReturnValue({ valid: true, msg: '' });
    }

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.validate).toBe('function');
    const validationOut = output.validate(null);

    expect(output.getEditors().length).toBe(3);
    expect(editorValidateSpy).toHaveBeenCalled();
    expect(validationOut.errors).toBeUndefined();
    expect(document.body.querySelectorAll('.invalid').length).toBe(0);
  });

  it('should instantiate the factory and expect "validate" to be called and return True when at least 1 editor is invalid', () => {
    const modalElm = document.createElement('div');
    modalElm.className = 'slick-editor-modal';

    for (const column of columnsMock) {
      if (column.editorClass) {
        const validationEditorElm = document.createElement('div');
        validationEditorElm.className = `item-details-validation editor-${column.id}`;
        const labelEditorElm = document.createElement('div');
        labelEditorElm.className = `item-details-label editor-${column.id}`;
        const inputEditorElm = document.createElement('input');
        inputEditorElm.dataset.editorid = `${column.id}`;
        modalElm.appendChild(validationEditorElm);
        modalElm.appendChild(labelEditorElm);
        modalElm.appendChild(inputEditorElm);
      }
    }
    document.body.appendChild(modalElm);

    const output = new factory(textEditorArgs);
    const editorValidateSpy = vi.spyOn(output, 'validate');
    let editorIdx = 0;
    for (const editor of output.getEditors()) {
      // make 1st editor invalid, everything else as valid
      if (editorIdx++ === 0) {
        vi.spyOn(editor, 'validate').mockReturnValue({ valid: false, msg: 'invalid product' });
      } else {
        vi.spyOn(editor, 'validate').mockReturnValue({ valid: true, msg: '' });
      }
    }

    expect(factory).toBeTruthy();
    expect(output).toBeTruthy();
    expect(typeof output.validate).toBe('function');
    const validationOut = output.validate(null);

    expect(output.getEditors().length).toBe(3);
    expect(editorValidateSpy).toHaveBeenCalled();
    expect(validationOut).toEqual({
      valid: false,
      msg: 'Some of the fields have failed validation',
      errors: [{
        index: 0,
        editor: output.getEditors()[0],
        container: containers[0],
        msg: 'invalid product'
      }]
    });
    expect(document.body.querySelectorAll('.invalid').length).toBe(2);
  });
});