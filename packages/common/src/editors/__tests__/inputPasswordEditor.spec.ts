import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Editors } from '../index.js';
import { InputPasswordEditor } from '../inputPasswordEditor.js';
import type { Column, Editor, EditorArguments, GridOption } from '../../interfaces/index.js';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index.js';

vi.useFakeTimers();

const containerId = 'demo-container';

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

describe('InputPasswordEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: InputPasswordEditor;
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

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, title: 'task 1', isActive: true };
      mockColumn = { id: 'title', field: 'title', editable: true, editor: { model: Editors.text }, editorClass: {} as Editor } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new InputPasswordEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-title').length;

      expect(editorCount).toBe(1);
      expect(editor.inputType).toBe('password');
    });

    it('should have an aria-label when creating the editor', () => {
      editor = new InputPasswordEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-title') as HTMLInputElement;

      expect(editorElm.ariaLabel).toBe('Title Input Editor');
    });

    it('should initialize the editor and focus on the element after a small delay', () => {
      editor = new InputPasswordEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-title').length;

      vi.runAllTimers(); // fast-forward timer

      expect(editorCount).toBe(1);
      expect(editor.inputType).toBe('password');
    });

    it('should initialize the editor even when user define his own editor options', () => {
      editor = new InputPasswordEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-title').length;

      expect(editorCount).toBe(1);
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.placeholder = testValue;

      editor = new InputPasswordEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-title') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new InputPasswordEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-title') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor = {
        placeholder: 'test placeholder',
        title: 'test title',
        alwaysSaveOnEnterKey: false,
      };

      editor = new InputPasswordEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" and expect the DOM element value to be the same string when calling "getValue"', () => {
      editor = new InputPasswordEditor(editorArguments);
      editor.setValue('task 1');

      expect(editor.getValue()).toBe('task 1');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new InputPasswordEditor(editorArguments);
      editor.setValue('task 1', true);

      expect(editor.getValue()).toBe('task 1');
      expect(editorArguments.item.title).toBe('task 1');
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new InputPasswordEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement;

      expect(editor.getValue()).toBe('task 1');
    });

    ['ArrowLeft', 'ArrowRight', 'Home', 'End'].forEach((key: string) => {
      it(`should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using ${key} key`, () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        const spyEvent = vi.spyOn(event, 'stopImmediatePropagation');

        editor = new InputPasswordEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(spyEvent).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched keyboard event is a new char "a"', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

        editor = new InputPasswordEditor(editorArguments);
        editor.setValue('z');
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same string number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

        editor = new InputPasswordEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.loadValue({ id: 1, title: 'a', isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return True when previously dispatched keyboard event as ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
        mockColumn.editor!.alwaysSaveOnEnterKey = true;

        editor = new InputPasswordEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-title') as HTMLInputElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the title property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, title: 'task 2', isActive: true });
      });

      it('should apply the value to the title property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'part.title';
        mockItemData = { id: 1, part: { title: 'task 1' }, isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, part: { title: 'task 2' }, isActive: true });
      });

      it('should return item data with an empty string in its value when it fails the custom validation', () => {
        mockColumn.editor!.validator = (value: any) => {
          if (value.length < 10) {
            return { valid: false, msg: 'Must be at least 10 chars long.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, title: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a string', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('task 1');
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, title: '', isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, title: null, isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'task.title';
        mockItemData = { id: 1, task: { title: 'task 1' }, isActive: true };

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('task 1');
      });
    });

    describe('save method', () => {
      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 21');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = vi.spyOn(editorArguments, 'commitChanges');

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 21');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should not call anything when the input value is empty but is required', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        mockColumn.editor!.required = true;
        gridOptionMock.autoCommitEdit = true;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('');
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the event "focusout" is triggered', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new InputPasswordEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 21');
        const spySave = vi.spyOn(editor, 'save');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).Event('focusout'));
        vi.runAllTimers(); // fast-forward timer

        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return True when field is required and input is a valid input value', () => {
        mockColumn.editor!.required = true;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is lower than a minLength defined', () => {
        mockColumn.editor!.minLength = 5;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is at least 5 character(s)' });
      });

      it('should return False when field is lower than a minLength defined using exclusive operator', () => {
        mockColumn.editor!.minLength = 5;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is more than 5 character(s)' });
      });

      it('should return True when field is equal to the minLength defined', () => {
        mockColumn.editor!.minLength = 4;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxLength defined', () => {
        mockColumn.editor!.maxLength = 10;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
      });

      it('should return False when field is greater than a maxLength defined using exclusive operator', () => {
        mockColumn.editor!.maxLength = 10;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 10 characters' });
      });

      it('should return True when field is equal to the maxLength defined', () => {
        mockColumn.editor!.maxLength = 16;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is equal to the maxLength defined and "operatorType" is set to "inclusive"', () => {
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to the maxLength defined but "operatorType" is set to "exclusive"', () => {
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 16 characters' });
      });

      it('should return False when field is not between minLength & maxLength defined', () => {
        mockColumn.editor!.minLength = 0;
        mockColumn.editor!.maxLength = 10;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text length is between 0 and 10 characters' });
      });

      it('should return True when field is is equal to maxLength defined when both min/max values are defined', () => {
        mockColumn.editor!.minLength = 0;
        mockColumn.editor!.maxLength = 16;
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minLength defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        mockColumn.editor!.minLength = 4;
        mockColumn.editor!.maxLength = 15;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new InputPasswordEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxLength but "operatorType" is set to "exclusive" when both min/max lengths are defined', () => {
        mockColumn.editor!.minLength = 4;
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new InputPasswordEditor(editorArguments);
        const validation1 = editor.validate(null, 'text is 16 chars');
        const validation2 = editor.validate(null, 'text');

        expect(validation1).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
        expect(validation2).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        mockColumn.editor!.maxLength = 10;
        editor = new InputPasswordEditor(editorArguments);
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
        isCompositeEditor: true,
      } as EditorArguments;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      editor = new InputPasswordEditor(editorArguments);
      editor.setValue('task 1', true);

      expect(editor.getValue()).toBe('task 1');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith(
        {
          ...activeCellMock,
          column: mockColumn,
          item: mockItemData,
          grid: gridStub,
          formValues: { title: 'task 1' },
          editors: {},
          triggeredBy: 'system',
        },
        expect.anything()
      );
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined,
      } as any);

      editor = new InputPasswordEditor(editorArguments);
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

      editor = new InputPasswordEditor(editorArguments);
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
          formValues: { title: '' },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should call "show" and expect the DOM element to become disabled and empty when "onBeforeEditCell" returns false and also expect "onBeforeComposite" to not be called because the value is blank', () => {
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

      editor = new InputPasswordEditor(editorArguments);
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
      expect(onCompositeEditorSpy).not.toHaveBeenCalled;
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should call "disable" method and expect the DOM element to become disabled and have an empty formValues be passed in the onCompositeEditorChange event', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true,
      };

      editor = new InputPasswordEditor(editorArguments);
      editor.loadValue({ ...mockItemData, title: 'task 1' });
      editor.show();
      editor.disable();

      expect(getCellSpy).toHaveBeenCalled();
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
      expect(editor.editorDomElement.disabled).toEqual(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
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
      mockItemData = { id: 1, title: 'task 2', isActive: true };

      editor = new InputPasswordEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.editorDomElement.value = 'task 2';
      editor.editorDomElement.dispatchEvent(new (window.window as any).Event('input'));

      vi.advanceTimersByTime(50);
      editor.destroy();

      expect(getCellSpy).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
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
          formValues: { title: 'task 2' },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
    });
  });
});
