// import 3rd party lib multiple-select for the tests
import 'multiple-select-modified';

import { Editors } from '../index';
import { MultipleSelectEditor } from '../multipleSelectEditor';
import { Column, SlickDataView, EditorArguments, GridOption, SlickGrid, ColumnEditor } from '../../interfaces/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';

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
  translater: null,
} as unknown as GridOption;

const getEditorLockMock = {
  commitCurrentEdit: jest.fn(),
};

const gridStub = {
  getOptions: () => gridOptionMock,
  getColumns: jest.fn(),
  getEditorLock: () => getEditorLockMock,
  getHeaderRowColumn: jest.fn(),
  navigateNext: jest.fn(),
  navigatePrev: jest.fn(),
  render: jest.fn(),
} as unknown as SlickGrid;

describe('MultipleSelectEditor', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let editor: MultipleSelectEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.multipleSelect }, internalColumnEditor: {} } as Column;

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

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, gender: 'male', isActive: true };
      mockColumn = { id: 'gender', field: 'gender', editable: true, editor: { model: Editors.multipleSelect }, internalColumnEditor: {} } as Column;
      (mockColumn.internalColumnEditor as ColumnEditor).collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      (mockColumn.internalColumnEditor as ColumnEditor).collection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];
      gridOptionMock.translater = translateService;
      editor = new MultipleSelectEditor(editorArguments);
      const editorCount = document.body.querySelectorAll('select.ms-filter.editor-gender').length;
      const spy = jest.spyOn(editor, 'show');
      jest.runAllTimers(); // fast-forward timer

      expect(spy).toHaveBeenCalled();
      expect(editorCount).toBe(1);
    });

    it('should call "setValue" with a single string and expect the string to be returned as an array when calling "getValue"', () => {
      editor = new MultipleSelectEditor(editorArguments);
      editor.setValue(['male']);

      expect(editor.getValue()).toEqual(['male']);
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new MultipleSelectEditor(editorArguments);
      editor.setValue(['male'], true);

      expect(editor.getValue()).toEqual(['male']);
      expect(editorArguments.item.gender).toEqual(['male']);
    });

    it('should hide the DOM element div wrapper when the "hide" method is called', () => {
      editor = new MultipleSelectEditor(editorArguments);
      const editorElm = document.body.querySelector('[name=editor-gender].ms-drop') as HTMLDivElement;

      editor.show();
      expect(editorElm.style.display).toBe('');

      editor.hide();
      expect(editorElm.style.display).toBe('none');
    });

    it('should show the DOM element div wrapper when the "show" method is called', () => {
      editor = new MultipleSelectEditor(editorArguments);
      const editorElm = document.body.querySelector('[name=editor-gender].ms-drop') as HTMLDivElement;

      editor.hide();
      expect(editorElm.style.display).toBe('none');

      editor.show();
      expect(editorElm.style.display).toBe('');
    });
  });
});
