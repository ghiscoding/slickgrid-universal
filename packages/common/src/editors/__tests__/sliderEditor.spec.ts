import { Editors } from '../index';
import { SliderEditor } from '../sliderEditor';
import { Column, ColumnEditor, EditorArguments, GridOption, SlickDataView, SlickGrid, SlickNamespace } from '../../interfaces/index';

declare const Slick: SlickNamespace;
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

describe('SliderEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: SliderEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.float }, internalColumnEditor: {} } as Column;

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
        editor = new SliderEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, price: 213, isActive: true };
      mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.float }, internalColumnEditor: {} } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      editor = new SliderEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('.slider-editor input.editor-price').length;
      expect(editorCount).toBe(1);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      (mockColumn.internalColumnEditor as ColumnEditor).title = testValue;

      editor = new SliderEditor(editorArguments);
      const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.internalColumnEditor = {
        title: 'test title',
      };

      editor = new SliderEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.internalColumnEditor);
    });

    it('should create the input editor with defined value and a different step size when "valueStep" is provided', () => {
      (mockColumn.internalColumnEditor as ColumnEditor).valueStep = 5;
      mockItemData = { id: 1, price: 15, isActive: true };

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const editorNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
      const editorInputElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;

      expect(editorInputElm.step).toBe('5');
      expect(editorNumberElm.textContent).toBe('15');
      expect(editor.getValue()).toEqual('15');
    });

    it('should create the input editor with min slider values being set by editor "minValue"', () => {
      mockColumn.internalColumnEditor = {
        minValue: 4,
        maxValue: 69,
      };

      editor = new SliderEditor(editorArguments);

      const editorInputElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
      const editorNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

      expect(editorInputElm.min).toBe('4');
      expect(editorInputElm.max).toBe('69');
      expect(editorNumberElm.textContent).toBe('4');
    });

    it('should create the input editor with min/max slider values being set by editor "sliderStartValue" through the editor params', () => {
      mockColumn.internalColumnEditor = { params: { sliderStartValue: 4 } };
      mockItemData = { id: 1, price: null, isActive: true };

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);

      const editorInputElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
      const editorNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;

      expect(editor.getValue()).toEqual('4');
      expect(editorInputElm.min).toBe('0');
      expect(editorInputElm.defaultValue).toBe('4');
      expect(editorNumberElm.textContent).toBe('4');
    });

    it('should create the input editor with default search terms range but without showing side numbers when "hideSliderNumber" is set in params', () => {
      (mockColumn.internalColumnEditor as ColumnEditor).params = { hideSliderNumber: true };
      mockItemData = { id: 1, price: null, isActive: true };

      editor = new SliderEditor(editorArguments);

      const editorNumberElms = divContainer.querySelectorAll<HTMLInputElement>('.input-group-text');

      expect(editorNumberElms.length).toBe(0);
      expect(editor.getValue()).toEqual('0');
    });

    it('should call "setValue" and expect the DOM element value to be the same but as a string when calling "getValue"', () => {
      editor = new SliderEditor(editorArguments);
      editor.setValue(85);

      expect(editor.getValue()).toBe('85');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      editor = new SliderEditor(editorArguments);
      editor.setValue(85, true);

      expect(editor.getValue()).toBe('85');
      expect(editorArguments.item.price).toBe(85);
    });

    it('should call "cancel" and expect "cancelChanges" to be called in the Slickgrid editor object', () => {
      const spy = jest.spyOn(editorArguments, 'cancelChanges');
      editor = new SliderEditor(editorArguments);
      editor.cancel();

      expect(spy).toHaveBeenCalled();
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      mockColumn.internalColumnEditor = { maxValue: 500 };
      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const editorInputElm = editor.editorInputDomElement;
      const editorElm = editor.editorDomElement;

      expect(editor.getValue()).toBe('213');
      expect(editorElm).toBeTruthy();
      expect(editorInputElm[0].defaultValue).toBe('0');
    });

    it('should update slider number every time a change event happens on the input slider', () => {
      (mockColumn.internalColumnEditor as ColumnEditor).params = { hideSliderNumber: false };
      mockItemData = { id: 1, price: 32, isActive: true };
      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValue(17);

      const editorElm = divContainer.querySelector('.slider-container.slider-editor') as HTMLDivElement;
      const editorNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
      const mockEvent = new CustomEvent('change');
      Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: { value: '13' } });
      editorElm.dispatchEvent(mockEvent);

      expect(editor.isValueChanged()).toBe(true);
      expect(editorNumberElm.textContent).toBe('13');
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched change event is a different slider input number', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).params = { sliderStartValue: 5 };
        mockItemData = { id: 1, price: 32, isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(45);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new CustomEvent('change'));
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False when previously dispatched change event is the same as default (0) slider input number', () => {
        mockItemData = { id: 1, price: 0, isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new CustomEvent('change'));

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return False when previously dispatched change event is the same as default (0) slider input number but provided as a string', () => {
        mockItemData = { id: 1, price: '0', isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new CustomEvent('change'));

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return False when previously dispatched change event is the same input number as "sliderStartValue" provided by the user', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).params = { sliderStartValue: 5 };
        mockItemData = { id: 1, price: 5, isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new CustomEvent('change'));

        expect(editor.isValueChanged()).toBe(false);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the price property when it passes validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = null as any;
        mockItemData = { id: 1, price: 456, isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.applyValue(mockItemData, 78);

        expect(mockItemData).toEqual({ id: 1, price: 78, isActive: true });
      });

      it('should apply the value to the price property with a field having dot notation (complex object) that passes validation', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).validator = null as any;
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 456 }, isActive: true };

        editor = new SliderEditor(editorArguments);
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

        editor = new SliderEditor(editorArguments);
        editor.applyValue(mockItemData, 4);

        expect(mockItemData).toEqual({ id: 1, price: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a number', () => {
        mockItemData = { id: 1, price: 33, isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(33);
      });

      it('should return serialized value as a number even when the item property value is a number in a string', () => {
        mockItemData = { id: 1, price: '33', isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(33);
      });

      it('should return serialized value as the default minimum number (0) when item value provided is an empty string', () => {
        mockItemData = { id: 1, price: '', isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(0);
      });

      it('should return serialized value as the default minimum number (0) when item value is null', () => {
        mockItemData = { id: 1, price: null, isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(0);
      });

      it('should return serialized value as the custom "sliderStartValue" number when item value is null', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).params = { sliderStartValue: 5 };
        mockItemData = { id: 1, price: null, isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe(5);
      });

      it('should return value as a number when using a dot (.) notation for complex object', () => {
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 5 }, isActive: true };

        editor = new SliderEditor(editorArguments);
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

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitCurrentEdit" even when the input value is the same as the default value', () => {
        mockItemData = { id: 1, price: 0, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "getEditorLock" and "save" methods when "hasAutoCommitEdit" is enabled and the event "focusout" is triggered', () => {
        mockItemData = { id: 1, price: 32, isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spyCommit = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(35);
        const spySave = jest.spyOn(editor, 'save');
        const editorElm = editor.editorInputDomElement;

        editorElm.trigger('mouseup');
        editorElm[0].dispatchEvent(new (window.window as any).Event('mouseup'));
        jest.runAllTimers(); // fast-forward timer

        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).required = true;
        editor = new SliderEditor(editorArguments);
        const validation = editor.validate(null as any, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when field is not between minValue & maxValue defined', () => {
        (mockColumn.internalColumnEditor as ColumnEditor).minValue = 10;
        (mockColumn.internalColumnEditor as ColumnEditor).maxValue = 99;
        editor = new SliderEditor(editorArguments);
        const validation = editor.validate(null as any, 100);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number between 10 and 99' });
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
      editor = new SliderEditor(editorArguments);
      editor.setValue(95, true);

      expect(editor.getValue()).toBe('95');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 95 }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(undefined);

      editor = new SliderEditor(editorArguments);
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

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 0 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorInputDomElement.attr('disabled')).toEqual('disabled');
      expect(editor.editorInputDomElement.val()).toEqual('0');
    });

    it('should call "show" and expect the DOM element to become disabled and empty when "onBeforeEditCell" returns false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(false);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      gridOptionMock.compositeEditorOptions = {
        excludeDisabledFieldFormValues: true
      };

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorInputDomElement.attr('disabled')).toEqual('disabled');
      expect(editor.editorInputDomElement.val()).toEqual('0');
    });

    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue(undefined);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue(false);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 93, isActive: true };

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValue(93);
      const editorElm = editor.editorInputDomElement;
      editorElm.trigger('mouseup');
      editorElm[0].dispatchEvent(new (window.window as any).Event('mouseup'));

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 93 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
