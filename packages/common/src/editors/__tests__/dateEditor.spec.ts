import moment from 'moment-tiny';
import { VanillaCalendar } from 'vanilla-calendar-picker';

import { Editors } from '../index';
import { DateEditor } from '../dateEditor';
import { FieldType } from '../../enums/index';
import { Column, Editor, EditorArguments, GridOption } from '../../interfaces/index';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import { SlickEvent, type SlickDataView, type SlickGrid } from '../../core/index';

const dataViewStub = {
  refresh: jest.fn(),
} as unknown as SlickDataView;

let gridOptionMock = {
  autoCommitEdit: false,
  editable: true,
  translater: null,
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
  sanitizeHtmlString: (str) => str,
} as unknown as SlickGrid;

const gridId = 'grid1';
const gridUid = 'slickgrid_124343';
const template =
  `<div class="slickgrid-container">
    <div id="slickGridContainer-${gridId}" class="grid-pane" style="width: 100%;">
      <div id="${gridId}" class="${gridUid}" style="width: 100%">
        <div class="slick-headerrow ">
          <div class="slick-headerrow-column l1 r1">
            <div class="form-group search-filter filter-startDate">
              <div class="date-picker">
                <input class="form-group" data-columnid="startDate" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;

jest.useFakeTimers();

describe('DateEditor', () => {
  let translateService: TranslateServiceStub;
  let divContainer: HTMLDivElement;
  let editor: DateEditor;
  let editorArguments: EditorArguments;
  let mockColumn: Column;
  let mockItemData: any;

  beforeEach(() => {
    translateService = new TranslateServiceStub();

    divContainer = document.createElement('div');
    divContainer.innerHTML = template;
    document.body.appendChild(divContainer);

    mockColumn = { id: 'startDate', field: 'startDate', editable: true, editor: { model: Editors.date }, editorClass: {} as Editor } as Column;

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
      translater: null as any,
    };
  });

  describe('with invalid Editor instance', () => {
    it('should throw an error when trying to call init without any arguments', (done) => {
      try {
        editor = new DateEditor(null as any);
      } catch (e) {
        expect(e.toString()).toContain(`[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.`);
        done();
      }
    });
  });

  describe('with valid Editor instance', () => {
    beforeEach(() => {
      mockItemData = { id: 1, startDate: '2001-01-02T11:02:02.000Z', isActive: true };
      mockColumn = { id: 'startDate', field: 'startDate', editable: true, editor: { model: Editors.date }, editorClass: {} as Editor } as Column;

      editorArguments.column = mockColumn;
      editorArguments.item = mockItemData;
    });

    afterEach(() => {
      editor.destroy();
    });

    it('should initialize the editor', () => {
      gridOptionMock.translater = translateService;
      editor = new DateEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-startDate').length;
      expect(editorCount).toBe(1);
    });

    it('should initialize the editor and expect to focus on the element after a small delay', () => {
      const focusSpy = jest.spyOn(editor, 'focus');
      const showSpy = jest.spyOn(editor, 'show');
      editor = new DateEditor(editorArguments);
      const editorCount = divContainer.querySelectorAll('input.editor-text.editor-startDate').length;

      jest.runAllTimers();

      expect(editorCount).toBe(1);
      expect(focusSpy).toHaveBeenCalled();
      expect(showSpy).toHaveBeenCalled();
    });

    it('should have a placeholder when defined in its column definition', () => {
      const testValue = 'test placeholder';
      mockColumn.editor!.placeholder = testValue;

      editor = new DateEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-startDate') as HTMLTextAreaElement;

      expect(editorElm.placeholder).toBe(testValue);
    });

    it('should have a title (tooltip) when defined in its column definition', () => {
      const testValue = 'test title';
      mockColumn.editor!.title = testValue;

      editor = new DateEditor(editorArguments);
      const editorElm = divContainer.querySelector('input.editor-text.editor-startDate') as HTMLTextAreaElement;

      expect(editorElm.title).toBe(testValue);
    });

    it('should call "columnEditor" GETTER and expect to equal the editor settings we provided', () => {
      mockColumn.editor = {
        placeholder: 'test placeholder',
        title: 'test title',
      };

      editor = new DateEditor(editorArguments);

      expect(editor.columnEditor).toEqual(mockColumn.editor);
    });

    it('should call "setValue" and expect the DOM element value to be the same string when calling "getValue"', async () => {
      editor = new DateEditor(editorArguments);

      jest.runAllTimers();

      editor.setValue('2001-01-02T11:02:00.000Z');

      expect(editor.getValue()).toBe('2001-01-02T11:02:00.000Z');
    });

    it('should call "setValue" with value & apply value flag and expect the DOM element to have same value and also expect the value to be applied to the item object', () => {
      mockColumn.type = FieldType.dateIso;
      editor = new DateEditor(editorArguments);

      jest.runAllTimers();

      editor.setValue('2001-01-02', true);

      expect(editor.getValue()).toBe('2001-01-02');
      expect(editorArguments.item.startDate).toBe('2001-01-02');
    });

    it('should define an item datacontext containing a string as cell value and expect this value to be loaded in the editor when calling "loadValue"', () => {
      mockItemData = { id: 1, startDate: '2001-01-02T11:02:02.000Z', isActive: true };
      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
      editor.loadValue(mockItemData);

      expect(editor.getValue()).toBe('2001-01-02');
    });

    it('should hide the DOM element when the "hide" method is called', () => {
      editor = new DateEditor(editorArguments);

      jest.runAllTimers();

      const spy = jest.spyOn(editor.calendarInstance!, 'hide');
      const calendarElm = document.body.querySelector<HTMLDivElement>('.vanilla-calendar');
      editor.hide();

      expect(calendarElm).toBeTruthy();
      expect(spy).toHaveBeenCalled();
    });

    it('should show the DOM element when the "show" method is called', () => {
      editor = new DateEditor(editorArguments);

      jest.runAllTimers();

      const spy = jest.spyOn(editor.calendarInstance!, 'show');
      const calendarElm = document.body.querySelector<HTMLDivElement>('.vanilla-calendar');
      editor.show();
      editor.focus();

      expect(gridStub.focus).toHaveBeenCalled();
      expect(calendarElm).toBeTruthy();
      expect(spy).toHaveBeenCalled();
    });

    it('should call the "changeEditorOption" method and expect new option to be merged with the previous Editor options', () => {
      editor = new DateEditor(editorArguments);
      const calendarElm = document.body.querySelector<HTMLDivElement>('.vanilla-calendar');
      editor.changeEditorOption('range', { disablePast: true });
      editor.changeEditorOption('selected', { dates: ['2001-02-04'], month: 2 });

      expect(calendarElm).toBeTruthy();
      expect(editor.pickerOptions.settings?.range?.disablePast).toBeTruthy();
      expect(editor.pickerOptions.settings?.selected).toEqual({ dates: ['2001-02-04'], month: 2 });

      editor.changeEditorOption('range', { edgesOnly: true });
      editor.changeEditorOption('selected', { dates: ['2020-03-10', 'today'] });

      expect(editor.pickerOptions.settings?.range).toEqual({ disablePast: true, edgesOnly: true });
      expect(editor.pickerOptions.settings?.selected).toEqual({ dates: ['2020-03-10', 'today'], month: 2 });
    });

    describe('isValueChanged method', () => {
      it('should return True when date is changed in the picker', () => {
        const dateMock = '2024-04-02';
        mockItemData = { id: 1, startDate: '2001-01-02T11:02:02.000Z', isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();

        editor.loadValue(mockItemData);
        editor.focus();
        const editorInputElm = editor.editorDomElement;
        editorInputElm.value = '2024-04-02T16:02:02.239Z';
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [dateMock] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [dateMock], hide: jest.fn() } as unknown as VanillaCalendar);

        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return True when date is reset by the clear date button', () => {
        mockItemData = { id: 1, startDate: '2001-01-02T11:02:02.000Z', isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();

        editor.loadValue(mockItemData);
        editor.focus();
        const clearBtnElm = divContainer.querySelector('.btn-clear') as HTMLInputElement;
        const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
        clearBtnElm.click();
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [], hide: jest.fn() } as unknown as VanillaCalendar);

        expect(editor.calendarInstance?.settings.selected.dates).toEqual([]);
        expect(editorInputElm.value).toBe('');
        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should also return True when date is reset by the clear date button even if the previous date was empty', () => {
        mockItemData = { id: 1, startDate: '', isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();

        editor.loadValue(mockItemData);
        editor.focus();
        const clearBtnElm = divContainer.querySelector('.btn-clear') as HTMLInputElement;
        const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [], hide: jest.fn() } as unknown as VanillaCalendar);
        clearBtnElm.click();

        expect(editorInputElm.value).toBe('');
        expect(editor.calendarInstance?.settings.selected.dates).toEqual([]);
        expect(editor.isValueChanged()).toBe(true);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return False when date in the picker is the same as the current date', () => {
        mockItemData = { id: 1, startDate: '2001-01-02', isActive: true };
        mockColumn.type = FieldType.dateIso;

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();

        editor.loadValue(mockItemData);

        const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
        editorInputElm.value = '2001-01-02';
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: ['2001-01-02'] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: ['2001-01-02'], hide: jest.fn() } as unknown as VanillaCalendar);

        expect(editor.isValueChanged()).toBe(false);
        expect(editor.isValueTouched()).toBe(true);
      });

      it('should return False when input date is invalid', () => {
        mockItemData = { id: 1, startDate: '1900-02-32', isActive: true };
        mockColumn.type = FieldType.dateUs;
        const dateMock = '1900-02-32';

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();

        editor.loadValue(mockItemData);
        const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
        editorInputElm.value = dateMock;
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [dateMock] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [dateMock], hide: jest.fn() } as unknown as VanillaCalendar);

        expect(editor.isValueChanged()).toBe(false);
        expect(editor.isValueTouched()).toBe(true);
      });
    });

    describe('applyValue method', () => {
      it('should apply the value to the startDate property with ISO format when no "outputType" is defined and when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.type = FieldType.date;
        mockItemData = { id: 1, startDate: '2001-04-05T11:33:42.000Z', isActive: true };

        const newDate = new Date(Date.UTC(2001, 0, 2, 16, 2, 2, 0));
        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.applyValue(mockItemData, newDate);

        // @ts-ignore:2349
        expect(mockItemData).toEqual({ id: 1, startDate: moment(newDate).format('YYYY-MM-DD'), isActive: true });
      });

      it('should apply the value to the startDate property with "outputType" format with a field having dot notation (complex object) that passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.type = FieldType.date;
        mockColumn.outputType = FieldType.dateTimeShortEuro;
        mockColumn.field = 'employee.startDate';
        mockItemData = { id: 1, employee: { startDate: '2001-04-05T11:33:42.000Z' }, isActive: true };

        const newDate = new Date(Date.UTC(2001, 0, 2, 16, 2, 2, 0));
        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.applyValue(mockItemData, newDate);

        // @ts-ignore:2349
        expect(mockItemData).toEqual({ id: 1, employee: { startDate: moment(newDate).format('DD/MM/YYYY HH:mm') }, isActive: true });
      });

      it('should apply the value to the startDate property with output format defined by "saveOutputType" when it passes validation', () => {
        mockColumn.editor!.validator = null as any;
        mockColumn.type = FieldType.date;
        mockColumn.saveOutputType = FieldType.dateTimeIsoAmPm;
        mockItemData = { id: 1, startDate: '2001-04-05T11:33:42.000Z', isActive: true };

        const newDate = new Date(Date.UTC(2001, 0, 2, 16, 2, 2, 0));
        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.applyValue(mockItemData, newDate);

        // @ts-ignore:2349
        expect(mockItemData).toEqual({ id: 1, startDate: moment(newDate).format('YYYY-MM-DD hh:mm:ss a'), isActive: true });
      });

      it('should return item data with an empty string in its value when it fails the custom validation', () => {
        mockColumn.editor!.validator = (value: any) => {
          if (value.length > 10) {
            return { valid: false, msg: 'Must be at least 10 chars long.' };
          }
          return { valid: true, msg: '' };
        };
        mockItemData = { id: 1, startDate: '2001-04-05T11:33:42.000Z', isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.applyValue(mockItemData, '2001-01-02T16:02:02.000+05:00');

        expect(mockItemData).toEqual({ id: 1, startDate: '', isActive: true });
      });
    });

    describe('serializeValue method', () => {
      it('should return serialized value as a date string', () => {
        mockColumn.type = FieldType.dateIso;
        mockItemData = { id: 1, startDate: '2001-01-02T16:02:02.000+05:00', isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('2001-01-02');
      });

      it('should return serialized value as an empty string when item value is also an empty string', () => {
        mockItemData = { id: 1, startDate: '', isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as an empty string when item value is null', () => {
        mockItemData = { id: 1, startDate: null, isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('');
      });

      it('should return serialized value as a date string when using a dot (.) notation for complex object', () => {
        mockColumn.type = FieldType.dateIso;
        mockColumn.field = 'employee.startDate';
        mockItemData = { id: 1, employee: { startDate: '2001-01-02T16:02:02.000+05:00' }, isActive: true };

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        const output = editor.serializeValue();

        expect(output).toBe('2001-01-02');
      });
    });

    describe('save method', () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should call "getEditorLock" method when "hasAutoCommitEdit" is enabled', () => {
        mockItemData = { id: 1, startDate: '2001-01-02T16:02:02.000+05:00', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        editor.setValue('2022-03-02T16:02:02.000+05:00');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should call "commitChanges" method when "hasAutoCommitEdit" is disabled', () => {
        mockItemData = { id: 1, startDate: '2001-01-02T16:02:02.000+05:00', isActive: true };
        gridOptionMock.autoCommitEdit = false;
        const spy = jest.spyOn(editorArguments, 'commitChanges');

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        editor.setValue('2022-03-02T16:02:02.000+05:00');
        editor.save();

        expect(spy).toHaveBeenCalled();
      });

      it('should not call anything when the input value is empty but is required', () => {
        mockItemData = { id: 1, startDate: '', isActive: true };
        mockColumn.editor!.required = true;
        gridOptionMock.autoCommitEdit = true;
        const spy = jest.spyOn(gridStub.getEditorLock(), 'commitCurrentEdit');

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        editor.save();

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not throw any error when date is lower than required "minDate" defined in the "editorOptions" and "autoCommitEdit" is enabled', () => {
        mockColumn.editor!.editorOptions = { range: { min: 'today' } };
        mockItemData = { id: 1, startDate: '500-01-02T11:02:02.000Z', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        gridOptionMock.autoEdit = true;
        gridOptionMock.editable = true;

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        editor.calendarInstance?.show();
        const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [], hide: jest.fn() } as unknown as VanillaCalendar);

        expect(editor.pickerOptions).toBeTruthy();
        expect(editorInputElm.value).toBe('');
        expect(editor.serializeValue()).toBe('');
      });

      it('should not throw any error when date is invalid when lower than required "minDate" defined in the global default editorOptions and "autoCommitEdit" is enabled', () => {
        // change to allow input value only for testing purposes & use the regular date picker input to test that one too
        gridOptionMock.defaultEditorOptions = {
          date: { range: { min: 'today' } }
        };
        mockItemData = { id: 1, startDate: '500-01-02T11:02:02.000Z', isActive: true };
        gridOptionMock.autoCommitEdit = true;
        gridOptionMock.autoEdit = true;
        gridOptionMock.editable = true;

        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        editor.loadValue(mockItemData);
        editor.calendarInstance?.show();
        const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
        editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [] } as unknown as VanillaCalendar);
        editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [], hide: jest.fn() } as unknown as VanillaCalendar);

        expect(editor.pickerOptions).toBeTruthy();
        expect(editorInputElm.value).toBe('');
        expect(editor.serializeValue()).toBe('');
      });
    });

    describe('validate method', () => {
      it('should return False when field is required and field is empty', () => {
        mockColumn.editor!.required = true;
        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        const validation = editor.validate(null, '');

        expect(validation).toEqual({ valid: false, msg: 'Field is required' });
      });

      it('should return True when field is required and input is a valid input value', () => {
        mockColumn.editor!.required = true;
        editor = new DateEditor(editorArguments);
        jest.runAllTimers();
        const validation = editor.validate(null, 'text');

        expect(validation).toEqual({ valid: true, msg: null });
      });
    });

    describe('with different locale', () => {
      it('should display text in new locale', async () => {
        gridOptionMock.translater = translateService;

        translateService.use('fr');
        editor = new DateEditor(editorArguments);
        jest.runAllTimers();

        const calendarElm = document.body.querySelector('.vanilla-calendar') as HTMLDivElement;
        const monthElm = calendarElm.querySelector('.vanilla-calendar-month') as HTMLButtonElement;

        expect(calendarElm).toBeTruthy();
        expect(monthElm).toBeTruthy();
        expect(editor.calendarInstance?.settings.lang).toBe('fr');
        // expect(monthElm.textContent).toBe('janvier');
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
      mockColumn.type = FieldType.dateIso;
      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
      editor.setValue('2001-01-02', true);

      expect(editor.getValue()).toContain('2001-01-02');
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { startDate: '2001-01-02' }, editors: {}, triggeredBy: 'system',
      }, expect.anything());
    });

    it('should call "show" and expect the DOM element to not be disabled when "onBeforeEditCell" is NOT returning false', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);

      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
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

      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { startDate: '' }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.calendarInstance?.HTMLInputElement?.disabled).toEqual(true);
      expect(editor.calendarInstance?.HTMLInputElement?.value).toEqual('');
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

      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
      editor.loadValue(mockItemData);
      const disableSpy = jest.spyOn(editor, 'disable');
      editor.show();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).not.toHaveBeenCalled();
      expect(disableSpy).toHaveBeenCalledWith(true);
      expect(editor.calendarInstance?.HTMLInputElement?.disabled).toEqual(true);
      expect(editor.calendarInstance?.HTMLInputElement?.value).toEqual('');
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

      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
      editor.loadValue({ ...mockItemData, startDate: '2020-01-01' });
      editor.show();
      editor.disable();

      expect(getCellSpy).toHaveBeenCalled();
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: {}, editors: {}, triggeredBy: 'user',
      }, expect.anything());
      expect(editor.calendarInstance?.HTMLInputElement?.disabled).toEqual(true);
      expect(editor.calendarInstance?.HTMLInputElement?.value).toEqual('');
    });

    it('should expect "onCompositeEditorChange" to have been triggered with the new value showing up in its "formValues" object', () => {
      const activeCellMock = { row: 0, cell: 0 };
      const dateMock = '2001-01-02';
      mockColumn.type = FieldType.dateIso;
      const getCellSpy = jest.spyOn(gridStub, 'getActiveCell').mockReturnValue(activeCellMock);
      const onBeforeEditSpy = jest.spyOn(gridStub.onBeforeEditCell, 'notify').mockReturnValue({
        getReturnValue: () => undefined
      } as any);
      const onCompositeEditorSpy = jest.spyOn(gridStub.onCompositeEditorChange, 'notify').mockReturnValue({
        getReturnValue: () => false
      } as any);
      gridOptionMock.autoCommitEdit = true;
      mockItemData = { id: 1, startDate: dateMock, isActive: true };

      editor = new DateEditor(editorArguments);
      jest.runAllTimers();
      editor.loadValue(mockItemData);
      editor.focus();
      const editorInputElm = divContainer.querySelector('input.date-picker') as HTMLInputElement;
      editorInputElm.value = dateMock;
      editor.calendarInstance!.actions!.clickDay!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [dateMock] } as unknown as VanillaCalendar);
      editor.calendarInstance!.actions!.changeToInput!(new MouseEvent('click'), { HTMLInputElement: editorInputElm, selectedDates: [dateMock], hide: jest.fn() } as unknown as VanillaCalendar);

      expect(getCellSpy).toHaveBeenCalled();
      expect(onBeforeEditSpy).toHaveBeenCalledWith({ ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub, target: 'composite', compositeEditorOptions: editorArguments.compositeEditorOptions });
      expect(onCompositeEditorSpy).toHaveBeenCalledWith({
        ...activeCellMock, column: mockColumn, item: mockItemData, grid: gridStub,
        formValues: { startDate: dateMock }, editors: {}, triggeredBy: 'user',
      }, expect.anything());
    });
  });
});
