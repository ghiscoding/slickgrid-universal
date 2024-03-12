import 'jest-extended';

import { Editors } from '../index';
import { AutocompleterEditor } from '../autocompleterEditor';
import { FieldType } from '../../enums/index';
import { AutocompleterOption, Column, ColumnEditor, Editor, EditorArguments, GridOption } from '../../interfaces/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { SlickDataView, SlickEvent, type SlickGrid } from '../../core/index';

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
} as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
};

const gridStub = {
  applyHtmlCode: (elm, val) => elm.innerHTML = val || '',
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

describe('AutocompleterEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: AutocompleterEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.autocompleter }, editorClass: {} as Editor } as Column;

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
        editor = new AutocompleterEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 123, gender: 'male', isActive: true };
      mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.autocompleter }, editorClass: {} as Editor } as Column;
      mockColumn.editor!.collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new AutocompleterEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-gender').length;

      expect(editor.instance).toBeTruthy();
      expect(editorCount).toBe(1);
    });

    it('should initialize the editor with element being disabled in the DOM when passing a collectionAsync and an empty collection property', () => {
      gridOptionMock.translater = translateService;
      gridOptionMock.enableTranslate = true;
      const mockCollection = ['male', 'female'];
      const promise = Promise.resolve(mockCollection);
      mockColumn.editor!.collection = null as any;
      mockColumn.editor!.collectionAsync = promise;

      editor = new AutocompleterEditor(editorArguments);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.destroy();
      editor.init();
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-gender').length;

      expect(editorCount).toBe(1);
      expect(disableSpy).toHaveBeenCalledWith(true);
    });

    it('should initialize the editor even when user define his own editor options', () => {
      mockColumn.editor!.editorOptions = { minLength: 3 } as AutocompleterOption;
      editor = new AutocompleterEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-gender').length;

      expect(editorCount).toBe(1);
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.placeholder = testValue;

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-gender') as HTMLInputElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-gender') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "setValue" and expect the DOM element to have the same value when calling "getValue"', () => {
      editor = new AutocompleterEditor(editorArguments);
      editor.setValue('male');

      expect(editor.getValue()).toBe('male');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      mockColumn.type = FieldType.object;
      editor = new AutocompleterEditor(editorArguments);
      editor.setValue({ value: 'male', label: 'male' }, true);

      expect(editor.getValue()).toBe('male');
      expect(editorArguments.item.gender).toEqual({ value: 'male', label: 'male' });
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new AutocompleterEditor(editorArguments);
      editor.loadValue(mockItemData);

      expect(editor.getValue()).toBe('male');
    });

    it('should define an item datacontext containing a complex object as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      mockItemData = { id: 123, gender: { value: 'male', label: 'Male' }, isActive: true };
      mockColumn.field = 'gender.value';
      editor = new AutocompleterEditor(editorArguments);
      editor.loadValue(mockItemData);

      expect(editor.getValue()).toBe('male');
    });

    it('should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using Left Arrow key', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
      const spyEvent = jest.spyOn(event, 'stopImmediatePropagation');

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;

      editorElm.focus();
      editorElm.dispatchEvent(event);

      expect(spyEvent).toHaveBeenCalled();
    });

    it('should dispatch a keyboard event and expect "stopImmediatePropagation()" to have been called when using Right Arrow key', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
      const spyEvent = jest.spyOn(event, 'stopImmediatePropagation');

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;

      editorElm.focus();
      editorElm.dispatchEvent(event);

      expect(spyEvent).toHaveBeenCalled();
    });

    it('should render the DOM element with different key/value pair when user provide its own customStructure', () => {
      mockColumn.editor!.collection = [{ option: 'male', text: 'Male' }, { option: 'female', text: 'Female' }];
      mockColumn.editor!.customStructure = { value: 'option', label: 'text' };
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;

      editorElm.focus();
      editorElm.dispatchEvent(event);

      expect(editor.elementCollection).toEqual([{ value: 'male', label: 'Male', labelPrefix: '', labelSuffix: '' }, { value: 'female', label: 'Female', labelPrefix: '', labelSuffix: '' }]);
    });

    it('should return True when calling "isValueChanged()" method with previously dispatched keyboard event being char "a"', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

      editor = new AutocompleterEditor(editorArguments);
      editor.setValue('z');
      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;

      editorElm.focus();
      editorElm.dispatchEvent(event);

      expect(editor.isValueChanged()).toBe(true);
    });

    it('should return False when calling "isValueChanged()" method with previously dispatched keyboard event is same char as current value', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;

      editor.loadValue({ id: 123, gender: 'a', isActive: true });
      editorElm.focus();
      editorElm.dispatchEvent(event);

      expect(editor.isValueChanged()).toBe(false);
    });

    it('should return True when calling "isValueChanged()" method with previously dispatched keyboard event as ENTER and "alwaysSaveOnEnterKey" is enabled', () => {
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      mockColumn.editor!.alwaysSaveOnEnterKey = true;

      editor = new AutocompleterEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;

      editorElm.focus();
      editorElm.dispatchEvent(event);

      expect(editor.isValueChanged()).toBe(true);
    });

    it('should call "focus()" method and expect the DOM element to be focused and selected', () => {
      editor = new AutocompleterEditor(editorArguments);
      const editorElm = editor.editorDomElement;
      const spy = jest.spyOn(editorElm, 'focus');
      editor.focus();

      expect(gridStub.focus).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();
    });

    describe('collectionOverride callback option', () => {
      it('should create the editor and expect a different collection outputed when using the override', () => {
        mockColumn.editor = {
          collection: [{ value: 'other', label: 'Other' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }],
          collectionOverride: (inputCollection) => inputCollection.filter(item => item.value !== 'other')
        };

        editor = new AutocompleterEditor(editorArguments);
        editor.destroy();
        editor.init();
        const editorCount = divContainer.querySelectorAll('input.editor-text.editor-gender').length;

        expect(editorCount).toBe(1);
        expect(editor.elementCollection).toEqual([{ value: 'male', label: 'Male', labelPrefix: '', labelSuffix: '' }, { value: 'female', label: 'Female', labelPrefix: '', labelSuffix: '' }]);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the gender property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 123, gender: 'female', isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.applyValue(mockItemData, { value: 'female', label: 'female' });

        expect(mockItemData).toEqual({ id: 123, gender: { value: 'female', label: 'female' }, isActive: true });
      });

      it('should apply the value to the gender property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'user.gender';
        mockItemData = { id: 1, user: { gender: 'female' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.applyValue(mockItemData, { value: 'female', label: 'female' });

        expect(mockItemData).toEqual({ id: 1, user: { gender: { value: 'female', label: 'female' } }, isActive: true });
      });

      it('should return override the item data as a string found from the collection that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.editor!.collection = ['male', 'female'];
        mockItemData = { id: 123, gender: 'female', isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.applyValue(mockItemData, 'female');

        expect(mockItemData).toEqual({ id: 123, gender: 'female', isActive: true });
      });

      it('should return item data with an empty string in its value when calling "applyValue" which fails the custom validation', () => {
        mockColumn.editor!.validator = (value: any) => {
          if (value.label.length < 10) {
            return { valid: false, msg: 'Must be at least 10 chars long.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 123, gender: 'female', isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.applyValue(mockItemData, 'female');

        expect(mockItemData).toEqual({ id: 123, gender: '', isActive: true });
      });
    });

    describe('forceUserInput flag', () => {
      it('should return DOM element value when "forceUserInput" is enabled and loaded value length is greater then minLength defined when calling "serializeValue"', () => {
        mockColumn.editor!.editorOptions = { forceUserInput: true, };
        mockItemData = { id: 123, gender: { value: 'male', label: 'Male' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('Female');
        const output = editor.serializeValue();

        expect(output).toBe('Female');
      });

      it('should return DOM element value when "forceUserInput" is enabled and loaded value length is greater then custom minLength defined when calling "serializeValue"', () => {
        mockColumn.editor!.editorOptions = { forceUserInput: true, minLength: 2 } as AutocompleterOption;
        mockItemData = { id: 123, gender: { value: 'male', label: 'Male' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('Female');
        const output = editor.serializeValue();

        expect(output).toBe('Female');
      });

      it('should return loaded value when "forceUserInput" is enabled and loaded value length is lower than minLength defined when calling "serializeValue"', () => {
        mockColumn.editor!.editorOptions = { forceUserInput: true, } as AutocompleterOption;
        mockItemData = { id: 123, gender: { value: 'male', label: 'Male' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('F');
        const output = editor.serializeValue();

        expect(output).toBe('male');
      });
    });

    describe('serializeValue method', () => {
      it('should return correct object value even when defining a "customStructure" when calling "serializeValue"', () => {
        mockColumn.editor!.collection = [{ option: 'male', text: 'Male' }, { option: 'female', text: 'Female' }];
        mockColumn.editor!.customStructure = { value: 'option', label: 'text' };
        mockItemData = { id: 123, gender: { option: 'female', text: 'Female' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('female');
      });

      it('should return an object output when calling "serializeValue" with its column definition set to "FieldType.object" with default label/value', () => {
        mockColumn.type = FieldType.object;
        mockColumn.editor!.collection = [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }];
        mockItemData = { id: 123, gender: { value: 'f', label: 'Female' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual({ value: 'f', label: 'Female' });
      });

      it('should return an object output when calling "serializeValue" with its column definition set to "FieldType.object" with custom dataKey/labelKey pair', () => {
        mockColumn.type = FieldType.object;
        mockColumn.editor!.collection = [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }];
        mockColumn.dataKey = 'id';
        mockColumn.labelKey = 'name';
        mockItemData = { id: 123, gender: { value: 'f', label: 'Female' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual({ id: 'f', name: 'Female' });
      });
    });

    describe('save method', () => {
      it('should call "getEditorLock" when "hasAutoCommitEdit" is enabled after calling "save()" method', () => {
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new AutocompleterEditor(editorArguments);
        editor.setValue('a');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" when "hasAutoCommitEdit" is disabled after calling "save()" method', () => {
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new AutocompleterEditor(editorArguments);
        editor.setValue('a');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return True when field is required and input is a valid input value', () => {
        mockColumn.editor!.required = true;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is lower than a minLength defined', () => {
        mockColumn.editor!.minLength = 5;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is at least 5 character(s)' });
      });

      it('should return False when field is lower than a minLength defined using exclusive operator', () => {
        mockColumn.editor!.minLength = 5;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is more than 5 character(s)' });
      });

      it('should return True when field is equal to the minLength defined', () => {
        mockColumn.editor!.minLength = 4;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxLength defined', () => {
        mockColumn.editor!.maxLength = 10;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
      });

      it('should return False when field is greater than a maxLength defined using exclusive operator', () => {
        mockColumn.editor!.maxLength = 10;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 10 characters' });
      });

      it('should return True when field is equal to the maxLength defined', () => {
        mockColumn.editor!.maxLength = 16;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is equal to the maxLength defined and "operatorType" is set to "inclusive"', () => {
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to the maxLength defined but "operatorType" is set to "exclusive"', () => {
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 16 characters' });
      });

      it('should return False when field is not between minLength & maxLength defined', () => {
        mockColumn.editor!.minLength = 0;
        mockColumn.editor!.maxLength = 10;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text length is between 0 and 10 characters' });
      });

      it('should return True when field is is equal to maxLength defined when both min/max values are defined', () => {
        mockColumn.editor!.minLength = 0;
        mockColumn.editor!.maxLength = 16;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minLength defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        mockColumn.editor!.minLength = 4;
        mockColumn.editor!.maxLength = 15;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxLength but "operatorType" is set to "exclusive" when both min/max lengths are defined', () => {
        mockColumn.editor!.minLength = 4;
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new AutocompleterEditor(editorArguments);
        const validation1 = editor.validate(null, 'text is 16 chars');
        const validation2 = editor.validate(null, 'text');

        expect(validation1).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
        expect(validation2).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        mockColumn.editor!.maxLength = 10;
        editor = new AutocompleterEditor(editorArguments);
        const validation = editor.validate(null, 'Task is longer than 10 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
      });
    });

    describe('handleSelect method', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should expect the "handleSelect" method to be called when the callback method is triggered when user provide his own filterOptions', () => {
        editor = new AutocompleterEditor(editorArguments);
        const selectSpy = jest.spyOn(editor, 'handleSelect');
        const setValueSpy = jest.spyOn(editor, 'setValue');
        const saveSpy = jest.spyOn(editor, 'save');
        editor.autocompleterOptions.onSelect!({ item: 'fem' }, editor.editorDomElement);

        expect(setValueSpy).toHaveBeenCalled();
        expect(saveSpy).toHaveBeenCalled();
        // expect(spy).toHaveBeenCalledWith({ item: 'fem' });
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should expect the "handleSelect" method to be called when the callback method is triggered', () => {
        gridOptionMock.autoCommitEdit = true;
        mockColumn.editor!.collection = [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }];
        mockItemData = { id: 123, gender: { value: 'f', label: 'Female' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        const spy = jest.spyOn(editor, 'handleSelect');
        const saveSpy = jest.spyOn(editor, 'save');
        editor.autocompleterOptions.onSelect!({ item: 'fem' }, editor.editorDomElement);

        // expect(spy).toHaveBeenCalledWith(event, { item: 'fem' });
        expect(saveSpy).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should initialize the editor with editorOptions and expect the "handleSelect" method to be called when the callback method is triggered', () => {
        gridOptionMock.autoCommitEdit = true;
        mockColumn.editor!.collection = [{ value: 'm', label: 'Male' }, { value: 'f', label: 'Female' }];
        mockColumn.editor!.editorOptions = { minLength: 3 } as AutocompleterOption;
        mockItemData = { id: 123, gender: { value: 'f', label: 'Female' }, isActive: true };

        editor = new AutocompleterEditor(editorArguments);
        const handleSelectSpy = jest.spyOn(editor, 'handleSelect');
        const focusSpy = jest.spyOn(editor, 'focus');
        const saveSpy = jest.spyOn(editor, 'save');
        editor.autocompleterOptions.onSelect!({ item: 'fem' }, editor.editorDomElement);
        jest.runAllTimers(); // fast-forward timer

        // expect(handleSelectSpy).toHaveBeenCalledWith({ item: 'fem' });
        expect(saveSpy).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should expect the "onSelect" method to be called when defined and the callback method is triggered when user provide his own filterOptions', () => {
        gridOptionMock.autoCommitEdit = true;
        const mockOnSelect = jest.fn();
        const activeCellMock = { row: 1, cell: 0 };
        jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
        mockColumn.editor!.editorOptions = { minLength: 3, onSelectItem: mockOnSelect } as AutocompleterOption;

        const event = new CustomEvent('change');
        editor = new AutocompleterEditor(editorArguments);
        const saveSpy = jest.spyOn(editor, 'save');
        const handleSelectSpy = jest.spyOn(editor, 'handleSelect');
        editor.autocompleterOptions.onSelect!({ item: 'fem' }, editor.editorDomElement);

        // expect(saveSpy).toHaveBeenCalled();
        // expect(handleSelectSpy).toHaveBeenCalledWith(event, { item: 'fem' });
        expect(mockOnSelect).toHaveBeenCalledWith({ item: 'fem' }, activeCellMock.row, activeCellMock.cell, mockColumn, mockItemData);
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('renderItem callback method', () => {
      it('should provide "renderItem" in the "filterOptions" and expect the autocomplete "render" to be overriden', () => {
        const mockTemplateString = `<div>Hello World</div>`;
        const mockTemplateCallback = () => mockTemplateString;
        mockColumn.editor = {
          collection: ['male', 'female'],
          editorOptions: {
            showOnFocus: true,
            renderItem: {
              layout: 'fourCorners',
              templateCallback: mockTemplateCallback
            },
          } as AutocompleterOption
        };
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true });
        editor = new AutocompleterEditor(editorArguments);
        const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;
        editorElm.focus();
        editorElm.dispatchEvent(event);

        jest.runAllTimers(); // fast-forward timer

        const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.autocomplete-custom-four-corners');
        expect(editor.editorDomElement).toBeTruthy();
        expect(editor.instance).toBeTruthy();
        expect(editor.autocompleterOptions.render).toEqual(expect.any(Function));
        expect(autocompleteListElms.length).toBe(1);
        expect(autocompleteListElms[0].innerHTML).toContain(mockTemplateString);
      });
    });

    it('should call "clear" method and expect the DOM element to become blank & untouched', () => {
      editor = new AutocompleterEditor(editorArguments);
      const saveSpy = jest.spyOn(editor, 'save');
      editor.loadValue({ ...mockItemData, gender: 'male' });
      editor.show();
      editor.clear();

      expect(saveSpy).toHaveBeenCalled();
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should add custom "fetch" call and expect "renderCollectionItem" callback be called when focusing on the autocomplete input', async () => {
      const mockCollection = [{ value: 'male', label: 'Male' }, { value: 'unknown', label: 'Unknown' }];
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });

      mockColumn.editor = {
        collection: mockCollection,
        editorOptions: { showOnFocus: true } as AutocompleterOption
      };
      editor = new AutocompleterEditor(editorArguments);

      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;
      editorElm.focus();
      editorElm.dispatchEvent(event);

      jest.runAllTimers(); // fast-forward timer

      const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
      expect(autocompleteListElms.length).toBe(2);
      expect(autocompleteListElms[0].textContent).toBe('Male');
      expect(autocompleteListElms[1].textContent).toBe('Unknown');
    });

    it('should call "clear" method when clear button is clicked', () => {
      const mockCollection = [{ value: 'male', label: 'Male' }, { value: 'unknown', label: 'Unknown' }];
      mockColumn.editor = {
        collection: mockCollection,
        editorOptions: { showOnFocus: true } as AutocompleterOption
      };
      editor = new AutocompleterEditor(editorArguments);
      const clearSpy = jest.spyOn(editor, 'clear');

      const clearBtnElm = divContainer.querySelector('.btn.icon-clear') as HTMLButtonElement;
      clearBtnElm.dispatchEvent(new Event('click'));

      expect(clearSpy).toHaveBeenCalled();
    });

    it('should add custom "fetch" call and expect "renderRegularItem" callback be called when focusing on the autocomplete input', async () => {
      const mockCollection = [{ value: 'female', label: 'Female' }, { value: 'undefined', label: 'Undefined' }];
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });

      mockColumn.editor = {
        editorOptions: {
          showOnFocus: true,
          fetch: (_, updateCallback) => updateCallback(mockCollection)
        } as AutocompleterOption
      };
      editor = new AutocompleterEditor(editorArguments);

      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;
      editorElm.focus();
      editorElm.dispatchEvent(event);

      jest.runAllTimers(); // fast-forward timer

      const autocompleteListElms = document.body.querySelectorAll<HTMLDivElement>('.slick-autocomplete div');
      expect(autocompleteListElms.length).toBe(2);
      expect(autocompleteListElms[0].textContent).toBe('Female');
      expect(autocompleteListElms[1].textContent).toBe('Undefined');
    });

    it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element', () => {
      gridOptionMock.darkMode = true;
      const mockCollection = [{ value: 'female', label: 'Female' }, { value: 'undefined', label: 'Undefined' }];
      const event = new (window.window as any).KeyboardEvent('keydown', { key: 'm', bubbles: true, cancelable: true });

      mockColumn.editor = {
        editorOptions: {
          showOnFocus: true,
          fetch: (_, updateCallback) => updateCallback(mockCollection)
        } as AutocompleterOption
      };
      editor = new AutocompleterEditor(editorArguments);

      const editorElm = divContainer.querySelector('input.editor-gender') as HTMLInputElement;
      editorElm.focus();
      editorElm.dispatchEvent(event);

      jest.runAllTimers(); // fast-forward timer

      const autocompleteElm = document.body.querySelector('.slick-autocomplete') as HTMLDivElement;
      expect(autocompleteElm.classList.contains('slick-dark-mode')).toBeTruthy();
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
      editor = new AutocompleterEditor(editorArguments);
      editor.setValue({ value: 'male', label: 'Male' }, true);

      expect(editor.getValue()).toBe('Male');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { gender: 'male' }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new AutocompleterEditor(editorArguments);
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

      editor = new AutocompleterEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { gender: '' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toBe(true);
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

      editor = new AutocompleterEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).not.toHaveBeenCalled();
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorDomElement.disabled).toBe(true);
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

      editor = new AutocompleterEditor(editorArguments);
      editor.loadValue({ ...mockItemData, gender: 'male' });
      editor.show();
      editor.disable();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(editor.editorDomElement.disabled).toBe(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should call "reset" method and expect the DOM element to become blank & untouched and have an empty formValues be passed in the onCompositeEditorChange event', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new AutocompleterEditor(editorArguments);
      editor.loadValue({ ...mockItemData, gender: 'male' });
      editor.show();
      editor.reset('');

      expect(getCellSpy).toHaveBeenCalled();
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(editor.editorDomElement.disabled).toBe(true);
      expect(editor.editorDomElement.value).toEqual('');
    });

    it('should expect "setValue" to have been called and also "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockColumn.editor!.collection = ['male', 'female'];
      mockItemData = { id: 123, gender: 'female', isActive: true };

      editor = new AutocompleterEditor(editorArguments);
      const spySetValue = jest.spyOn(editor, 'setValue');
      const output = editor.handleSelect(mockItemData.gender);

      expect(output).toBe(false);
      expect(spySetValue).toHaveBeenCalledWith('female');
      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { gender: 'female' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });

    describe('collectionOverride callback option', () => {
      it('should create the editor and expect a different collection outputed when using the override', () => {
        const activeCellMock = { row: 0, cell: 0 };
        jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
        const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
          getReturnValue: () => false
        } as any);
        mockColumn.editor = {
          collection: ['Other', 'Male', 'Female'],
          collectionOverride: (inputCollection) => inputCollection.filter(item => item !== 'other')
        };
        editor = new AutocompleterEditor(editorArguments);
        editor.setValue('Male', true);

        expect(editor.getValue()).toBe('Male');
        expect(onCompositeEditorSpy).toHaveBeenCalledWith({
          ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
          formValues: { gender: 'Male' }, editors: {}, triggeredBy: 'system',
        }, expect.anything());
      });
    });
  });
});
