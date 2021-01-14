import { Editors } from '../index';
import { IntegerEditor } from '../integerEditor';
import { KeyCode } from '../../enums/index';
import { Column, ColumnEditor, EditorArguments, GridOption, SlickDataView, SlickGrid, SlickNamespace } from '../../interfaces/index';

declare const Slick: SlickNamespace;
const KEY_CHAR_0 = 48;
const containerId = 'demo-container';

jest.useFakeTimers();

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
  getActiveCell: jest.fn(),
  getColumns: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getHeaderRowColumn: jest.fn(),
  getOptions: () => gridOptionMock,
  render: jest.fn(),
  onBeforeEditCell: new Slick.Event(),
  onCompositeEditorChange: new Slick.Event(),
} as unknown as SlickGrid;

describe('IntegerEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: IntegerEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.integer }, internalColumnEditor: {} } as Column;

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
        editor = new IntegerEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, price: 213, isActive: true };
      mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.integer }, internalColumnEditor: {} } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new IntegerEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-price').length;
      expect(editorCount).toBe(1);
    });

    it('should initialize the editor and focus on the element after a small delay', () => {
      editor = new IntegerEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-price').length;

      jest.runAllTimers(); // fast-forward timer

      expect(editorCount).toBe(1);
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      (mockColumn.internalColumnEditor as ColumnEditor).placeholder = testValue;

      editor = new IntegerEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-price') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      (mockColumn.internalColumnEditor as ColumnEditor).title = testValue;

      editor = new IntegerEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-price') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.internalColumnEditor = {
        placeholder: 'test placeholder',
        title: 'test title',
        alwaysSaveOnEnterKey: false,
      };

      editor = new IntegerEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.internalColumnEditor);
    });

    it('should call "setValue" and expect the DOM element value to be the same but as a string when calling "getValue"', () => {
      editor = new IntegerEditor(editorArguments);
      editor.setValue(123);

      expect(editor.getValue()).toBe('123');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new IntegerEditor(editorArguments);
      editor.setValue(123, true);

      expect(editor.getValue()).toBe('123');
      expect(editorArguments.item.price).toBe(123);
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new IntegerEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement;

      expect(editor.getValue()).toBe('213');
    });

    it('should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using Left Arrow key', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { keyCode: KeyCode.LEFT, bubbles: true, cancelable: true });
      const spyEvent = jest.spyOn(event, 'stopImmediatePropagation');

      editor = new IntegerEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

      editor.focus();
      editorElm.dispatchEvent(event);

      expect(spyEvent).toHaveBeenCalled();
    });

    it('should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using Right Arrow key', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { keyCode: KeyCode.RIGHT, bubbles: true, cancelable: true });
      const spyEvent = jest.spyOn(event, 'stopImmediatePropagation');

      editor = new IntegerEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

      editor.focus();
      editorElm.dispatchEvent(event);

      expect(spyEvent).toHaveBeenCalled();
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched keyboard event is a new char 0', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { keyCode: KEY_CHAR_0, bubbles: true, cancelable: true });

        editor = new IntegerEditor(editorArguments);
        editor.setValue(9);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { keyCode: KEY_CHAR_0, bubbles: true, cancelable: true });

        editor = new IntegerEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.loadValue({ id: 1, price: 0, isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return False when previously dispatched keyboard event is same string number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { keyCode: KEY_CHAR_0, bubbles: true, cancelable: true });

        editor = new IntegerEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.loadValue({ id: 1, price: '0', isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return True when previously dispatched keyboard event as ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { keyCode: KeyCode.ENTER, bubbles: true, cancelable: true });
        (mockColumn.internalColumnEditor as ColumnEditor).alwaysSaveOnEnterKey = true;

        editor = new IntegerEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the price property when it passes validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = null as any;
        mockItemData = { id: 1, price: 456, isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.applyValue(mockItemData, 78);

        expect(mockItemData).toEqual({ id: 1, price: 78, isActive: true });
      });

      it('should apply the value to the price property with a field having dot notation (complex object) that passes validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = null as any;
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 456 }, isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.applyValue(mockItemData, 78);

        expect(mockItemData).toEqual({ id: 1, part: { price: 78 }, isActive: true });
      });

      it('should return item data with an empty string in its value when it fails the custom validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = (value: any) => {
          if (+value < 10) {
            return { valid: false, msg: 'Value must be over 10.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, price: 32, isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.applyValue(mockItemData, 4);

        expect(mockItemData).toEqual({ id: 1, price: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a number', () => {
        mockItemData = { id: 1, price: 32, isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(32);
      });

      it('should return serialized value as a number even when the item property value is a number in a string', () => {
        mockItemData = { id: 1, price: '32', isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(32);
      });

      it('should return only the left side of the number (not rounded) when a float is provided', () => {
        mockItemData = { id: 1, price: '32.7', isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(32);
      });

      it('should return original item value when this value cannot be parsed', () => {
        mockItemData = { id: 1, price: '.2', isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('.2');
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, price: '', isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, price: null, isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 5 }, isActive: true };

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(5);
      });
    });

    describe('save method', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should not call anything when the input value is not a valid integer', () => {
        mockItemData = { id: 1, price: '.1', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('.2');
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the event "focusout" is triggered', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new IntegerEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
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
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when field is not a valid integer', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).required = true;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, '.2');

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number' });
      });

      it('should return False when field is lower than a minValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 3);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number that is greater than or equal to 10' });
      });

      it('should return False when field is lower than a minValue defined using exclusive operator', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 3);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number that is greater than 10' });
      });

      it('should return True when field is equal to the minValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 9;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 9);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 10;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 33);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number that is lower than or equal to 10' });
      });

      it('should return False when field is greater than a maxValue defined using exclusive operator', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 33);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number that is lower than 10' });
      });

      it('should return True when field is equal to the maxValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 99;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 99);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is equal to the maxValue defined and "operatorType" is set to "inclusive"', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 9;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'inclusive';
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 9);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to the maxValue defined but "operatorType" is set to "exclusive"', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 9;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 9);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number that is lower than 9' });
      });

      it('should return False when field is not between minValue & maxValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 99;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 345);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number between 10 and 99' });
      });

      it('should return True when field is is equal to maxValue defined when both min/max values are defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 89;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 89);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minValue defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 89;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'inclusive';
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 10);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxValue but "operatorType" is set to "exclusive" when both min/max values are defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 89;
        (mockColumn.internalColumnEditor as ColumnEditor).operatorConditionalType = 'exclusive';
        editor = new IntegerEditor(editorArguments);
        const validation1 = editor.validate(null, 89);
        const validation2 = editor.validate(null, 10);

        expect(validation1).toEqual({ valid: false, msg: 'Please enter a valid integer number between 10 and 89' });
        expect(validation2).toEqual({ valid: false, msg: 'Please enter a valid integer number between 10 and 89' });
      });

      it('should return True when field is required and field is a valid input value', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).required = true;
        editor = new IntegerEditor(editorArguments);
        const validation = editor.validate(null, 2);

        expect(validation).toEqual({ valid: true, msg: '' });
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
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      editor = new IntegerEditor(editorArguments);
      editor.setValue(123, true);

      expect(editor.getValue()).toBe('123');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 123 }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(undefined);

      editor = new IntegerEditor(editorArguments);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(disableSpy).toHaveBeenCalledWith(false);
    });

    it('should call "show" and expect the DOM element to become disabled with empty value set in the form values when "onBeforeEditCell" returns false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(false);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);

      editor = new IntegerEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: '' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should call "disable" method and expect the DOM element to become disabled and have an empty formValues be passed in the onCompositeEditorChange event', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new IntegerEditor(editorArguments);
      editor.loadValue({ ...mockItemData, price: 213 });
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

    it('should call "disable" method and expect the DOM element to become disabled and have an empty formValues be passed in the onCompositeEditorChange event', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new IntegerEditor(editorArguments);
      editor.loadValue({ ...mockItemData, price: 213 });
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

    it('should expect "onCompositeEditorChange" to have been triggered by input change with the new value showing up in its "formValues" object', () => {
      jest.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(undefined);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 35, isActive: true };

      editor = new IntegerEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 35;
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('input'));

      jest.runTimersToTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 35 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });

    it('should expect "onCompositeEditorChange" to have been triggered by by mouse wheel (spinner) with the new value showing up in its "formValues" object', () => {
      jest.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(undefined);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 35, isActive: true };

      editor = new IntegerEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 35;
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('wheel'));

      jest.runTimersToTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 35 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
