import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Editors } from '../index';
import { FloatEditor } from '../floatEditor';
import type { Column, Editor, EditorArguments, GridOption } from '../../interfaces/index';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index';

const containerId = 'demo-container';

vi.useFakeTimers();

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: vi.fn(),
} as unknown as SlickDataView;

const gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
  editorTypingDebounce: 0,
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
};

const gridStub = {
  focus: vi.fn(),
  getActiveCell: vi.fn(),
  getColumns: vi.fn(),
  getEditorLock: () => getEditorLockMock,
  getHeaderRowColumn: vi.fn(),
  getOptions: () => gridOptionMock,
  render: vi.fn(),
  onBeforeEditCell: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
} as unknown as SlickGrid;

describe('FloatEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: FloatEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.float }, editorClass: {} as Editor } as Column;

    editorArguments = {
      grid: gridStub,
      column: mockColumn,
      item: mockItemData,
      event: null as any,
      cancelChanges: vi.fn(),
      commitChanges: vi.fn(),
      container: divContainer,
      columnMetaData: null,
      dataView: dataViewStub,
      gridPosition: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
      position: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
    };
  });

  describe('with invalid Editor instance', () => {
    it('should throw an error when trying to call init without any arguments', () => new Promise((done: any) => {
      try {
        editor = new FloatEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    }));
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, price: 213, isActive: true };
      mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.float }, editorClass: {} as Editor } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new FloatEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-price').length;

      expect(editorCount).toBe(1);
      expect(editor.inputType).toBe('number');
    });

    it('should have an aria-label when creating the editor', () => {
      editor = new FloatEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-price') as HTMLInputElement;

      expect(editorElm.ariaLabel).toBe('Price Input Editor');
    });

    it('should initialize the editor and focus on the element after a small delay', () => {
      editor = new FloatEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-price').length;
      vi.runAllTimers(); // fast-forward timer

      expect(editorCount).toBe(1);
      expect(editor.inputType).toBe('number');
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.placeholder = testValue;

      editor = new FloatEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-price') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new FloatEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-price') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor = {
        placeholder: 'test placeholder',
        title: 'test title',
        alwaysSaveOnEnterKey: false,
      };

      editor = new FloatEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" and expect the DOM element value to be the same but as a string when calling "getValue"', () => {
      editor = new FloatEditor(editorArguments);
      editor.setValue(123);

      expect(editor.getValue()).toBe('123');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new FloatEditor(editorArguments);
      editor.setValue(123, true);

      expect(editor.getValue()).toBe('123');
      expect(editorArguments.item.price).toBe(123);
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new FloatEditor(editorArguments);
      editor.loadValue(mockItemData);

      expect(editor.getValue()).toBe('213');
    });

    ["ArrowLeft", "ArrowRight", "Home", "End"].forEach((key: string) => {
      it(`should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using ${key} key`, () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        const spyEvent = vi.spyOn(event, 'stopImmediatePropagation');

        editor = new FloatEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(spyEvent).toHaveBeenCalled();
      });
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched keyboard event is a new char 0', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true });

        editor = new FloatEditor(editorArguments);
        editor.setValue(9);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true });

        editor = new FloatEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.loadValue({ id: 1, price: 0, isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return False when previously dispatched keyboard event is same string number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true });

        editor = new FloatEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.loadValue({ id: 1, price: '0', isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return True when previously dispatched keyboard event as ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        mockColumn.editor!.alwaysSaveOnEnterKey = true;

        editor = new FloatEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-price') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the price property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, price: 456, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.applyValue(mockItemData, 78);

        expect(mockItemData).toEqual({ id: 1, price: 78, isActive: true });
      });

      it('should apply the value to the price property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 456 }, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.applyValue(mockItemData, 78);

        expect(mockItemData).toEqual({ id: 1, part: { price: 78 }, isActive: true });
      });

      it('should return item data with an empty string in its value when it fails the custom validation', () => {
        mockColumn.editor!.validator = (value: any) => {
          if (+value < 10) {
            return { valid: false, msg: 'Value must be over 10.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, price: 32, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.applyValue(mockItemData, 4);

        expect(mockItemData).toEqual({ id: 1, price: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a number', () => {
        mockItemData = { id: 1, price: 33, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces()).toBe(0);
        expect(output).toBe(33);
      });

      it('should return serialized value as a float number when "decimalPlaces" is set to 2', () => {
        mockItemData = { id: 1, price: 32.7, isActive: true };
        mockColumn.editor!.params = { decimalPlaces: 2 };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces()).toBe(2);
        expect(output).toBe(32.7);
      });

      it('should return serialized value as a number even when the item property value is a number in a string', () => {
        mockItemData = { id: 1, price: '33', isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(33);
      });

      it('should return a rounded number when a float is provided without any decimal place defined', () => {
        mockItemData = { id: 1, price: '32.7', isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces()).toBe(0);
        expect(output).toBe(33);
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, price: '', isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, price: null, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces()).toBe(0);
        expect(output).toBe('');
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 5 }, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(5);
      });
    });

    describe('getInputDecimalSteps method', () => {
      it('should return decimal step as 1 increment when decimalPlaces is not set', () => {
        mockItemData = { id: 1, price: 33, isActive: true };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);

        expect(editor.getInputDecimalSteps()).toBe('1');
      });

      it('should return decimal step as 0.1 increment when decimalPlaces is set to 1 decimal', () => {
        mockItemData = { id: 1, price: 32.7, isActive: true };
        mockColumn.editor!.params = { decimalPlaces: 1 };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);

        expect(editor.getInputDecimalSteps()).toBe('0.1');
      });

      it('should return decimal step as 0.01 increment when decimalPlaces is set to 2 decimal', () => {
        mockItemData = { id: 1, price: 32.7, isActive: true };
        mockColumn.editor!.params = { decimalPlaces: 2 };

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);

        expect(editor.getInputDecimalSteps()).toBe('0.01');
      });
    });

    describe('save method', () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = vi.spyOn(editorArguments, 'commitChanges');

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitCurrentEdit" even when the input value is not a valid float number', () => {
        mockItemData = { id: 1, price: null, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('-.');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the event "focusout" is triggered', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyGetEditor = vi.spyOn(gridStub, 'getEditorLock');
        const spyCommit = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new FloatEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        const spySave = vi.spyOn(editor, 'save');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).Event('focusout'));
        vi.runAllTimers(); // fast-forward timer

        expect(spyGetEditor).toHaveBeenCalled();
        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when field is not a valid float number', () => {
        mockColumn.editor!.required = true;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 'abc');

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number' });
      });

      it('should return False when field is lower than a minValue defined', () => {
        mockColumn.editor!.minValue = 10.2;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is greater than or equal to 10.2' });
      });

      it('should return False when field is lower than a minValue defined using exclusive operator', () => {
        mockColumn.editor!.minValue = 10.2;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is greater than 10.2' });
      });

      it('should return True when field is equal to the minValue defined', () => {
        mockColumn.editor!.minValue = 10.2;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.2);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        mockColumn.editor!.maxValue = 10.2;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.22);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is lower than or equal to 10.2' });
      });

      it('should return False when field is greater than a maxValue defined using exclusive operator', () => {
        mockColumn.editor!.maxValue = 10.2;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.22);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is lower than 10.2' });
      });

      it('should return True when field is equal to the maxValue defined', () => {
        mockColumn.editor!.maxValue = 10.2;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.2);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is equal to the maxValue defined and "operatorType" is set to "inclusive"', () => {
        mockColumn.editor!.maxValue = 10.2;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.2);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to the maxValue defined but "operatorType" is set to "exclusive"', () => {
        mockColumn.editor!.maxValue = 10.2;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.2);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is lower than 10.2' });
      });

      it('should return False when field is not between minValue & maxValue defined', () => {
        mockColumn.editor!.minValue = 10.5;
        mockColumn.editor!.maxValue = 99.5;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 99.6);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number between 10.5 and 99.5' });
      });

      it('should return True when field is is equal to maxValue defined when both min/max values are defined', () => {
        mockColumn.editor!.minValue = 10.5;
        mockColumn.editor!.maxValue = 99.5;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 99.5);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minValue defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        mockColumn.editor!.minValue = 10.5;
        mockColumn.editor!.maxValue = 99.5;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 10.5);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxValue but "operatorType" is set to "exclusive" when both min/max values are defined', () => {
        mockColumn.editor!.minValue = 10.5;
        mockColumn.editor!.maxValue = 99.5;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new FloatEditor(editorArguments);
        const validation1 = editor.validate(null, 99.5);
        const validation2 = editor.validate(null, 10.5);

        expect(validation1).toEqual({ valid: false, msg: 'Please enter a valid number between 10.5 and 99.5' });
        expect(validation2).toEqual({ valid: false, msg: 'Please enter a valid number between 10.5 and 99.5' });
      });

      it('should return False when field has more decimals than the "decimalPlaces" which is the maximum decimal allowed', () => {
        mockColumn.editor!.params = { decimalPlaces: 2 };

        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 99.6433);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number with a maximum of 2 decimals' });
      });

      it('should return True when field has less decimals than the "decimalPlaces" which is valid', () => {
        mockColumn.editor!.params = { decimalPlaces: 2 };

        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 99.6);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field has same number of decimals than the "decimalPlaces" which is also valid', () => {
        mockColumn.editor!.params = { decimalPlaces: 2 };

        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 99.65);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is required and field is a valid input value', () => {
        mockColumn.editor!.required = true;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, 2.5);

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is required and field is a valid decimal value without 0 suffix', () => {
        mockColumn.editor!.required = true;
        editor = new FloatEditor(editorArguments);
        const validation = editor.validate(null, '.5');

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
      vi.clearAllMocks();
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      editor = new FloatEditor(editorArguments);
      editor.setValue(123, true);

      expect(editor.getValue()).toBe('123');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 123 }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new FloatEditor(editorArguments);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(disableSpy).toHaveBeenCalledWith(false);
    });

    it('should call "show" and expect the DOM element to become disabled with empty value set in the form values when "onBeforeEditCell" returns false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);

      editor = new FloatEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: '' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.checked).toEqual(false);
    });

    it('should call "show" and expect the DOM element to become disabled and empty when "onBeforeEditCell" returns false and also expect "onBeforeComposite" to not be called because the value is blank', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new FloatEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = vi.spyOn(editor, 'disable');
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
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new FloatEditor(editorArguments);
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
      vi.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 35, isActive: true };

      editor = new FloatEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 35;
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('input'));

      vi.advanceTimersByTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 35 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });

    it('should expect "onCompositeEditorChange" to have been triggered by change (number spinner) with the new value showing up in its "formValues" object', () => {
      vi.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 35, isActive: true };

      editor = new FloatEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 35;
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('input'));

      vi.advanceTimersByTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 35 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });

    it('should expect "onCompositeEditorChange" to have been triggered by mouse wheel (spinner) with the new value showing up in its "formValues" object', () => {
      vi.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 35, isActive: true };

      editor = new FloatEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 35;
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('wheel'));

      vi.advanceTimersByTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 35 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
