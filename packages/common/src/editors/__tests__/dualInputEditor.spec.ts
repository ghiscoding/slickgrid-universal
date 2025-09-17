import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Editors } from '../index.js';
import { DualInputEditor } from '../dualInputEditor.js';
import type { Column, ColumnEditorDualInput, Editor, EditorArguments, GridOption } from '../../interfaces/index.js';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index.js';

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
  onValidationError: new SlickEvent(),
  onBeforeEditCell: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
} as unknown as SlickGrid;

describe('DualInputEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: DualInputEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'title', field: 'title', editable: true, editor: { model: Editors.text }, editorClass: {} as Editor } as Column;

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
    it('should throw an error when initialize the editor without the requires params leftInput/rightInput', () =>
      new Promise((done: any) => {
        try {
          editor = new DualInputEditor({ grid: gridStub } as any);
        } catch (e: any) {
          expect(e.toString()).toContain(
            `[Slickgrid-Universal] Please make sure that your Combo Input Editor has params defined with "leftInput" and "rightInput"`
          );
          done();
        }
      }));
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      const editorParams = { leftInput: { field: 'from', type: 'float' }, rightInput: { field: 'to', type: 'float' } } as ColumnEditorDualInput;
      mockItemData = { id: 1, from: 1, to: 22, isActive: true };
      mockColumn = {
        id: 'range',
        field: 'range',
        editable: true,
        editor: { model: Editors.dualInput, params: editorParams },
      } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor?.destroy();
    });

    it('should initialize the editor', () => {
      editor = new DualInputEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.dual-editor-text.editor-range').length;
      expect(editorCount).toBe(2);
    });

    it('should have an aria-label when creating the editor', () => {
      editor = new DualInputEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.dual-editor-text.editor-range.left') as HTMLInputElement;

      expect(editorElm.ariaLabel).toBe('Range Input Editor');
    });

    it('should have a placeholder on the left input when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.params.leftInput.placeholder = testValue;

      editor = new DualInputEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.dual-editor-text.editor-range.left') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a placeholder on the right input when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.params.rightInput.placeholder = testValue;

      editor = new DualInputEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.dual-editor-text.editor-range.right') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) on left input when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.params.leftInput.title = testValue;

      editor = new DualInputEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.dual-editor-text.editor-range.left') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should have a title (tooltip) on right input when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.params.rightInput.title = testValue;

      editor = new DualInputEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.dual-editor-text.editor-range.right') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should have a left input as type number and right input as readonly text input when that right input is set to "readonly"', () => {
      mockColumn.editor!.params.leftInput.type = 'float';
      mockColumn.editor!.params.rightInput.type = 'readonly';

      editor = new DualInputEditor(editorArguments);
      const editorLeftElm = divContainer.querySelector('input.dual-editor-text.editor-range.left') as HTMLInputElement;
      const editorRightElm = divContainer.querySelector('input.dual-editor-text.editor-range.right') as HTMLInputElement;

      expect(editorLeftElm.type).toBe('number');
      expect(editorRightElm.type).toBe('text');
      expect(editorLeftElm.readOnly).toBe(false);
      expect(editorRightElm.readOnly).toBe(true);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor!.params = {
        leftInput: {
          field: 'from',
          placeholder: 'test placeholder',
          range: 'test title',
          alwaysSaveOnEnterKey: false,
        },
        rightInput: {
          field: 'to',
        },
      };

      editor = new DualInputEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" and expect the DOM element value to be the same string when calling "getValue"', () => {
      editor = new DualInputEditor(editorArguments);
      editor.setValues([12, 34]);

      expect(editor.getValues()).toEqual({ from: 12, to: 34 });
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new DualInputEditor(editorArguments);
      editor.loadValue(mockItemData);
      const editorElm = editor.editorDomElement;

      expect(editorElm).toBeTruthy();
      expect(editor.getValues()).toEqual({ from: 1, to: 22 });
    });

    ['ArrowLeft', 'ArrowRight', 'Home', 'End'].forEach((key: string) => {
      it(`should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using ${key} key`, () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        const spyEvent = vi.spyOn(event, 'stopImmediatePropagation');

        editor = new DualInputEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-range') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(spyEvent).toHaveBeenCalled();
      });
    });

    describe('isValueChanged method (and isValueTouched method will always true for all since we trigger events in all)', () => {
      it('should return True when previously dispatched keyboard event is a new char 0', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true });

        editor = new DualInputEditor(editorArguments);
        editor.setValues(['9', '9']);
        const editorElm = divContainer.querySelector('input.editor-range') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true });

        editor = new DualInputEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-range') as HTMLInputElement;

        editor.loadValue({ id: 1, range: '1-22', from: 0, to: 22, isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same string number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true });

        editor = new DualInputEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-range') as HTMLInputElement;

        editor.loadValue({ id: 1, range: '1-22', from: '0', to: '22', isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(false);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return True when left input last dispatched keyboard event is ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        mockColumn.editor!.params.leftInput.alwaysSaveOnEnterKey = true;

        editor = new DualInputEditor(editorArguments);
        const editorLeftElm = divContainer.querySelector('input.editor-range.left') as HTMLInputElement;

        editor.focus();
        editorLeftElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return True when right input last dispatched keyboard event is ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        mockColumn.editor!.params.rightInput.alwaysSaveOnEnterKey = true;

        editor = new DualInputEditor(editorArguments);
        const editorRightElm = divContainer.querySelector('input.editor-range.right') as HTMLInputElement;

        editor.focus();
        editorRightElm.dispatchEvent(event);

        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the range property when it passes validation', () => {
        mockColumn.editor!.params.leftInput.validator = null;
        mockItemData = { id: 1, range: '1-22', from: 0, to: 22, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.applyValue(mockItemData, { id: 1, from: 33, to: 78 });

        expect(mockItemData).toEqual({ id: 1, range: '1-22', from: 33, to: 78, isActive: true });
      });

      it('should apply the value to the range property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.params.leftInput.validator = null;
        mockColumn.field = 'part.from';
        mockColumn.editor!.params.leftInput.field = 'part.from';
        mockColumn.editor!.params.rightInput.field = 'part.to';
        mockItemData = { id: 1, part: { range: '1-22', from: 0, to: 44 }, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.applyValue(mockItemData, { id: 1, range: '1-22', from: 33, to: 78 });

        expect(mockItemData).toEqual({ id: 1, part: { range: '1-22', from: 33, to: 78 }, isActive: true });
      });

      it('should return item data with an empty string in its left input value when it fails the custom validation', () => {
        mockColumn.editor!.params.leftInput.validator = (value: any) => {
          if (+value < 10) {
            return { valid: false, msg: 'From value must be over 10.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, range: '1-22', from: 22, to: 78, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.applyValue(mockItemData, { id: 1, range: '1-22', from: 4, to: 5 });

        expect(mockItemData).toEqual({ id: 1, range: '1-22', from: '', to: 5, isActive: true });
      });

      it('should return item data with an empty string in its right input value when it fails the custom validation', () => {
        mockColumn.editor!.params.rightInput.validator = (value: any) => {
          if (+value > 150) {
            return { valid: false, msg: 'To value must be below 150.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, range: '1-22', from: 22, to: 78, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.applyValue(mockItemData, { id: 1, range: '1-22', from: 4, to: 155 });

        expect(mockItemData).toEqual({ id: 1, range: '1-22', from: 4, to: '', isActive: true });
      });

      it('should return item data with an empty strings when the shared validator fails the custom validation', () => {
        mockColumn.editor!.validator = (values: any) => {
          if (values.from < 10 || values.to > 200) {
            return { valid: false, msg: '"From" value must be over 10 and "To" value below 200.' };
          }
          return { valid: true, msg: '' };
        };

        mockItemData = { id: 1, range: '1-22', from: 22, to: 78, isActive: true };
        editor = new DualInputEditor(editorArguments);
        const validateSpy = vi.spyOn(editor, 'validate');

        editor.setValues([4, 5]);
        editor.applyValue(mockItemData, { id: 1, range: '1-22', from: 4, to: 5 });

        expect(mockItemData).toEqual({ id: 1, range: '1-22', from: '', to: '', isActive: true });
        expect(validateSpy).toHaveReturnedWith({ valid: false, msg: '"From" value must be over 10 and "To" value below 200.' });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a number', () => {
        mockItemData = { id: 1, range: '13-22', from: 13, to: 22, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces('leftInput')).toBe(0);
        expect(editor.getDecimalPlaces('rightInput')).toBe(0);
        expect(output).toEqual({ from: 13, to: 22 });
      });

      it('should return serialized value as a float number when "decimal" is set to 2', () => {
        mockItemData = { id: 1, range: '32.789-45.67', from: 32.789, to: 45.67, isActive: true };
        mockColumn.editor!.params.leftInput.decimal = 1;
        mockColumn.editor!.params.rightInput.decimal = 3;

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces('leftInput')).toBe(1);
        expect(editor.getDecimalPlaces('rightInput')).toBe(3);
        expect(output).toEqual({ from: 32.8, to: 45.67 });
      });

      it('should return serialized value as a number even when the item property value is a number in a string', () => {
        mockItemData = { id: 1, range: '1-33', from: '1', to: '33', isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces('leftInput')).toBe(0);
        expect(editor.getDecimalPlaces('rightInput')).toBe(0);
        expect(output).toEqual({ from: 1, to: 33 });
      });

      it('should return a rounded number when a float is provided without any decimal place defined', () => {
        mockItemData = { id: 1, range: '2-32.7', from: '2', to: '32.7', isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces('leftInput')).toBe(0);
        expect(editor.getDecimalPlaces('rightInput')).toBe(0);
        expect(output).toEqual({ from: 2, to: 33 });
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, range: '', from: '', to: 2, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces('leftInput')).toBe(0);
        expect(editor.getDecimalPlaces('rightInput')).toBe(0);
        expect(output).toEqual({ from: '', to: 2 });
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, range: null, from: null, to: 2, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(editor.getDecimalPlaces('leftInput')).toBe(0);
        expect(editor.getDecimalPlaces('rightInput')).toBe(0);
        expect(output).toEqual({ from: '', to: 2 });
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'part.from';
        mockColumn.editor!.params.leftInput.field = 'part.from';
        mockColumn.editor!.params.rightInput.field = 'part.to';
        mockItemData = { id: 1, part: { range: '5-44', from: 5, to: 44 }, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual({ part: { from: 5, to: 44 } });
      });
    });

    describe('getInputDecimalSteps method', () => {
      it('should return decimal step as 1 increment when decimal is not set', () => {
        mockItemData = { id: 1, range: '2-33', from: 2, to: 33, isActive: true };

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);

        expect(editor.getInputDecimalSteps('leftInput')).toBe('1');
        expect(editor.getInputDecimalSteps('rightInput')).toBe('1');
      });

      it('should return decimal step as 0.1 increment when decimal is set to 1 decimal', () => {
        mockItemData = { id: 1, range: '2-32.7', from: 2, to: 32.7, isActive: true };
        mockColumn.editor!.params.leftInput.decimal = 1;
        mockColumn.editor!.params.rightInput.decimal = 2;

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);

        expect(editor.getInputDecimalSteps('leftInput')).toBe('0.1');
        expect(editor.getInputDecimalSteps('rightInput')).toBe('0.01');
      });

      it('should return decimal step as 0.01 increment when decimal is set to 2 decimal', () => {
        mockItemData = { id: 1, range: '2-32.7', from: 2, to: 32.7, isActive: true };
        mockColumn.editor!.params.leftInput.decimal = 1;
        mockColumn.editor!.params.rightInput.decimal = 2;

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);

        expect(editor.getInputDecimalSteps('leftInput')).toBe('0.1');
        expect(editor.getInputDecimalSteps('rightInput')).toBe('0.01');
      });
    });

    describe('save method', () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, range: '3-32', from: 3, to: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValues([2, 35]);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, range: '3-32', from: 3, to: 32, isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = vi.spyOn(editorArguments, 'commitChanges');

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValues([2, 35]);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      // it('should not call anything when the input value is not a valid float number', () => {
      //   mockItemData = { id: 1, range: null, from: null, to: null, isActive: true };
      //   gridOptionMock.autoCommitEdit = true;
      //   const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

      //   editor = new DualInputEditor(editorArguments);
      //   editor.loadValue(mockItemData);
      //   editor.setValue(['-.', '-.']);
      //   editor.save();

      //   expect(spy).not.toHaveBeenCalled();
      // });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the left input event "focusout" is triggered', () => {
        mockItemData = { id: 1, range: '3-32', from: 3, to: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyGetEditor = vi.spyOn(gridStub, 'getEditorLock');
        const spyCommit = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValues([2, 35]);
        const spySave = vi.spyOn(editor, 'save');
        const editorLeftElm = editor.editorDomElement.leftInput;

        editorLeftElm.dispatchEvent(new (window.window as any).Event('focusout'));
        vi.runAllTimers(); // fast-forward timer

        expect(spyGetEditor).toHaveBeenCalled();
        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
      });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the right input event "focusout" is triggered', () => {
        mockItemData = { id: 1, range: '3-32', from: 3, to: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyGetEditor = vi.spyOn(gridStub, 'getEditorLock');
        const spyCommit = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new DualInputEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValues([2, 35]);
        const spySave = vi.spyOn(editor, 'save');
        const editorRightElm = editor.editorDomElement.rightInput;

        editorRightElm.dispatchEvent(new (window.window as any).Event('focusout'));
        vi.runAllTimers(); // fast-forward timer

        expect(spyGetEditor).toHaveBeenCalled();
        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should set isValueSaveCalled to true when grid object triggered an "onValidationError"', () => {
        editor = new DualInputEditor(editorArguments);
        vi.spyOn(editor.eventHandler, 'subscribe');

        expect(editor.eventHandler).toBeTruthy();
        expect(editor.isValueSaveCalled).toBe(false);
        gridStub.onValidationError.notify({
          row: 0,
          cell: 0,
          validationResults: { valid: false, msg: 'Field is required' },
          grid: gridStub,
          column: {} as Column,
          editor,
          cellNode: document.createElement('div'),
        } as any);
        expect(editor.isValueSaveCalled).toBe(true);
      });

      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.params.leftInput.required = true;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: '' });

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when left input field is required and its value is empty when set by "setValues"', () => {
        mockColumn.editor!.params.leftInput.required = true;
        editor = new DualInputEditor(editorArguments);
        editor.setValues(['', 3]);
        const validation = editor.validate(null);

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when left input field is required and its value is empty when set by "setValues"', () => {
        mockColumn.editor!.params.rightInput.required = true;
        editor = new DualInputEditor(editorArguments);
        editor.setValues([2, '']);
        const validation = editor.validate(null);

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when editor is float but its field is not a valid float number', () => {
        mockColumn.editor!.params.rightInput.required = true;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 'abc' });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number' });
      });

      it('should return False when editor is integer but its field is not a valid integer number', () => {
        mockColumn.editor!.params.rightInput.type = 'integer';
        mockColumn.editor!.params.rightInput.required = true;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 'abc' });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number' });
      });

      it('should return False when editor is a required text input but its text value is not provided', () => {
        mockColumn.editor!.params.rightInput.type = 'text';
        mockColumn.editor!.params.rightInput.required = true;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: '' });

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when editor is a required password input but its text value is not provided', () => {
        mockColumn.editor!.params.rightInput.type = 'password';
        mockColumn.editor!.params.rightInput.required = true;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: '' });

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when field is lower than a minValue defined', () => {
        mockColumn.editor!.params.leftInput.minValue = 10.2;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 10 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is greater than or equal to 10.2' });
      });

      it('should return False when field is lower than a minValue defined using exclusive operator', () => {
        mockColumn.editor!.params.leftInput.minValue = 10.2;
        mockColumn.editor!.params.leftInput.operatorConditionalType = 'exclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 10 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is greater than 10.2' });
      });

      it('should return True when field is equal to the minValue defined', () => {
        mockColumn.editor!.params.rightInput.minValue = 10.2;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 10.2 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        mockColumn.editor!.params.leftInput.maxValue = 10.2;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 10.22 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is lower than or equal to 10.2' });
      });

      it('should return False when field is greater than a maxValue defined using exclusive operator', () => {
        mockColumn.editor!.params.leftInput.maxValue = 10.2;
        mockColumn.editor!.params.leftInput.operatorConditionalType = 'exclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 10.22 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is lower than 10.2' });
      });

      it('should return True when field is equal to the maxValue defined', () => {
        mockColumn.editor!.params.rightInput.type = 'float';
        mockColumn.editor!.params.rightInput.maxValue = 10.2;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 10.2 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when type is set to float and its field is equal to the maxValue defined and "operatorType" is set to "inclusive"', () => {
        mockColumn.editor!.params.rightInput.type = 'float';
        mockColumn.editor!.params.leftInput.maxValue = 10.2;
        mockColumn.editor!.params.leftInput.operatorConditionalType = 'inclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 10.2 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when type is set to integer and its field is equal to the maxValue defined and "operatorType" is set to "inclusive"', () => {
        mockColumn.editor!.params.leftInput.type = 'integer';
        mockColumn.editor!.params.leftInput.maxValue = 11;
        mockColumn.editor!.params.leftInput.operatorConditionalType = 'inclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 11 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when type is set to float and its field is equal to the maxValue defined but "operatorType" is set to "exclusive"', () => {
        mockColumn.editor!.params.rightInput.type = 'float';
        mockColumn.editor!.params.rightInput.maxValue = 10.2;
        mockColumn.editor!.params.rightInput.operatorConditionalType = 'exclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 10.2 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number that is lower than 10.2' });
      });

      it('should return False when type is set to float and its field is equal to the maxValue defined but "operatorType" is set to "exclusive"', () => {
        mockColumn.editor!.params.rightInput.type = 'integer';
        mockColumn.editor!.params.rightInput.maxValue = 11;
        mockColumn.editor!.params.rightInput.operatorConditionalType = 'exclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 11 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number that is lower than 11' });
      });

      it('should return False when type is set to float and its field is not between minValue & maxValue defined', () => {
        mockColumn.editor!.params.leftInput.minValue = 10.5;
        mockColumn.editor!.params.leftInput.maxValue = 99.5;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 99.6 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number between 10.5 and 99.5' });
      });

      it('should return False when type is set to integer and its field is not between minValue & maxValue defined', () => {
        mockColumn.editor!.params.leftInput.type = 'integer';
        mockColumn.editor!.params.leftInput.minValue = 11;
        mockColumn.editor!.params.leftInput.maxValue = 99;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 100 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid integer number between 11 and 99' });
      });

      it('should return True when field is is equal to maxValue defined when both min/max values are defined', () => {
        mockColumn.editor!.params.rightInput.minValue = 10.5;
        mockColumn.editor!.params.rightInput.maxValue = 99.5;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 99.5 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minValue defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        mockColumn.editor!.params.leftInput.minValue = 10.5;
        mockColumn.editor!.params.leftInput.maxValue = 99.5;
        mockColumn.editor!.params.leftInput.operatorConditionalType = 'inclusive';
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 10.5 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxValue but "operatorType" is set to "exclusive" when both min/max values are defined', () => {
        mockColumn.editor!.params.rightInput.minValue = 10.5;
        mockColumn.editor!.params.rightInput.maxValue = 99.5;
        mockColumn.editor!.params.rightInput.operatorConditionalType = 'exclusive';
        editor = new DualInputEditor(editorArguments);
        const validation1 = editor.validate(null, { position: 'rightInput', inputValue: 99.5 });
        const validation2 = editor.validate(null, { position: 'rightInput', inputValue: 10.5 });

        expect(validation1).toEqual({ valid: false, msg: 'Please enter a valid number between 10.5 and 99.5' });
        expect(validation2).toEqual({ valid: false, msg: 'Please enter a valid number between 10.5 and 99.5' });
      });

      it('should return False when field has more decimals than the "decimal" which is the maximum decimal allowed', () => {
        mockColumn.editor!.params.leftInput.decimal = 2;

        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 99.6433 });

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number with a maximum of 2 decimals' });
      });

      it('should return True when field has less decimals than the "decimal" which is valid', () => {
        mockColumn.editor!.params.rightInput.decimal = 2;

        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'rightInput', inputValue: 99.6 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field has same number of decimals than the "decimal" which is also valid', () => {
        mockColumn.editor!.params.leftInput.decimal = 2;

        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 99.65 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is required and field is a valid input value', () => {
        mockColumn.editor!.params.rightInput.required = true;
        editor = new DualInputEditor(editorArguments);
        const validation = editor.validate(null, { position: 'leftInput', inputValue: 2.5 });

        expect(validation).toEqual({ valid: true, msg: '' });
      });
    });
  });

  describe('with Composite Editor', () => {
    beforeEach(() => {
      editorArguments = {
        ...editorArguments,
        compositeEditorOptions: { headerTitle: 'Test', modalType: 'edit', formValues: {}, editors: {} },
        isCompositeEditor: true,
      } as EditorArguments;

      const editorParams = { leftInput: { field: 'from', type: 'float' }, rightInput: { field: 'to', type: 'float' } } as ColumnEditorDualInput;
      mockItemData = { id: 1, from: 1, to: 22, isActive: true };
      mockColumn = {
        id: 'range',
        field: 'range',
        editable: true,
        editor: { model: Editors.dualInput, params: editorParams },
      } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined,
      } as any);

      editor = new DualInputEditor(editorArguments);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({
        ...activeCellMock,
        column: mockColumn,
        item: mockItemData,
        grid: gridStub,
        target: 'composite',
        compositeEditorOptions: editorArguments.compositeEditorOptions,
      });
      expect(disableSpy).toHaveBeenCalledWith(false);
    });

    it('should call "show" and expect the DOM element to become disabled with empty value set in the form values when "onBeforeEditCell" returns false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);

      editor = new DualInputEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({
        ...activeCellMock,
        column: mockColumn,
        item: mockItemData,
        grid: gridStub,
        target: 'composite',
        compositeEditorOptions: editorArguments.compositeEditorOptions,
      });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith(
        {
          ...activeCellMock,
          column: mockColumn,
          item: mockItemData,
          grid: gridStub,
          formValues: { from: '', to: '' },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.leftInput.disabled).toEqual(true);
      expect(editor.editorDomElement.rightInput.disabled).toEqual(true);
      expect(editor.editorDomElement.leftInput.value).toEqual('');
      expect(editor.editorDomElement.rightInput.value).toEqual('');
    });

    it('should call "show" and expect the DOM element to become disabled and empty when "onBeforeEditCell" returns false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true,
      };

      editor = new DualInputEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({
        ...activeCellMock,
        column: mockColumn,
        item: mockItemData,
        grid: gridStub,
        target: 'composite',
        compositeEditorOptions: editorArguments.compositeEditorOptions,
      });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith(
        {
          ...activeCellMock,
          column: mockColumn,
          item: mockItemData,
          grid: gridStub,
          formValues: {},
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.leftInput.disabled).toEqual(true);
      expect(editor.editorDomElement.rightInput.disabled).toEqual(true);
      expect(editor.editorDomElement.leftInput.value).toEqual('');
      expect(editor.editorDomElement.rightInput.value).toEqual('');
    });

    it('should expect "onCompositeEditorChange" to have been triggered from the left input and expect the new value showing up in its "formValues" object', () => {
      vi.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined,
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, from: 4, to: 5, isActive: true };

      editor = new DualInputEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValues([4, 5]);
      editor.editorDomElement.leftInput.dispatchEvent(new (window.window as any).Event('input'));

      vi.advanceTimersByTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({
        ...activeCellMock,
        column: mockColumn,
        item: mockItemData,
        grid: gridStub,
        target: 'composite',
        compositeEditorOptions: editorArguments.compositeEditorOptions,
      });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith(
        {
          ...activeCellMock,
          column: mockColumn,
          item: mockItemData,
          grid: gridStub,
          formValues: { from: 4, to: 5 },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
    });

    it('should expect "onCompositeEditorChange" to have been triggered from the right input and expect the new value showing up in its "formValues" object', () => {
      vi.useFakeTimers();
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined,
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, from: 4, to: 5, isActive: true };

      editor = new DualInputEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValues([4, 5]);
      editor.editorDomElement.rightInput.dispatchEvent(new (window.window as any).Event('input'));

      vi.advanceTimersByTime(50);
      editor.destroy();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({
        ...activeCellMock,
        column: mockColumn,
        item: mockItemData,
        grid: gridStub,
        target: 'composite',
        compositeEditorOptions: editorArguments.compositeEditorOptions,
      });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith(
        {
          ...activeCellMock,
          column: mockColumn,
          item: mockItemData,
          grid: gridStub,
          formValues: { from: 4, to: 5 },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
    });
  });
});
