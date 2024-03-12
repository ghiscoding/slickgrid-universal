// mocked modules
jest.mock('@slickgrid-universal/utils', () => ({
  ...(jest.requireActual('@slickgrid-universal/utils') as any),
  getOffset: jest.fn(),
}));

import { Editors } from '../index';
import { LongTextEditor } from '../longTextEditor';
import { AutocompleterOption, Column, ColumnEditor, Editor, EditorArguments, GridOption } from '../../interfaces/index';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { getOffset } from '@slickgrid-universal/utils';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

const gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
  translater: null,
  editorTypingDebounce: 0,
} as unknown as GridOption;

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
  navigateNext: jest.fn(),
  navigatePrev: jest.fn(),
  render: jest.fn(),
  onBeforeEditCell: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
} as unknown as SlickGrid;

describe('LongTextEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: LongTextEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    translateService.use('fr');

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    divContainer.style.height = '500px';
    divContainer.style.width = '600px';
    document.body.innerHTML = '';
    document.body.style.height = '700px';
    document.body.style.width = '1024px';
    document.body.appendChild(divContainer);
    mockColumn = { id: 'title', field: 'title', editable: true, editor: { model: Editors.longText }, editorClass: {} as Editor } as Column;

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
      gridPosition: { top: 0, left: 0, bottom: 10, right: 10, height: 600, width: 800, visible: true },
      position: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
    };
  });

  describe('with invalid Editor instance', () => {
    it('should throw an error when trying to call init without any arguments', (done) => {
      try {
        editor = new LongTextEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, title: 'task 1', isActive: true };
      mockColumn = { id: 'title', field: 'title', editable: true, editor: { model: Editors.longText }, editorClass: {} as Editor } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize the editor', () => {
      gridOptionMock.translater = translateService;
      gridOptionMock.enableTranslate = true;
      editor = new LongTextEditor(editorArguments);
      const editorCount = document.body.querySelectorAll('.slick-large-editor-text.editor-title textarea').length;
      const editorTextCounter = document.body.querySelectorAll<HTMLDivElement>('.slick-large-editor-text.editor-title .editor-footer .counter');
      const currentTextLengthElm = document.body.querySelector('.editor-footer .text-length') as HTMLDivElement;
      const maxTextLengthElm = document.body.querySelector('.editor-footer .max-length') as HTMLDivElement;
      const editorFooterElm = document.body.querySelector('.slick-large-editor-text.editor-title .editor-footer') as HTMLDivElement;
      const buttonCancelElm = editorFooterElm.querySelector('.btn-default') as HTMLButtonElement;
      const buttonSaveElm = editorFooterElm.querySelector('.btn-primary') as HTMLButtonElement;

      expect(editorCount).toBe(1);
      expect(editorTextCounter.length).toBe(1);
      expect(currentTextLengthElm.textContent).toBe('0');
      expect(maxTextLengthElm).toBeNull();
      expect(buttonCancelElm.textContent).toBe('Annuler');
      expect(buttonSaveElm.textContent).toBe('Sauvegarder');
    });

    it('should have an aria-label when creating the editor', () => {
      gridOptionMock.translater = undefined as any;
      editor = new LongTextEditor(editorArguments);
      const editorElm = document.body.querySelector('.slick-large-editor-text.editor-title textarea') as HTMLTextAreaElement;

      expect(editorElm.ariaLabel).toBe('Title Text Editor');
    });

    it('should initialize the editor with default constant text when translate service is not provided', () => {
      gridOptionMock.translater = undefined as any;
      editor = new LongTextEditor(editorArguments);
      const editorCount = document.body.querySelectorAll('.slick-large-editor-text.editor-title textarea').length;
      const editorFooterElm = document.body.querySelector('.slick-large-editor-text.editor-title .editor-footer') as HTMLDivElement;
      const buttonCancelElm = editorFooterElm.querySelector('.btn-default') as HTMLButtonElement;
      const buttonSaveElm = editorFooterElm.querySelector('.btn-primary') as HTMLButtonElement;

      expect(editorCount).toBe(1);
      expect(buttonCancelElm.textContent).toBe('Cancel');
      expect(buttonSaveElm.textContent).toBe('Save');
    });

    it('should initialize the editor even when user define his own editor options', () => {
      mockColumn.editor!.editorOptions = { minLength: 3 } as AutocompleterOption;
      editor = new LongTextEditor(editorArguments);
      const editorCount = document.body.querySelectorAll('.slick-large-editor-text.editor-title textarea').length;

      expect(editorCount).toBe(1);
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.placeholder = testValue;

      editor = new LongTextEditor(editorArguments);
      const editorElm = document.body.querySelector('.slick-large-editor-text.editor-title textarea') as HTMLTextAreaElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new LongTextEditor(editorArguments);
      const editorElm = document.body.querySelector('.slick-large-editor-text.editor-title textarea') as HTMLTextAreaElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor = {
        placeholder: 'test placeholder',
        title: 'test title',
      };

      editor = new LongTextEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" and expect the DOM element value to be the same string when calling "getValue"', () => {
      editor = new LongTextEditor(editorArguments);
      editor.setValue('task 1');

      expect(editor.getValue()).toBe('task 1');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new LongTextEditor(editorArguments);
      editor.setValue('task 1', true);

      expect(editor.getValue()).toBe('task 1');
      expect(editorArguments.item.title).toBe('task 1');
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      editor = new LongTextEditor(editorArguments);
      editor.loadValue(mockItemData);
      const editorElm = editor.editorDomElement;
      const currentTextLengthElm = document.body.querySelector('.editor-footer .text-length') as HTMLDivElement;
      const maxTextLengthElm = document.body.querySelector('.editor-footer .max-length') as HTMLDivElement;

      expect(currentTextLengthElm.textContent).toBe('6');
      expect(maxTextLengthElm).toBeNull();
      expect(editor.getValue()).toBe('task 1');
      expect(editorElm.defaultValue).toBe('task 1');
    });

    it('should hide the DOM element div wrapper when the "hide" method is called', () => {
      editor = new LongTextEditor(editorArguments);
      const wrapperElm = document.body.querySelector('.slick-large-editor-text.editor-title') as HTMLDivElement;
      editor.show();
      expect(wrapperElm.style.display).toBe('block');

      editor.hide();
      expect(wrapperElm.style.display).toBe('none');
    });

    it('should show the DOM element div wrapper when the "show" method is called', () => {
      editor = new LongTextEditor(editorArguments);
      const wrapperElm = document.body.querySelector('.slick-large-editor-text.editor-title') as HTMLDivElement;

      editor.hide();
      expect(wrapperElm.style.display).toBe('none');

      editor.show();
      expect(wrapperElm.style.display).toBe('block');
    });

    it('should enable Dark Mode and expect ".slick-dark-mode" CSS class to be found on parent element', () => {
      gridOptionMock.darkMode = true;
      editor = new LongTextEditor(editorArguments);
      const wrapperElm = document.body.querySelector('.slick-large-editor-text.editor-title') as HTMLDivElement;

      expect(wrapperElm.classList.contains('slick-dark-mode')).toBeTruthy();
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched keyboard event is a new char "a" and it should also update the text counter accordingly', () => {
        const eventKeyDown = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
        const eventInput = new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true });
        mockColumn.editor!.maxLength = 255;

        editor = new LongTextEditor(editorArguments);
        editor.setValue('z');
        const editorElm = document.body.querySelector('.editor-title textarea') as HTMLTextAreaElement;
        const currentTextLengthElm = document.body.querySelector('.editor-footer .text-length') as HTMLDivElement;
        const maxTextLengthElm = document.body.querySelector('.editor-footer .max-length') as HTMLDivElement;

        editor.focus();
        editorElm.dispatchEvent(eventKeyDown);
        editorElm.dispatchEvent(eventInput);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(currentTextLengthElm.textContent).toBe('1');
        expect(maxTextLengthElm.textContent).toBe('255');
        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return False when previously dispatched keyboard event is same string number as current value', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });

        editor = new LongTextEditor(editorArguments);
        const editorElm = document.body.querySelector('.editor-title textarea') as HTMLTextAreaElement;

        editor.loadValue({ id: 1, title: 'a', isActive: true });
        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(false);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return True when previously dispatched keyboard event ENTER', () => {
        const event = new (window.window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

        editor = new LongTextEditor(editorArguments);
        editor.setValue('a');
        const editorElm = document.body.querySelector('.editor-title textarea') as HTMLTextAreaElement;

        editor.focus();
        editorElm.dispatchEvent(event);

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the title property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new LongTextEditor(editorArguments);
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, title: 'task 2', isActive: true });
      });

      it('should apply the value to the title property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'part.title';
        mockItemData = { id: 1, part: { title: 'task 1' }, isActive: true };

        editor = new LongTextEditor(editorArguments);
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

        editor = new LongTextEditor(editorArguments);
        editor.applyValue(mockItemData, 'task 2');

        expect(mockItemData).toEqual({ id: 1, title: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a string', () => {
        mockItemData = { id: 1, title: 'task 1', isActive: true };

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('task 1');
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, title: '', isActive: true };

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, title: null, isActive: true };

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'task.title';
        mockItemData = { id: 1, task: { title: 'task 1' }, isActive: true };

        editor = new LongTextEditor(editorArguments);
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

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 1');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is enabled but value is invalid', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        mockColumn.editor!.validator = (value: any) => {
          if (value.length < 10) {
            return { valid: false, msg: 'Must be at least 10 chars long.' };
          }
          return { valid: true, msg: '' };
        };
        const commitCurrentSpy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');
        const commitChangeSpy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 1');
        editor.save();

        expect(commitCurrentSpy).not.toHaveBeenCalled();
        expect(commitChangeSpy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 1');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should not call anything when the input value is empty but is required', () => {
        mockItemData = { id: 1, title: '', isActive: true };
        mockColumn.editor!.required = true;
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('');
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describe('handleKeyDown private method', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call the "save" method when the Ctrl+ENTER combination event is triggered', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 2');
        const spySave = jest.spyOn(editor, 'save');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
          key: 'Enter',
          ctrlKey: true,
          bubbles: true
        }));

        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should call the "save" method when the Ctrl+s combination event is triggered', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 2');
        const spySave = jest.spyOn(editor, 'save');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          bubbles: true
        }));

        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should call the "save" method when the Ctrl+S (uppercase S) combination event is triggered', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue('task 2');
        const spySave = jest.spyOn(editor, 'save');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
          key: 'S',
          ctrlKey: true,
          bubbles: true
        }));

        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should call the "cancel" method when the Escape keydown event is triggered', () => {
        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const spyCancel = jest.spyOn(editor, 'cancel');
        const editorElm = editor.editorDomElement;

        editorElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true
        }));

        expect(spyCancel).toHaveBeenCalled();
      });

      it('should call the grid "navigatePrev" method when the Shift+TAB combination event is triggered', () => {
        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const editorElm = editor.editorDomElement;
        const spyNavigate = jest.spyOn(gridStub, 'navigatePrev');

        editorElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true
        }));

        expect(spyNavigate).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should call the grid "navigateNext" method when the TAB (without shift) event is triggered', () => {
        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const editorElm = editor.editorDomElement;
        const spyNavigate = jest.spyOn(gridStub, 'navigateNext');

        editorElm.dispatchEvent(new (window.window as any).KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: false,
          bubbles: true
        }));

        expect(spyNavigate).toHaveBeenCalled();
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('on button clicked events', () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it('should call "save" method when the save button is clicked', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };

        editor = new LongTextEditor(editorArguments);
        const spySave = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor.loadValue(mockItemData);
        const editorFooterElm = document.body.querySelector('.slick-large-editor-text.editor-title .editor-footer') as HTMLDivElement;
        const buttonSaveElm = editorFooterElm.querySelector('.btn-primary') as HTMLButtonElement;

        buttonSaveElm.click();

        expect(spySave).toHaveBeenCalled();
      });

      it('should call "cancel" method when the cancel button is clicked', () => {
        mockItemData = { id: 1, title: 'task', isActive: true };

        editor = new LongTextEditor(editorArguments);
        editor.loadValue(mockItemData);
        const spyCancel = jest.spyOn(editorArguments, 'cancelChanges');

        const editorFooterElm = document.body.querySelector('.slick-large-editor-text.editor-title .editor-footer') as HTMLDivElement;
        const buttonCancelElm = editorFooterElm.querySelector('.btn-default') as HTMLButtonElement;

        buttonCancelElm.click();

        expect(spyCancel).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return True when field is required and input is a valid input value', () => {
        mockColumn.editor!.required = true;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is lower than a minLength defined', () => {
        mockColumn.editor!.minLength = 5;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is at least 5 character(s)' });
      });

      it('should return False when field is lower than a minLength defined using exclusive operator', () => {
        mockColumn.editor!.minLength = 5;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is more than 5 character(s)' });
      });

      it('should return True when field is equal to the minLength defined', () => {
        mockColumn.editor!.minLength = 4;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is greater than a maxLength defined', () => {
        mockColumn.editor!.maxLength = 10;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
      });

      it('should return False when field is greater than a maxLength defined using exclusive operator', () => {
        mockColumn.editor!.maxLength = 10;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 10 characters' });
      });

      it('should return True when field is equal to the maxLength defined', () => {
        mockColumn.editor!.maxLength = 16;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is equal to the maxLength defined and "operatorType" is set to "inclusive"', () => {
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to the maxLength defined but "operatorType" is set to "exclusive"', () => {
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than 16 characters' });
      });

      it('should return False when field is not between minLength & maxLength defined', () => {
        mockColumn.editor!.minLength = 0;
        mockColumn.editor!.maxLength = 10;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text length is between 0 and 10 characters' });
      });

      it('should return True when field is is equal to maxLength defined when both min/max values are defined', () => {
        mockColumn.editor!.minLength = 0;
        mockColumn.editor!.maxLength = 16;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text is 16 chars');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return True when field is is equal to minLength defined when "operatorType" is set to "inclusive" and both min/max values are defined', () => {
        mockColumn.editor!.minLength = 4;
        mockColumn.editor!.maxLength = 15;
        mockColumn.editor!.operatorConditionalType = 'inclusive';
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'text');

        expect(validation).toEqual({ valid: true, msg: '' });
      });

      it('should return False when field is equal to maxLength but "operatorType" is set to "exclusive" when both min/max lengths are defined', () => {
        mockColumn.editor!.minLength = 4;
        mockColumn.editor!.maxLength = 16;
        mockColumn.editor!.operatorConditionalType = 'exclusive';
        editor = new LongTextEditor(editorArguments);
        const validation1 = editor.validate(undefined, 'text is 16 chars');
        const validation2 = editor.validate(undefined, 'text');

        expect(validation1).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
        expect(validation2).toEqual({ valid: false, msg: 'Please make sure your text length is between 4 and 16 characters' });
      });

      it('should return False when field is greater than a maxValue defined', () => {
        mockColumn.editor!.maxLength = 10;
        editor = new LongTextEditor(editorArguments);
        const validation = editor.validate(undefined, 'Task is longer than 10 chars');

        expect(validation).toEqual({ valid: false, msg: 'Please make sure your text is less than or equal to 10 characters' });
      });
    });

    describe('Truncate Text when using maxLength', () => {
      it('should truncate text to 10 chars when the provided text (with input/keydown event) is more than maxLength(10)', () => {
        const eventInput = new (window.window as any).KeyboardEvent('input', { key: 'a', bubbles: true, cancelable: true });
        mockColumn.editor!.maxLength = 10;

        editor = new LongTextEditor(editorArguments);

        editor.setValue('some extra long text that is over the maxLength');
        const editorElm = document.body.querySelector('.editor-title textarea') as HTMLTextAreaElement;

        editor.focus();
        editorElm.dispatchEvent(eventInput);

        const currentTextLengthElm = document.body.querySelector('.editor-footer .text-length') as HTMLDivElement;
        const maxTextLengthElm = document.body.querySelector('.editor-footer .max-length') as HTMLDivElement;

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editorElm.value).toBe('some extra');
        expect(currentTextLengthElm.textContent).toBe('10');
        expect(maxTextLengthElm.textContent).toBe('10');
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should truncate text to 10 chars when the provided text (with paste event) is more than maxLength(10)', () => {
        const eventPaste = new (window.window as any).CustomEvent('paste', { bubbles: true, cancelable: true });
        mockColumn.editor!.maxLength = 10;

        editor = new LongTextEditor(editorArguments);

        editor.setValue('some extra long text that is over the maxLength');
        const editorElm = document.body.querySelector('.editor-title textarea') as HTMLTextAreaElement;

        editor.focus();
        editorElm.dispatchEvent(eventPaste);

        const currentTextLengthElm = document.body.querySelector('.editor-footer .text-length') as HTMLDivElement;
        const maxTextLengthElm = document.body.querySelector('.editor-footer .max-length') as HTMLDivElement;

        expect(gridStub.focus).toHaveBeenCalled();
        expect(editorElm.value).toBe('some extra');
        expect(currentTextLengthElm.textContent).toBe('10');
        expect(maxTextLengthElm.textContent).toBe('10');
        expect(editor.isValueChanged()).toBe(true);
      });
    });

    describe('Position Editor', () => {
      beforeEach(() => {
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });

        // cell height/width
        editorArguments.position = { top: 0, left: 900, bottom: 10, right: 10, height: 100, width: 310, visible: true };
        Object.defineProperty(editorArguments.container, 'offsetHeight', { writable: true, configurable: true, value: 33 });
        Object.defineProperty(editorArguments.container, 'offsetWidth', { writable: true, configurable: true, value: 100 });
      });

      it('should assume editor to positioned on the right & bottom of the cell when there is enough room', () => {
        (getOffset as jest.Mock).mockReturnValue({ top: 100, left: 200 }); // mock cell position

        editor = new LongTextEditor(editorArguments);
        const editorElm = document.body.querySelector('.slick-large-editor-text') as HTMLDivElement;

        expect(editorElm.style.top).toBe('100px');
        expect(editorElm.style.left).toBe('200px');
      });

      it('should assume editor to positioned on the right of the cell when there is NOT enough room on the left', () => {
        (getOffset as jest.Mock).mockReturnValue({ top: 100, left: 900 }); // mock cell position that will be over max of 1024px

        editor = new LongTextEditor(editorArguments);
        const editorElm = document.body.querySelector('.slick-large-editor-text') as HTMLDivElement;

        expect(editorElm.style.top).toBe('100px');
        expect(editorElm.style.left).toBe('690px'); // cellLeftPos - (editorWidth - cellWidth + marginAdjust) => (900 - (310 - 100 + 0))
      });

      it('should assume editor to positioned on the top of the cell when there is NOT enough room on the bottom', () => {
        (getOffset as jest.Mock).mockReturnValue({ top: 550, left: 200 }); // mock cell position that will be over max of 600px

        editor = new LongTextEditor(editorArguments);
        const editorElm = document.body.querySelector('.slick-large-editor-text') as HTMLDivElement;

        expect(editorElm.style.top).toBe('483px');
        expect(editorElm.style.left).toBe('200px'); // cellTopPos - (editorHeight - cellHeight) => (550 - (100 - 33))
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
      editor = new LongTextEditor(editorArguments);
      editor.setValue('task 2', true);

      expect(editor.getValue()).toBe('task 2');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { title: 'task 2' }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new LongTextEditor(editorArguments);
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

      editor = new LongTextEditor(editorArguments);
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

      editor = new LongTextEditor(editorArguments);
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

      editor = new LongTextEditor(editorArguments);
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

      editor = new LongTextEditor(editorArguments);
      editor.loadValue(mockItemData);
      const editorElm = document.body.querySelector('.editor-title textarea') as HTMLTextAreaElement;
      editorElm.value = 'task 2';
      editorElm.dispatchEvent(new (window.window as any).Event('input'));

      jest.advanceTimersByTime(50);

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { title: 'task 2' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
