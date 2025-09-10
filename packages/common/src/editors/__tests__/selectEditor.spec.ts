import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// import 3rd party lib multiple-select for the tests
import 'multiple-select-vanilla';
import type { MultipleSelectOption } from 'multiple-select-vanilla';

import { SlickEvent, type SlickDataView } from '../../core/index.js';
import { Editors } from '../index.js';
import { SelectEditor } from '../selectEditor.js';
import { FieldType, OperatorType } from '../../enums/index.js';
import type { Column, Editor, EditorArguments, GridOption } from '../../interfaces/index.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { type SlickGrid } from '../../core/index.js';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: vi.fn(),
} as unknown as SlickDataView;

const gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
  translater: null as any,
} as unknown as GridOption;

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
  navigateNext: vi.fn(),
  navigatePrev: vi.fn(),
  render: vi.fn(),
  onBeforeEditCell: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
  sanitizeHtmlString: (str: string) => str,
} as unknown as SlickGrid;

describe('SelectEditor', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let editor: SelectEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    translateService = new TranslateServiceStub();

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.innerHTML = '';
    document.body.appendChild(divContainer);

    mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.multipleSelect }, editorClass: {} as Editor } as Column;

    editorArguments = {
      grid: gridStub,
      column: mockColumn,
      item: mockItemData,
      event: null as any,
      cancelChanges: vi.fn(),
      commitChanges: vi.fn(),
      container: divContainer,
      columnMetaData: null as any,
      dataView: dataViewStub,
      gridPosition: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
      position: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
    };
  });

  describe('with invalid Editor instance', () => {
    it('should throw an error when there is no collection provided in the editor property', () =>
      new Promise((done: any) => {
        try {
          mockColumn.editor!.collection = undefined;
          editor = new SelectEditor(editorArguments, true);
        } catch (e: any) {
          expect(e.toString()).toContain(
            `[Slickgrid-Universal] You need to pass a "collection" (or "collectionAsync") inside Column Definition Editor for the MultipleSelect/SingleSelect Editor to work correctly.`
          );
          done();
        }
      }));

    it('should throw an error when collection is not a valid array', () =>
      new Promise((done: any) => {
        try {
          mockColumn.editor!.collection = { hello: 'world' } as any;
          editor = new SelectEditor(editorArguments, true);
        } catch (e: any) {
          expect(e.toString()).toContain(`The "collection" passed to the Select Editor is not a valid array.`);
          done();
        }
      }));

    it('should throw an error when collection is not a valid value/label pair array', () =>
      new Promise((done: any) => {
        try {
          mockColumn.editor!.collection = [{ hello: 'world' }];
          editor = new SelectEditor(editorArguments, true);
        } catch (e: any) {
          expect(e.toString()).toContain(
            `[Slickgrid-Universal] Select Filter/Editor collection with value/label (or value/labelKey when using Locale) is required to populate the Select list`
          );
          done();
        }
      }));

    it('should throw an error when "enableTranslateLabel" is set without a valid I18N Service', () =>
      new Promise((done: any) => {
        try {
          translateService = undefined as any;
          mockColumn.editor!.enableTranslateLabel = true;
          mockColumn.editor!.collection = [
            { value: 'male', label: 'male' },
            { value: 'female', label: 'female' },
          ];
          editor = new SelectEditor(editorArguments, true);
        } catch (e: any) {
          expect(e.toString()).toContain(
            `[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.`
          );
          done();
        }
      }));
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, gender: 'male', isActive: true };
      mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.multipleSelect }, editorClass: {} as Editor } as Column;
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
        { value: 'other', label: 'other' },
      ];

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      gridOptionMock.translater = translateService;
      editor = new SelectEditor(editorArguments, true);
      editor.focus();
      const editorCount = document.body.querySelectorAll('select.ms-filter.editor-gender').length;

      expect(gridStub.focus).toHaveBeenCalled();
      expect(editorCount).toBe(1);
    });

    it('should navigate to next cell when blur is called with Tab key', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      gridOptionMock.translater = translateService;
      editor = new SelectEditor(editorArguments, true);
      const keyEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true, cancelable: true });
      editor.msInstance?.getOptions().onBlur(keyEvent);

      expect(gridStub.navigateNext).toHaveBeenCalled();
    });

    it('should navigate to previous cell when blur is called with Shift+Tab keys', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      gridOptionMock.translater = translateService;
      editor = new SelectEditor(editorArguments, true);
      const keyEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
      editor.msInstance?.getOptions().onBlur(keyEvent);

      expect(gridStub.navigatePrev).toHaveBeenCalled();
      vi.resetAllMocks();
    });

    it('should NOT navigate to next cell when blur is called with Tab key with CompositeEditor', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      gridOptionMock.translater = translateService;
      editor = new SelectEditor(
        { ...editorArguments, compositeEditorOptions: { modalType: 'auto-mass', editors: {}, formValues: {} }, isCompositeEditor: true },
        true
      );
      editor.msInstance?.open(null);
      const keyEvent = new (window.window as any).KeyboardEvent('keydown', { key: 'Tab', shiftKey: false, bubbles: true, cancelable: true });
      editor.msInstance?.getOptions().onBlur(keyEvent);

      expect(gridStub.navigateNext).not.toHaveBeenCalled();
    });

    it('should initialize the editor with element being disabled in the DOM when passing a collectionAsync and an empty collection property', () => {
      const mockCollection = ['male', 'female'];
      const promise = Promise.resolve(mockCollection);
      mockColumn.editor!.collection = null as any;
      mockColumn.editor!.collectionAsync = promise;
      gridOptionMock.translater = translateService;

      editor = new SelectEditor(editorArguments, true);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.destroy();
      editor.init();
      const editorCount = document.body.querySelectorAll('select.ms-filter.editor-gender').length;

      expect(editorCount).toBe(1);
      expect(disableSpy).toHaveBeenCalledWith(true);
    });

    it('should translate prefix/suffix when "enableTranslateLabel" is enabled', () => {
      mockColumn.editor!.enableTranslateLabel = true;
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male', labelPrefix: 'HELLO', labelSuffix: 'DEVELOPER' },
        { value: 'female', label: 'female' },
      ];
      gridOptionMock.translater = translateService;
      editor = new SelectEditor(editorArguments, true);
      editor.msInstance?.setSelects(['male']);

      const selectDropElm = editor.msInstance?.getDropElement();
      const editorListElm = selectDropElm?.querySelectorAll<HTMLInputElement>('ul>li');

      expect(editor.currentValues).toEqual(['male']);
      expect(editorListElm?.[0].querySelector('span')?.textContent).toBe('HellomaleDeveloper');
    });

    it('should initialize the editor even when user define its own editor options', () => {
      mockColumn.editor!.options = { minHeight: 300 } as MultipleSelectOption;
      editor = new SelectEditor(editorArguments, true);
      const editorCount = document.body.querySelectorAll('select.ms-filter.editor-gender').length;

      expect(editorCount).toBe(1);
    });

    it('should initialize the editor with minHeight define in user editor options', () => {
      mockColumn.editor!.editorOptions = { minHeight: 255 } as MultipleSelectOption;
      editor = new SelectEditor(editorArguments, true);

      expect(editor.msInstance?.getOptions().minHeight).toBe(255);
    });

    it('should initialize the editor with minHeight define in global default user editor options', () => {
      gridOptionMock.defaultEditorOptions = {
        select: { minHeight: 243 },
      };
      editor = new SelectEditor(editorArguments, true);

      expect(editor.msInstance?.getOptions().minHeight).toBe(243);
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.placeholder = testValue;
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];

      editor = new SelectEditor(editorArguments, true);
      const editorElm = divContainer.querySelector('.ms-filter.editor-gender .ms-placeholder') as HTMLSpanElement;

      expect(editorElm.innerHTML).toBe(testValue);
    });

    it('should enable Dark Mode and expect ".ms-dark-mode" CSS class to be found on parent element', () => {
      gridOptionMock.darkMode = true;
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];

      editor = new SelectEditor(editorArguments, true);
      const editorElm = divContainer.querySelector('.ms-parent.editor-gender') as HTMLSpanElement;

      expect(editorElm.classList.contains('ms-dark-mode')).toBeTruthy();
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      mockColumn.editor!.placeholder = 'test placeholder';

      editor = new SelectEditor(editorArguments, true);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" with a single string and expect the string to be returned in a single string array when calling "getValue" when using single select', () => {
      editor = new SelectEditor(editorArguments, true);
      editor.setValue(['male']);

      expect(editor.getValue()).toEqual(['male']);
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new SelectEditor(editorArguments, true);
      editor.setValue(['male'], true);

      expect(editor.getValue()).toEqual(['male']);
      expect(editorArguments.item.gender).toEqual(['male']);
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new SelectEditor(editorArguments, true);
      editor.loadValue(mockItemData);

      expect(editor.getValue()).toEqual(['male']);
      expect(editor.msInstance!.getSelects()).toEqual(['male']);
    });

    it('should create the multi-select editor with a blank entry at the beginning of the collection when "addBlankEntry" is set in the "collectionOptions" property', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      mockColumn.editor!.collectionOptions = { addBlankEntry: true };

      editor = new SelectEditor(editorArguments, true);
      const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
      const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
      const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
      editorBtnElm.click();
      editorOkElm.click();

      expect(editorListElm.length).toBe(3);
      expect(editorListElm[0].value).toBe('');
      expect(editorListElm[1].textContent).toBe('');
    });

    it('should create the multi-select editor with a custom entry at the beginning of the collection when "addCustomFirstEntry" is provided in the "collectionOptions" property', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      mockColumn.editor!.collectionOptions = { addCustomFirstEntry: { value: null as any, label: '' } };

      editor = new SelectEditor(editorArguments, true);
      const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
      const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
      const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
      editorBtnElm.click();
      editorOkElm.click();

      expect(editorListElm.length).toBe(3);
      expect(editorListElm[0].value).toBe('');
      expect(editorListElm[1].textContent).toBe('');
    });

    it('should create the multi-select editor with a custom entry at the end of the collection when "addCustomFirstEntry" is provided in the "collectionOptions" property', () => {
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
      ];
      mockColumn.editor!.collectionOptions = { addCustomLastEntry: { value: null as any, label: '' } };

      editor = new SelectEditor(editorArguments, true);
      const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
      const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
      const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
      editorBtnElm.click();
      editorOkElm.click();

      expect(editorListElm.length).toBe(3);
      expect(editorListElm[2].value).toBe('');
      expect(editorListElm[1].textContent).toBe('');
    });

    describe('isValueChanged method', () => {
      it('should return True after doing a check of an option and clicking on the OK button', () => {
        editor = new SelectEditor(editorArguments, true);
        editor.reset();
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        // editor.msInstance?.setSelects(['female']);
        // editor.msInstance?.close();

        editorListElm[1].checked = true;
        editorListElm[1].dispatchEvent(new CustomEvent('click'));
        editorOkElm.click();

        expect(editorListElm.length).toBe(3);
        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return False after doing a check & uncheck of the same option and clicking on the OK button', () => {
        editor = new SelectEditor(editorArguments, true);
        editor.reset();
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`.ms-drop ul>li input[type=checkbox]`);
        const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        // check and uncheck the same option
        editorListElm[0].checked = true;
        editorListElm[0].checked = false;
        editorListElm[0].dispatchEvent(new CustomEvent('click'));
        editorOkElm.click();

        expect(editorListElm.length).toBe(3);
        expect(editor.isValueChanged()).toBe(false);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should call the "changeEditorOption" method and expect new option to be merged with the previous Editor options and also expect to call MultipleSelect "refreshOptions" setter method', () => {
        editor = new SelectEditor(editorArguments, true);
        const refreshSpy = vi.spyOn(editor.msInstance!, 'refreshOptions');
        editor.changeEditorOption('filter', true);

        expect(refreshSpy).toHaveBeenCalledWith({ ...editor.editorElmOptions, filter: true });
      });
    });

    describe('isValueTouched method', () => {
      it('should return True after triggering an Check All event', () => {
        editor = new SelectEditor(editorArguments, true);
        editor.reset();
        const selectAllBtnElm = divContainer.querySelector('.ms-select-all') as HTMLButtonElement;
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`.ms-drop ul>li input[type=checkbox]`);
        const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        // check and uncheck the same option
        selectAllBtnElm.dispatchEvent(new CustomEvent('onCheckAll'));
        selectAllBtnElm.click();
        editorOkElm.click();
        editor.msInstance?.checkAll();

        expect(editorListElm.length).toBe(3);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return True after triggering an UnCheck All event', () => {
        editor = new SelectEditor(editorArguments, true);
        editor.reset();
        const selectAllBtnElm = divContainer.querySelector('.ms-select-all') as HTMLButtonElement;
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`.ms-drop ul>li input[type=checkbox]`);
        const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        // check and uncheck the same option
        selectAllBtnElm.dispatchEvent(new CustomEvent('onCheckAll'));
        selectAllBtnElm.click();
        editorOkElm.click();
        editor.msInstance?.uncheckAll();

        expect(editorListElm.length).toBe(3);
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the gender property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.applyValue(mockItemData, 'female');

        expect(mockItemData).toEqual({ id: 1, gender: 'female', isActive: true });
      });

      it('should apply the value to the gender (last property) when field has a dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'person.bio.gender';
        mockItemData = { id: 1, person: { bio: { gender: 'male' } }, isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.applyValue(mockItemData, 'female');

        expect(mockItemData).toEqual({ id: 1, person: { bio: { gender: 'female' } }, isActive: true });
      });

      it('should apply the value to the bio property (second last) when field has a dot notation (complex object) value provided is an object and it that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.editor!.complexObjectPath = 'person.bio';
        mockColumn.field = 'person.bio.gender';
        mockItemData = { id: 1, person: { bio: { gender: 'male' } }, isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.applyValue(mockItemData, { gender: 'female' });

        expect(mockItemData).toEqual({ id: 1, person: { bio: { gender: 'female' } }, isActive: true });
      });

      it('should return item data with an empty string in its value when it fails the custom validation', () => {
        mockColumn.editor!.validator = (value: any) => {
          if (value.length < 10) {
            return { valid: false, msg: 'Must be at least 10 chars long.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.applyValue(mockItemData, 'female');

        expect(mockItemData).toEqual({ id: 1, gender: '', isActive: true });
      });

      it('should apply the value to the gender property as an array with multiple when the input value is a CSV string', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.applyValue(mockItemData, 'male,other');

        expect(mockItemData).toEqual({ id: 1, gender: ['male', 'other'], isActive: true });
      });

      it('should parse the value as a float when field type is defined as float then apply the value', () => {
        mockColumn = {
          id: 'age',
          field: 'age',
          type: FieldType.boolean,
          editable: true,
          editor: { model: Editors.multipleSelect },
          editorClass: {} as Editor,
        } as Column;
        mockItemData = { id: 1, gender: 'male', isActive: true, age: 26 };
        mockColumn.editor!.collection = [
          { value: 20, label: '20' },
          { value: 25, label: '25' },
        ];

        editorArguments.column = mockColumn;
        editor = new SelectEditor(editorArguments, true);
        editor.applyValue(mockItemData, 25);

        expect(mockItemData).toEqual({ id: 1, gender: 'male', isActive: true, age: 25 });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a string', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual(['male']);
      });

      it('should return serialized value as an empty array when item value is also an empty string', () => {
        mockItemData = { id: 1, gender: '', isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual([]);
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, gender: null as any, isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();
        const currentValue = editor.currentValue;

        expect(output).toEqual([]);
        expect(currentValue).toEqual('');
      });

      it('should return value as a string when using a dot (.) notation for complex object with a collection of string values', () => {
        mockColumn.field = 'employee.gender';
        mockColumn.editor!.collection = ['male', 'female'];
        mockItemData = { id: 1, employee: { id: 24, gender: 'male' }, isActive: true };

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual(['male']);
      });

      it('should return object value when using a dot (.) notation for complex object with a collection of option/label pair', () => {
        mockColumn.field = 'employee.gender';
        mockItemData = { id: 1, employee: { id: 24, gender: ['male', 'other'] }, isActive: true };
        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual([
          { label: 'male', value: 'male' },
          { label: 'other', value: 'other' },
        ]);
        expect(editor.currentValues).toEqual([
          { label: 'male', value: 'male' },
          { label: 'other', value: 'other' },
        ]);
      });

      it('should return all object values when using a dot (.) notation for complex object with a collection of option/label pair and using "serializeComplexValueFormat" as "object"', () => {
        mockColumn.field = 'employee.gender';
        mockItemData = { id: 1, employee: { id: 24, gender: ['male', 'other'] }, isActive: true };
        mockColumn.editor!.serializeComplexValueFormat = 'object';
        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual([
          { label: 'male', value: 'male' },
          { label: 'other', value: 'other' },
        ]);
        expect(editor.currentValues).toEqual([
          { label: 'male', value: 'male' },
          { label: 'other', value: 'other' },
        ]);
      });

      it('should return a single object value when using a dot (.) notation for complex object with a collection of option/label pair and using "serializeComplexValueFormat" as "object"', () => {
        mockColumn.field = 'employee.gender';
        mockItemData = { id: 1, employee: { id: 24, gender: 'male' }, isActive: true };
        mockColumn.editor!.serializeComplexValueFormat = 'object';
        editor = new SelectEditor(editorArguments, false);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual({ label: 'male', value: 'male' });
        expect(editor.currentValue).toEqual({ label: 'male', value: 'male' });
      });

      it('should return flat value when using a dot (.) notation for complex object with a collection of option/label pair and using "serializeComplexValueFormat" as "flat"', () => {
        mockColumn.field = 'employee.gender';
        mockItemData = { id: 1, employee: { id: 24, gender: ['male', 'other'] }, isActive: true };
        mockColumn.editor!.serializeComplexValueFormat = 'flat';
        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual(['male', 'other']);
        expect(editor.currentValues).toEqual(['male', 'other']);
      });

      it('should return object value when using a dot (.) notation and we override the object path using "complexObjectPath" to find correct values', () => {
        mockColumn.field = 'employee.bio';
        mockItemData = { id: 1, employee: { id: 24, bio: { gender: ['male', 'other'] } }, isActive: true };
        mockColumn.editor!.complexObjectPath = 'employee.bio.gender';
        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual([
          { label: 'male', value: 'male' },
          { label: 'other', value: 'other' },
        ]);
      });
    });

    describe('save method', () => {
      afterEach(() => {
        editor.destroy();
        vi.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "save" and "getEditorLock" method when "hasAutoCommitEdit" is enabled and we are destroying the editor without it being saved yet', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const lockSpy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new SelectEditor(editorArguments, true);
        const saveSpy = vi.spyOn(editor, 'save');

        editor.loadValue(mockItemData);
        editor.destroy();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledWith(true);
        expect(lockSpy).toHaveBeenCalled();
      });

      it('should call "save(true)" only once when autoCommitEdit is True and even when both "onClose" and "destroy" are called', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = true;

        editor = new SelectEditor(editorArguments, true);
        const saveSpy = vi.spyOn(editor, 'save');

        editor.loadValue(mockItemData);
        editor.msInstance?.close();
        editor.destroy();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledWith(true);
      });

      it('should call "save(false)" only once when autoCommitEdit is False and even when both "onClose" and "destroy" are called', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = false;

        editor = new SelectEditor(editorArguments, true);
        const saveSpy = vi.spyOn(editor, 'save');

        editor.loadValue(mockItemData);
        editor.msInstance?.close();
        editor.destroy();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledWith(false);
      });

      it('should cancel changes when Escape key is pressed and should not call "save()"', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = false;

        editor = new SelectEditor(editorArguments, true);
        const cancelSpy = vi.spyOn(editor, 'cancel');
        const saveSpy = vi.spyOn(editor, 'save');

        editor.loadValue(mockItemData);
        editor.msInstance?.close('key.escape');
        editor.destroy();

        expect(cancelSpy).toHaveBeenCalled();
        expect(saveSpy).not.toHaveBeenCalled();
      });

      it('should not "save()" when clicking ouside the select on body', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = false;

        editor = new SelectEditor(editorArguments, true);
        const cancelSpy = vi.spyOn(editor, 'cancel');
        const saveSpy = vi.spyOn(editor, 'save');

        editor.loadValue(mockItemData);
        editor.msInstance?.close('body.click');
        editor.destroy();

        expect(cancelSpy).not.toHaveBeenCalled();
        expect(saveSpy).not.toHaveBeenCalled();
      });

      it('should not call "commitCurrentEdit" when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = vi.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new SelectEditor(editorArguments, true);
        const validation = editor.validate(null as any, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return True when field is required and input is a valid input value', () => {
        mockColumn.editor!.required = true;
        editor = new SelectEditor(editorArguments, true);
        const validation = editor.validate(null as any, 'text');

        expect(validation).toEqual({ valid: true, msg: null });
      });
    });

    describe('initialize with collection', () => {
      it('should create the multi-select editor with a default search term when passed as a filter argument even with collection an array of strings', () => {
        mockColumn.editor!.collection = ['male', 'female'];

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
        editorBtnElm.click();
        editorOkElm.click();

        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].value).toBe('male');
        expect(editorListElm[1].value).toBe('female');
      });
    });

    describe('collectionSortBy setting', () => {
      it('should create the multi-select editor and sort the string collection when "collectionSortBy" is set', () => {
        mockColumn.editor = {
          collection: ['other', 'male', 'female'],
          collectionSortBy: {
            sortDesc: true,
            fieldType: FieldType.string,
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(3);
        expect(editorListElm[0].value).toBe('other');
        expect(editorListElm[1].value).toBe('male');
        expect(editorListElm[2].value).toBe('female');
      });

      it('should create the multi-select editor and sort the value/label pair collection when "collectionSortBy" is set', () => {
        mockColumn.editor = {
          collection: [
            { value: 'other', description: 'other' },
            { value: 'male', description: 'male' },
            { value: 'female', description: 'female' },
          ],
          collectionSortBy: {
            property: 'value',
            sortDesc: false,
            fieldType: FieldType.string,
          },
          customStructure: {
            value: 'value',
            label: 'description',
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(3);
        expect(editorListElm[0].value).toBe('female');
        expect(editorListElm[1].value).toBe('male');
        expect(editorListElm[2].value).toBe('other');
      });
    });

    describe('collectionFilterBy setting', () => {
      it('should create the multi-select editor and filter the string collection when "collectionFilterBy" is set', () => {
        mockColumn.editor = {
          collection: ['other', 'male', 'female'],
          collectionFilterBy: {
            operator: OperatorType.equal,
            value: 'other',
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(1);
        expect(editorListElm[0].value).toBe('other');
      });

      it('should create the multi-select editor and filter the value/label pair collection when "collectionFilterBy" is set', () => {
        mockColumn.editor = {
          collection: [
            { value: 'other', description: 'other' },
            { value: 'male', description: 'male' },
            { value: 'female', description: 'female' },
          ],
          collectionFilterBy: [
            { property: 'value', operator: OperatorType.notEqual, value: 'other' },
            { property: 'value', operator: OperatorType.notEqual, value: 'male' },
          ],
          customStructure: {
            value: 'value',
            label: 'description',
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(1);
        expect(editorListElm[0].value).toBe('female');
      });

      it('should create the multi-select editor and filter the value/label pair collection when "collectionFilterBy" is set and "filterResultAfterEachPass" is set to "merge"', () => {
        mockColumn.editor = {
          collection: [
            { value: 'other', description: 'other' },
            { value: 'male', description: 'male' },
            { value: 'female', description: 'female' },
          ],
          collectionFilterBy: [
            { property: 'value', operator: OperatorType.equal, value: 'other' },
            { property: 'value', operator: OperatorType.equal, value: 'male' },
          ],
          collectionOptions: {
            filterResultAfterEachPass: 'merge',
          },
          customStructure: {
            value: 'value',
            label: 'description',
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].value).toBe('other');
        expect(editorListElm[1].value).toBe('male');
      });
    });

    describe('collectionOverride callback option', () => {
      it('should create the multi-select editor and expect a different collection outputed when using the override', () => {
        mockColumn.editor = {
          collection: ['other', 'male', 'female'],
          collectionOverride: (inputCollection) => inputCollection.filter((item) => item !== 'other'),
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].value).toBe('male');
        expect(editorListElm[1].value).toBe('female');
      });
    });

    describe('collectionInsideObjectProperty setting', () => {
      it('should create the multi-select editor with a value/label pair collection that is inside an object when "collectionInsideObjectProperty" is defined with a dot notation', () => {
        mockColumn.editor = {
          collection: {
            deep: {
              myCollection: [
                { value: 'other', description: 'other' },
                { value: 'male', description: 'male' },
                { value: 'female', description: 'female' },
              ],
            },
          } as any,
          collectionOptions: {
            collectionInsideObjectProperty: 'deep.myCollection',
          },
          customStructure: {
            value: 'value',
            label: 'description',
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=checkbox]`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(3);
        expect(editorListElm[0].value).toBe('other');
        expect(editorListElm[1].value).toBe('male');
        expect(editorListElm[2].value).toBe('female');
      });
    });

    describe('enableRenderHtml property', () => {
      it('should create the multi-select editor with a default search term and have the HTML rendered when "enableRenderHtml" is set', () => {
        mockColumn.editor = {
          enableRenderHtml: true,
          collection: [
            { value: true, label: 'True', labelPrefix: `<i class="mdi mdi-check"></i> ` },
            { value: false, label: 'False' },
          ],
          customStructure: {
            value: 'isEffort',
            label: 'label',
            labelPrefix: 'labelPrefix',
          },
        };

        editor = new SelectEditor(editorArguments, true);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li span`);
        editorBtnElm.click();

        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].innerHTML).toBe('<i class="mdi mdi-check"></i> True');
      });

      it('should create the multi-select editor with a default search term and have the HTML rendered when "enableRenderHtml" is set and has <script> tag', () => {
        mockColumn.editor = {
          enableRenderHtml: true,
          collection: [
            { isEffort: true, label: 'True', labelPrefix: `<i class="mdi mdi-check"></i> ` },
            { isEffort: false, label: 'False' },
          ],
          collectionOptions: {
            separatorBetweenTextLabels: ': ',
            includePrefixSuffixToSelectedValues: true,
          },
          customStructure: {
            value: 'isEffort',
            label: 'label',
            labelPrefix: 'labelPrefix',
          },
        };
        mockItemData = { id: 1, gender: 'male', isEffort: false };

        editor = new SelectEditor(editorArguments, true);
        editor.loadValue(mockItemData);
        editor.setValue([false]);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li span`);
        editorBtnElm.click();

        expect(editor.getValue()).toEqual(['']);
        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].innerHTML).toBe('<i class="mdi mdi-check"></i> : True');
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

      mockItemData = { id: 1, gender: 'male', isActive: true };
      mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.multipleSelect }, editorClass: {} as Editor } as Column;
      mockColumn.editor!.collection = [
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
        { value: 'other', label: 'other' },
      ];

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
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
      editor = new SelectEditor(editorArguments, true);
      editor.setValue(['male'], true);
      editor.msInstance?.close();

      expect(editor.getValue()).toEqual(['male']);
      expect(onCompositeEditorSpy).toHaveBeenCalledWith(
        {
          ...activeCellMock,
          column: mockColumn,
          item: mockItemData,
          grid: gridStub,
          formValues: { gender: ['male'] },
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

      editor = new SelectEditor(editorArguments, true);
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

      editor = new SelectEditor(editorArguments, true);
      editor.loadValue(mockItemData);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();
      const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;

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
          formValues: { gender: [] },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editorBtnElm.classList.contains('disabled')).toEqual(true);
      expect(editor.msInstance!.getSelects()).toEqual([]);
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

      editor = new SelectEditor(editorArguments, true);
      editor.loadValue(mockItemData);
      const disableSpy = vi.spyOn(editor, 'disable');
      editor.show();
      const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;

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
      expect(editorBtnElm.classList.contains('disabled')).toEqual(true);
      expect(editor.msInstance!.getSelects()).toEqual([]);
    });

    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = vi.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined,
      } as any);
      const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false,
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, gender: ['male'], isActive: true };

      editor = new SelectEditor(editorArguments, true);
      editor.loadValue(mockItemData);
      editor.setValue(['male']);
      const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
      const editorOkElm = divContainer.querySelector(`[data-name=editor-gender].ms-drop .ms-ok-button`) as HTMLButtonElement;
      editorBtnElm.click();
      editorOkElm.click();
      editor.msInstance?.close();

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
          formValues: { gender: ['male'] },
          editors: {},
          triggeredBy: 'user',
        },
        expect.anything()
      );
    });

    describe('collectionOverride callback option', () => {
      it('should create the editor and expect a different collection outputed when using the override', () => {
        const activeCellMock = { row: 0, cell: 0 };
        vi.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
        const onCompositeEditorSpy = vi.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
          getReturnValue: () => false,
        } as any);
        mockColumn.editor = {
          collection: [
            { value: 'male', label: 'male' },
            { value: 'female', label: 'female' },
            { value: 'other', label: 'other' },
          ],
          collectionOverride: (inputCollection) => inputCollection.filter((item) => item.value !== 'other'),
        };
        editor = new SelectEditor(editorArguments, true);
        editor.setValue(['male'], true);

        expect(editor.getValue()).toEqual(['male']);
        expect(onCompositeEditorSpy).toHaveBeenCalledWith(
          {
            ...activeCellMock,
            column: mockColumn,
            item: mockItemData,
            grid: gridStub,
            formValues: { gender: ['male'] },
            editors: {},
            triggeredBy: 'system',
          },
          expect.anything()
        );
      });
    });
  });
});
