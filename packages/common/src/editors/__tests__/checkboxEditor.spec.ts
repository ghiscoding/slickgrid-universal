import { Editors } from '../index';
import { CheckboxEditor } from '../checkboxEditor';
import type { Column, Editor, EditorArguments, GridOption } from '../../interfaces/index';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
};

const gridStub = {
  focus: jest.fn(),
  getActiveCell: jest.fn(),
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getHeaderRowColumn: jest.fn(),
  render: jest.fn(),
  onBeforeEditCell: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
} as unknown as SlickGrid;

describe('CheckboxEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: CheckboxEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'isActive', field: 'isActive', editable: true, editor: { model: Editors.checkbox }, editorClass: {} as Editor } as Column;

    editorArguments = {
      grid: gridStub,
      column: mockColumn,
      item: mockItemData,
      event: null as any,
      cancelChanges: jest.fn(),
      commitChanges: jest.fn(),
      container: divContainer,
      columnMetaData: null,
      dataView: dataViewStub,
      gridPosition: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
      position: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
    };
  });

  describe('with invalid Editor instance', () => {
    it('should throw an error when trying to call init without any arguments', (done) => {
      try {
        editor = new CheckboxEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, title: 'task 1', isActive: true };
      mockColumn = { id: 'isActive', field: 'isActive', editable: true, editor: { model: Editors.checkbox }, editorClass: {} as Editor } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new CheckboxEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-checkbox.editor-isActive').length;
      expect(editorCount).toBe(1);
    });

    it('should have an aria-label when creating the editor', () => {
      editor = new CheckboxEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-checkbox') as HTMLInputElement;

      expect(editorElm.ariaLabel).toBe('Is Active Checkbox Editor');
    });

    it('should initialize the editor even when user define his own editor options', () => {
      editor = new CheckboxEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-checkbox.editor-isActive').length;

      expect(editorCount).toBe(1);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new CheckboxEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-checkbox.editor-isActive') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
      expect(editor.editorDomElement.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor = {
        title: 'test title',
      };

      editor = new CheckboxEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" with true and expect the DOM element value to return true (representing checked)', () => {
      editor = new CheckboxEditor(editorArguments);
      editor.setValue(true);

      expect(editor.getValue()).toBe(true);
    });

    it('should call "setValue" with any value and still expect the DOM element value to return true (representing checked)', () => {
      editor = new CheckboxEditor(editorArguments);
      editor.setValue('anything');

      expect(editor.getValue()).toBe(true);
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new CheckboxEditor(editorArguments);
      editor.setValue(true, true);

      expect(editor.getValue()).toBe(true);
      expect(editorArguments.item.isActive).toBe(true);
    });

    it('should call "setValue" with false and expect the DOM element value to return false (representing unchecked)', () => {
      editor = new CheckboxEditor(editorArguments);
      editor.setValue(false);

      expect(editor.getValue()).toBe(false);
    });

    it('should call "preClick" and expect the "checked" attribute to be toggled', () => {
      editor = new CheckboxEditor(editorArguments);
      const previousValue = editor.getValue();
      editor.preClick();
      const newValue = editor.getValue();

      expect(previousValue).not.toEqual(newValue);
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new CheckboxEditor(editorArguments);
      editor.loadValue(mockItemData);

      expect(editor.getValue()).toBe(true);
    });

    describe('isValueChanged method', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should return True when previous event is a click event', () => {
        gridOptionMock.autoCommitEdit = true;
        editor = new CheckboxEditor(editorArguments);
        const saveSpy = jest.spyOn(editor, 'save');
        editor.loadValue({ id: 2, title: 'task 1', isActive: true });

        editor.editorDomElement.checked = false;
        editor.editorDomElement.dispatchEvent(new (window.window as any).Event('click'));

        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
        expect(saveSpy).toHaveBeenCalledTimes(1);
      });

      it('should return False when previous event is not a click event', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue({ id: 1, title: 'task 1', isActive: true });
        editor.focus();
        editor.editorDomElement.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(false);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the isActive property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new CheckboxEditor(editorArguments);
        editor.applyValue(mockItemData, false);

        expect(mockItemData).toEqual({ id: 1, title: 'task 1', isActive: false });
      });

      it('should apply the value to the title property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'part.isActive';
        mockItemData = { id: 1, part: { isActive: true } };

        editor = new CheckboxEditor(editorArguments);
        editor.applyValue(mockItemData, false);

        expect(mockItemData).toEqual({ id: 1, part: { isActive: false } });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a boolean true when provided a true boolean input', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(true);
      });

      it('should return serialized value as a boolean true when provided a true string input', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: 'true' };

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(true);
      });

      it('should return serialized value as a boolean False when provided a false boolean input', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: false };

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(false);
      });

      it('should return serialized value as a boolean True when provided any string', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: 'checked' };

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(true);
      });

      it('should return serialized value as False when item value is null', () => {
        mockItemData = { id: 1, title: null, isActive: null };

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(false);
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'task.isActive';
        mockItemData = { id: 1, task: { isActive: true } };

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(true);
      });
    });

    describe('save method', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: false };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(true);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: false };
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(true);
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not call anything when the input value is false but is required', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: false };
        mockColumn.editor!.required = true;
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(false);
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not call anything when the input value is null but is required', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: null };
        mockColumn.editor!.required = true;
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new CheckboxEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(false);
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not save when custom validation fails', () => {
        mockColumn.editor!.validator = (value: any) => {
          if (!value) {
            return { valid: false, msg: 'This must be accepted' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, title: 'task 1', isActive: false };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new CheckboxEditor(editorArguments);
        editor.applyValue(mockItemData, false);
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty, null or false', () => {
        const expectation = { valid: false, msg: 'Field is required' };
        mockColumn.editor!.required = true;
        editor = new CheckboxEditor(editorArguments);
        const validation1 = editor.validate(null, '');
        const validation2 = editor.validate(null, null);
        const validation3 = editor.validate(null, false);

        expect(validation1).toEqual(expectation);
        expect(validation2).toEqual(expectation);
        expect(validation3).toEqual(expectation);
      });

      it('should return True when field is required and input is provided with True', () => {
        mockColumn.editor!.required = true;
        editor = new CheckboxEditor(editorArguments);
        const validation = editor.validate(null, true);

        expect(validation).toEqual({ valid: true, msg: null });
      });

      it('should return True when field is required and input is provided with any text', () => {
        mockColumn.editor!.required = true;
        editor = new CheckboxEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: null });
      });
    });
  });

  describe('with Composite Editor', () => {
    beforeEach(() => {
      editorArguments = {
        ...editorArguments,
        compositeEditorOptions: { headerTitle: 'Test', modalType: 'edit', formValues: {}, editors: {} },
      } as EditorArguments;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      editor = new CheckboxEditor(editorArguments);
      editor.setValue(true, true);

      expect(editor.getValue()).toBe(true);
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { isActive: true }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new CheckboxEditor(editorArguments);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(disableSpy).toHaveBeenCalledWith(false);
    });

    it('should call "show" and expect the DOM element to become disabled with empty value set in the form values when "onBeforeEditCell" returns false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);

      editor = new CheckboxEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { isActive: false }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.checked).toEqual(false);
    });

    it('should call "show" and expect the DOM element to become disabled and empty when "onBeforeEditCell" returns false and also expect "onBeforeComposite" to not be called because the value is blank', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new CheckboxEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).not.toHaveBeenCalled;
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.checked).toEqual(false);
    });

    it('should call "disable" method and expect the DOM element to become disabled and have an empty formValues be passed in the onCompositeEditorChange event', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new CheckboxEditor(editorArguments);
      editor.loadValue({ ...mockItemData, isActive: true });
      editor.show();
      editor.disable();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.checked).toEqual(false);
    });


    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, title: 'task 1', isActive: true };

      editor = new CheckboxEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.checked = true;
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('change'));
      editor.destroy();

      expect(getCellSpy).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { isActive: true }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
