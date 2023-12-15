import { Editors } from '../index';
import { InputEditor } from '../inputEditor';
import { AutocompleterOption, Column, ColumnEditor, EditorArguments, GridOption } from '../../interfaces/index';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index';

jest.useFakeTimers();

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
  editorTypingDebounce: 0,
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
};

const gridStub = {
  focus: jest.fn(),
  getActiveCell: jest.fn(),
  getColumns: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getHeaderRowColumn: jest.fn(),
  getOptions: () => gridOptionMock,
  render: jest.fn(),
  onBeforeEditCell: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
} as unknown as SlickGrid;

describe('InputEditor (TextEditor)', () => {
  let divContainer: HTMLDivElement;
  let editor: InputEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'title', field: 'title', editable: true, editor: { model: Editors.text }, internalColumnEditor: {} } as Column;

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
        editor = new InputEditor(null as any, 'text');
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, title: 'task 1', isActive: true };
      mockColumn = { id: 'title', field: 'title', editable: true, editor: { model: Editors.text }, internalColumnEditor: {} } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new InputEditor(editorArguments, 'text');
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-title').length;

      expect(editorCount).toBe(1);
      expect(editor.inputType).toBe('text');
    });

    it('should have an aria-label when creating the editor', () => {
      editor = new InputEditor(editorArguments, 'text');
      const editorElm = divContainer.querySelector('input.editor-text.editor-title') as HTMLInputElement;

      expect(editorElm.ariaLabel).toBe('Title Input Editor');
    });

    it('should initialize the editor and focus on the element after a small delay', () => {
      editor = new InputEditor(editorArguments, 'text');
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-title').length;

      jest.runAllTimers(); // fast-forward timer

      expect(editorCount).toBe(1);
      expect(editor.inputType).toBe('text');
    });

    it('should initialize the editor even when user define his own editor options', () => {
      (mockColumn.internalColumnEditor as ColumnEditor).editorOptions = { minLength: 3 } as AutocompleterOption;
      editor = new InputEditor(editorArguments, 'text');
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-title').length;

      expect(editorCount).toBe(1);
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      (mockColumn.internalColumnEditor as ColumnEditor).placeholder = testValue;

      editor = new InputEditor(editorArguments, 'text');
      const editorElm = divContainer.querySelector('input.editor-text.editor-title') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      (mockColumn.internalColumnEditor as ColumnEditor).title = testValue;

      editor = new InputEditor(editorArguments, 'text');
      const editorElm = divContainer.querySelector('input.editor-text.editor-title') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.internalColumnEditor = {
        placeholder: 'test placeholder',
        title: 'test title',
        alwaysSaveOnEnterKey: false,
      };

      editor = new InputEditor(editorArguments, 'text');

      expect(editor.columnEditor).toEqual(mockColumn.internalColumnEditor);
    });

    it('should call "setValue" and expect the DOM element value to be the same string when calling "getValue"', () => {
      editor = new InputEditor(editorArguments, 'text');
      editor.setValue('task 1');

      expect(editor.getValue()).toBe('task 1');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new InputEditor(editorArguments, 'text');
      editor.setValue('task 1', true);

      expect(editor.getValue()).toBe('task 1');
      expect(editorArguments.item.title).toBe('task 1');
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new InputEditor(editorArguments, 'text');
      editor.loadValue(mockItemData);
      editor.editorDomElement;

      expect(editor.getValue()).toBe('task 1');
    });

    it('should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using Left Arrow key', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
      const spyEvent = jest.spyOn(event, 'stopImmediatePropagation');

      editor = new InputEditor(editorArguments, 'text');
      const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

      editor.focus();
      editorElm.dispatchEvent(event);

      expect(gridStub.focus).toHaveBeenCalled();
      expect(spyEvent).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
    });

    it('should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using Right Arrow key', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      const spyEvent = jest.spyOn(event, 'stopImmediatePropagation');

      editor = new InputEditor(editorArguments, 'text');
      const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

      editor.focus();
      editorElm.dispatchEvent(event);

      expect(gridStub.focus).toHaveBeenCalled();
      expect(spyEvent).toHaveBeenCalled();
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched keyboard event is a new char "a"', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

        editor = new InputEditor(editorArguments, 'text');
        editor.setValue('z');
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same string number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

        editor = new InputEditor(editorArguments, 'text');
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.loadValue({ id: 1, title: 'a', isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return True when previously dispatched keyboard event as ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        (mockColumn.internalColumnEditor as ColumnEditor).alwaysSaveOnEnterKey = true;

        editor = new InputEditor(editorArguments, 'text');
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the title property when it passes validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = null as any;
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, title: 'task 2', isActive: true });
      });

      it('should apply the value to the title property with a field having dot notation (complex object) that passes validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = null as any;
        mockColumn.field = 'part.title';
        mockItemData = { id: 1, part: { title: 'task 1' }, isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, part: { title: 'task 2' }, isActive: true });
      });

      it('should return item data with an empty string in its value when it fails the custom validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = (value: any) => {
          if (value.length < 10) {
            return { valid: false, msg: 'Must be at least 10 chars long.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, title: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a string', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('task 1');
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, title: '', isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, title: null, isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'task.title';
        mockItemData = { id: 1, task: { title: 'task 1' }, isActive: true };

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('task 1');
      });
    });

    describe('save method', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        editor.setValue('task 21');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        editor.setValue('task 21');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should not call anything when the input value is empty but is required', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        (mockColumn.internalColumnEditor as ColumnEditor).required = true;
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        editor.setValue('');
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the event "focusout" is triggered', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new InputEditor(editorArguments, 'text');
        editor.loadValue(mockItemData);
        editor.setValue('task 21');
        const spySave = jest.spyOn(editor, 'save');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).Event('focusout'));
        jest.runAllTimers(); // fast-forward timer

        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).required = true;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return True when field is required and input is a valid input value', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).required = true;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is lower than a minLength defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 5;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is at least 5 character(s)' });
      });

      it('should return False when field is lower than a minLength defined using exclusive operator', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 5;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is more than 5 character(s)' });
      });

      it('should return True when field is equal to the minLength defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 4;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxLength defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 10;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
      });

      it('should return False when field is greater than a maxLength defined using exclusive operator', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 10 characters' });
      });

      it('should return True when field is equal to the maxLength defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 16;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is equal to the maxLength defined and "operatorType" is set to "inclusive"', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 16;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'inclusive';
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to the maxLength defined but "operatorType" is set to "exclusive"', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 16;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 16 characters' });
      });

      it('should return False when field is not between minLength & maxLength defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 0;
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 10;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text length is between 0 and 10 characters' });
      });

      it('should return True when field is is equal to maxLength defined when both min/max values are defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 0;
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 16;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minLength defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 4;
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 15;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'inclusive';
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxLength but "operatorType" is set to "exclusive" when both min/max lengths are defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minLength = 4;
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 16;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new InputEditor(editorArguments, 'text');
        const validation1 = editor.validate(null, 'text is 16 chars');
        const validation2 = editor.validate(null, 'text');

        expect(validation1).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
        expect(validation2).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxLength = 10;
        editor = new InputEditor(editorArguments, 'text');
        const validation = editor.validate(null, 'Task is longer than 10 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
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
      editor = new InputEditor(editorArguments, 'text');
      editor.setValue('task 1', true);

      expect(editor.getValue()).toBe('task 1');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { title: 'task 1' }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new InputEditor(editorArguments, 'text');
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

      editor = new InputEditor(editorArguments, 'text');
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { title: '' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
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

      editor = new InputEditor(editorArguments, 'text');
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).not.toHaveBeenCalled;
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
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

      editor = new InputEditor(editorArguments, 'text');
      editor.loadValue({ ...mockItemData, title: 'task 1' });
      editor.show();
      editor.disable();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      jest.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, title: 'task 2', isActive: true };

      editor = new InputEditor(editorArguments, 'text');
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 'task 2';
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('input'));

      jest.advanceTimersByTime(50);
      editor.destroy();

      expect(getCellSpy).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { title: 'task 2' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
