import { Editors } from '../index';
import { SliderEditor } from '../sliderEditor';
import type { Column, Editor, EditorArguments, GridOption, type SliderOption } from '../../interfaces/index';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index';

jest.useFakeTimers();

const containerId = 'demo-container';
// define a <div> container to simulate the grid container
const template = `<div id="${containerId}"></div>`;

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

let gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
} as GridOption;

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
  render: jest.fn(),
  onBeforeEditCell: new SlickEvent(),
  onMouseEnter: new SlickEvent(),
  onCompositeEditorChange: new SlickEvent(),
} as unknown as SlickGrid;

describe('SliderEditor', () => {
  let divContainer: HTMLDivElement;
  let editor: SliderEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    consoleSpy = jest.spyOn(global.console, 'warn').mockReturnValue();
    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.float } } as Column;

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
    gridOptionMock = {
      autoCommitEdit: false,
      editable: true,
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
      mockColumn = { id: 'price', field: 'price', editable: true, editor: { model: Editors.float }, editorClass: {} as Editor } as Column;

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

    it('should initialize the editor with slider value define in user editor options', () => {
      mockColumn.editor!.editorOptions = { sliderStartValue: 1 } as SliderOption;
      editor = new SliderEditor(editorArguments);

      expect(editor.editorInputDomElement.defaultValue).toBe('1');
      expect(editor.editorInputDomElement.value).toBe('1');
    });

    it('should initialize the editor with slider value define in global default user editor options', () => {
      gridOptionMock.defaultEditorOptions = {
        slider: { sliderStartValue: 2 }
      };
      editor = new SliderEditor(editorArguments);

      expect(editor.editorInputDomElement.defaultValue).toBe('2');
      expect(editor.editorInputDomElement.value).toBe('2');
    });

    it('should have an aria-label when creating the editor', () => {
      editor = new SliderEditor(editorArguments);
      const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;

      expect(editorElm.ariaLabel).toBe('Price Slider Editor');
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new SliderEditor(editorArguments);
      const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor = {
        title: 'test title',
      };

      editor = new SliderEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should create the input editor with defined value and a different step size when "valueStep" is provided', () => {
      mockColumn.editor!.valueStep = 5;
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
      mockColumn.editor = {
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

    it('should create the input editor with min/max slider values being set by editor "sliderStartValue" through the editor editorOptions', () => {
      mockColumn.editor = { editorOptions: { sliderStartValue: 4 } };
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

    it('should create the input editor with default search terms range but without showing side numbers when "hideSliderNumber" is set in editorOptions', () => {
      mockColumn.editor!.editorOptions = { hideSliderNumber: true };
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
      mockColumn.editor = { maxValue: 500 };
      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const editorInputElm = editor.editorInputDomElement;
      const editorElm = editor.editorDomElement;

      expect(editor.getValue()).toBe('213');
      expect(editorElm).toBeTruthy();
      expect(editorInputElm.defaultValue).toBe('0');
    });

    it('should update slider number every time a change event happens on the input slider', () => {
      const cellMouseEnterSpy = jest.spyOn(gridStub.onMouseEnter, 'notify');
      mockColumn.editor!.editorOptions = { hideSliderNumber: false };
      mockItemData = { id: 1, price: 32, isActive: true };
      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValue(17);

      const inputElm = divContainer.querySelector('.slider-editor-input.editor-price') as HTMLDivElement;
      const editorNumberElm = divContainer.querySelector('.input-group-text') as HTMLInputElement;
      const mockEvent = new CustomEvent('change');
      Object.defineProperty(mockEvent, 'target', { writable: true, configurable: true, value: { value: '17' } });
      inputElm.dispatchEvent(mockEvent);

      expect(editor.isValueChanged()).toBe(true);
      expect(editorNumberElm.textContent).toBe('17');
      expect(cellMouseEnterSpy).toHaveBeenCalledWith({ column: mockColumn, grid: gridStub }, expect.anything());
    });

    describe('isValueChanged method', () => {
      it('should return True when previously dispatched change event is a different slider input number', () => {
        mockColumn.editor!.editorOptions = { sliderStartValue: 5 };
        mockItemData = { id: 1, price: 32, isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);
        editor.setValue(45);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new Event('change'));
        expect(editor.isValueChanged()).toBe(true);
      });

      it('should return False when previously dispatched change event is the same as default (0) slider input number', () => {
        mockItemData = { id: 1, price: 0, isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new Event('change'));

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return False when previously dispatched change event is the same as default (0) slider input number but provided as a string', () => {
        mockItemData = { id: 1, price: '0', isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new Event('change'));

        expect(editor.isValueChanged()).toBe(false);
      });

      it('should return False when previously dispatched change event is the same input number as "sliderStartValue" provided by the user', () => {
        mockColumn.editor!.editorOptions = { sliderStartValue: 5 };
        mockItemData = { id: 1, price: 5, isActive: true };
        editor = new SliderEditor(editorArguments);
        editor.loadValue(mockItemData);

        const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
        editorElm.dispatchEvent(new Event('change'));

        expect(editor.isValueChanged()).toBe(false);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the price property when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockItemData = { id: 1, price: 456, isActive: true };

        editor = new SliderEditor(editorArguments);
        editor.applyValue(mockItemData, 78);

        expect(mockItemData).toEqual({ id: 1, price: 78, isActive: true });
      });

      it('should apply the value to the price property with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.field = 'part.price';
        mockItemData = { id: 1, part: { price: 456 }, isActive: true };

        editor = new SliderEditor(editorArguments);
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
        mockColumn.editor!.editorOptions = { sliderStartValue: 5 };
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
        editor.focus();
        editor.loadValue(mockItemData);
        editor.save();

        expect(gridStub.focus).toHaveBeenCalled();
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

        editorElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
        jest.runAllTimers(); // fast-forward timer

        expect(editor.isValueTouched()).toBe(true);
        expect(spyCommit).toHaveBeenCalled();
        expect(spySave).toHaveBeenCalled();
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new SliderEditor(editorArguments);
        const validation = editor.validate(null as any, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return False when field is not between minValue & maxValue defined', () => {
        mockColumn.editor!.minValue = 10;
        mockColumn.editor!.maxValue = 99;
        editor = new SliderEditor(editorArguments);
        const validation = editor.validate(null as any, 100);

        expect(validation).toEqual({ valid: false, msg: 'Please enter a valid number between 10 and 99' });
      });
    });

    it('should enableSliderTrackColoring and trigger a change event and expect slider track to have background color', () => {
      mockColumn.editor!.editorOptions = { sliderStartValue: 5, enableSliderTrackColoring: true };
      mockItemData = { id: 1, price: 80, isActive: true };
      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValue(45);

      const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
      editorElm.dispatchEvent(new Event('change'));

      expect(editor.sliderOptions?.sliderTrackBackground).toBe('linear-gradient(to right, #eee 0%, var(--slick-slider-filter-thumb-color, #86bff8) 0%, var(--slick-slider-filter-thumb-color, #86bff8) 45%, #eee 45%)');
    });

    it('should click on the slider track and expect handle to move to the new position', () => {
      mockColumn.editor!.editorOptions = { sliderStartValue: 5, enableSliderTrackColoring: true };
      editor = new SliderEditor(editorArguments);

      const editorElm = divContainer.querySelector('.slider-editor input.editor-price') as HTMLInputElement;
      editorElm.dispatchEvent(new Event('change'));

      const sliderInputs = divContainer.querySelectorAll<HTMLInputElement>('.slider-editor-input');
      const sliderTrackElm = divContainer.querySelector('.slider-track') as HTMLDivElement;

      const sliderRightChangeSpy = jest.spyOn(sliderInputs[0], 'dispatchEvent');

      const clickEvent = new Event('click');
      Object.defineProperty(clickEvent, 'offsetX', { writable: true, configurable: true, value: 56 });
      Object.defineProperty(sliderTrackElm, 'offsetWidth', { writable: true, configurable: true, value: 75 });
      sliderTrackElm.dispatchEvent(clickEvent);

      expect(sliderRightChangeSpy).toHaveBeenCalled();
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
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new SliderEditor(editorArguments);
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

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 0 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorInputDomElement.disabled).toBeTruthy();
      expect(editor.editorInputDomElement.value).toEqual('0');
    });

    it('should call "show" and expect the DOM element to become disabled and empty when "onBeforeEditCell" returns false', () => {
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

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.editorInputDomElement.disabled).toBeTruthy();
      expect(editor.editorInputDomElement.value).toEqual('0');
    });

    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, price: 93, isActive: true };

      editor = new SliderEditor(editorArguments);
      editor.loadValue(mockItemData);
      editor.setValue(93);
      const editorElm = editor.editorInputDomElement;
      editorElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));

      expect(getCellSpy).toHaveBeenCalled();
      expect(editor.isValueTouched()).toBe(true);
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { price: 93 }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
