import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// import 3rd party lib multiple-select for the tests
import 'multiple-select-vanilla';

import { Editors } from '../index.js';
import { SingleSelectEditor } from '../singleSelectEditor.js';
import type { Column, Editor, EditorArguments, GridOption } from '../../interfaces/index.js';
import type { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import type { SlickDataView, SlickGrid } from '../../core/index.js';

const containerId = 'demo-container';

// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: vi.fn(),
} as unknown as SlickDataView;

const gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
  translater: null,
} as unknown as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: vi.fn(),
};

const gridStub = {
  focus: vi.fn(),
  getOptions: () => gridOptionMock,
  getColumns: vi.fn(),
  getEditorLock: () => getEditorLockMock,
  getHeaderRowColumn: vi.fn(),
  navigateNext: vi.fn(),
  navigatePrev: vi.fn(),
  render: vi.fn(),
  sanitizeHtmlString: (str) => str,
} as unknown as SlickGrid;

describe('SingleSelectEditor', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let editor: SingleSelectEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
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
      columnMetaData: null,
      dataView: dataViewStub,
      gridPosition: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
      position: { top: 0, left: 0, bottom: 10, right: 10, height: 100, width: 100, visible: true },
    };
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, gender: 'male', isActive: true };
      mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.multipleSelect }, editorClass: {} as Editor } as Column;
      mockColumn.editor!.collection = [
        { value: '', label: '' },
        { value: 'male', label: 'male' },
        { value: 'female', label: 'female' },
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
      editor = new SingleSelectEditor(editorArguments);
      const editorCount = document.body.querySelectorAll('select.ms-filter.editor-gender').length;

      expect(editorCount).toBe(1);
      expect(editor.selectOptions.renderOptionLabelAsHtml).toBeFalsy();
      expect(editor.selectOptions.useSelectOptionLabelToHtml).toBeFalsy();
    });

    it('should hide the DOM element div wrapper when the "hide" method is called', () => {
      editor = new SingleSelectEditor(editorArguments);

      editor.show(null);
      expect(editor.msInstance!.getDropElement()?.style.display).toBe('block');

      editor.hide();
      expect(editor.msInstance!.getDropElement()?.style.display).toBe('none');
    });

    it('should show the DOM element div wrapper when the "show" method is called', () => {
      editor = new SingleSelectEditor(editorArguments);

      editor.hide();
      expect(editor.msInstance!.getDropElement()?.style.display).toBe('none');

      editor.show(null);
      expect(editor.msInstance!.getDropElement()?.style.display).toBe('block');
    });

    it('should call "setValue" with a single string and expect the string to be returned as an single string when calling "getValue"', () => {
      editor = new SingleSelectEditor(editorArguments);
      editor.setValue('male');

      expect(editor.getValue()).toEqual('male');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new SingleSelectEditor(editorArguments);
      editor.setValue('male', true);

      expect(editor.getValue()).toEqual('male');
      expect(editorArguments.item.gender).toBe('male');
    });

    describe('isValueChanged method', () => {
      it('should return False if the value is undefined', () => {
        editor = new SingleSelectEditor(editorArguments, 0);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=radio]`);
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        editorListElm[0].checked = false;

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return True after doing a check of an option', () => {
        editor = new SingleSelectEditor(editorArguments, 0);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=radio]`);
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        editorListElm[0].checked = true;
        editorListElm[0].dispatchEvent(new CustomEvent('click'));

        expect(editorListElm.length).toBe(3);
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False after re-selecting the same option as the one loaded', () => {
        mockColumn.editor!.collection = ['male', 'female'];
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SingleSelectEditor(editorArguments, 0);
        editor.loadValue(mockItemData);

        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li input[type=radio]`);
        editorBtnElm.click();

        // we can use property "checked" or dispatch an event
        editorListElm[0].checked = true;
        editorListElm[0].dispatchEvent(new CustomEvent('click'));

        expect(editorListElm.length).toBe(2);
        expect(editor.isValueChanged()).toBe(false);
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a string', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SingleSelectEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('male');
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a string', () => {
        mockItemData = { id: 1, gender: 'male', isActive: true };

        editor = new SingleSelectEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual('male');
      });

      it('should return serialized value as an empty array when item value is also an empty string', () => {
        mockItemData = { id: 1, gender: '', isActive: true };

        editor = new SingleSelectEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, gender: null, isActive: true };

        editor = new SingleSelectEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual('');
      });

      it('should return value as a string when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'employee.gender';
        mockColumn.editor!.collection = ['male', 'female'];
        mockItemData = { id: 1, employee: { gender: 'male' }, isActive: true };

        editor = new SingleSelectEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toEqual('male');
      });
    });

    describe('enableRenderHtml property', () => {
      it('should create the multi-select editor with a default value and have the HTML rendered when "enableRenderHtml" is set', () => {
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

        editor = new SingleSelectEditor(editorArguments, 0);
        editor.setValue(false);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li span`);
        editorBtnElm.click();

        expect(editor.selectOptions.renderOptionLabelAsHtml).toBeTruthy();
        expect(editor.selectOptions.useSelectOptionLabelToHtml).toBeFalsy();
        expect(editor.getValue()).toEqual('');
        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].innerHTML).toBe('<i class="mdi mdi-check"></i> True');
      });

      it('should create the multi-select editor with a default value and have the HTML rendered when "enableRenderHtml" is set and has <script> tag', () => {
        mockColumn.field = 'isEffort';
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
        mockItemData = { id: 1, gender: 'male', isEffort: true };

        editor = new SingleSelectEditor(editorArguments, 0);
        editor.loadValue(mockItemData);
        const editorBtnElm = divContainer.querySelector('.ms-parent.ms-filter.editor-gender button.ms-choice') as HTMLButtonElement;
        const editorListElm = divContainer.querySelectorAll<HTMLInputElement>(`[data-name=editor-gender].ms-drop ul>li span`);

        editorBtnElm.click();
        editorListElm[0].click();

        expect(editorBtnElm).toBeTruthy();
        expect(editor.getValue()).toEqual(`<i class="mdi mdi-check"></i> : true`);
        expect(editorListElm.length).toBe(2);
        expect(editorListElm[0].innerHTML).toBe('<i class="mdi mdi-check"></i> : True');
      });
    });
  });
});
