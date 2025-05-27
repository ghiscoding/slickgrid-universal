import { BindingEventService } from '@slickgrid-universal/binding';
import { deepMerge, emptyObject, setDeepValue, classNameToList, getHtmlStringOutput, extend } from '@slickgrid-universal/utils';
import type {
  Column,
  CompositeEditorLabel,
  CompositeEditorModalType,
  CompositeEditorOpenDetailOption,
  CompositeEditorOption,
  ContainerService,
  DOMEvent,
  Editor,
  EditorValidationResult,
  ExternalResource,
  GridOption,
  GridService,
  Locale,
  OnCompositeEditorChangeEventArgs,
  OnErrorOption,
  PlainFunc,
  SlickDataView,
  SlickEventData,
  SlickGrid,
  TranslaterService,
} from '@slickgrid-universal/common';
import {
  Constants,
  createDomElement,
  getDescendantProperty,
  numericSortComparer,
  SlickEventHandler,
  SortDirectionNumber,
} from '@slickgrid-universal/common';

import { SlickCompositeEditor } from './compositeEditor.factory.js';

const DEFAULT_ON_ERROR = (error: OnErrorOption) => console.log(error.message);

type ApplyChangesCallbackFn = (
  formValues: { [columnId: string]: any } | null,
  selection: { gridRowIndexes: number[]; dataContextIds: Array<number | string> },
  applyToDataview?: boolean
) => any[] | void | undefined;

type DataSelection = {
  gridRowIndexes: number[];
  dataContextIds: Array<number | string>;
};

export class SlickCompositeEditorComponent implements ExternalResource {
  protected _bindEventService: BindingEventService;
  protected _columns: Column[] = [];
  protected _compositeOptions!: CompositeEditorOption;
  protected _eventHandler: SlickEventHandler;
  protected _itemDataContext: any;
  protected _modalElm!: HTMLDivElement;
  protected _originalDataContext: any;
  protected _options!: CompositeEditorOpenDetailOption;
  protected _lastActiveRowNumber = -1;
  protected _locales!: Locale;
  protected _formValues: { [columnId: string]: any } | null = null;
  protected _editors!: { [columnId: string]: Editor };
  protected _editorContainers!: Array<HTMLElement | null>;
  protected _modalBodyTopValidationElm!: HTMLDivElement;
  protected _modalSaveButtonElm!: HTMLButtonElement;
  protected grid!: SlickGrid;
  protected gridService: GridService | null = null;
  protected translaterService?: TranslaterService | null;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get dataView(): SlickDataView {
    return this.grid?.getData<SlickDataView>();
  }

  get dataViewLength(): number {
    return this.dataView.getLength();
  }

  get formValues(): any {
    return this._formValues;
  }

  get editors(): { [columnId: string]: Editor } {
    return this._editors;
  }
  set editors(editors: { [columnId: string]: Editor }) {
    this._editors = editors;
  }

  get gridOptions(): GridOption {
    return this.grid?.getOptions();
  }

  constructor() {
    this._eventHandler = new SlickEventHandler();
    this._bindEventService = new BindingEventService();
  }

  /**
   * initialize the Composite Editor by passing the SlickGrid object and the container service
   *
   * Note: we aren't using DI in the constructor simply to be as framework agnostic as possible,
   * we are simply using this init() function with a very basic container service to do the job
   */
  init(grid: SlickGrid, containerService: ContainerService): void {
    this.grid = grid;
    this.gridService = containerService.get<GridService>('GridService');
    this.translaterService = containerService.get<TranslaterService>('TranslaterService');

    if (!this.gridService) {
      throw new Error(
        '[Slickgrid-Universal] it seems that the GridService is not being loaded properly, make sure the Container Service is properly implemented.'
      );
    }

    if (this.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error(
        '[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.'
      );
    }

    // get locales provided by user in forRoot or else use default English locales via the Constants
    this._locales = this.gridOptions?.locales ?? Constants.locales;
  }

  /** Dispose of the Component & unsubscribe all events */
  dispose(): void {
    this._eventHandler.unsubscribeAll();
    this._bindEventService.unbindAll();
    this._formValues = null;
    this.disposeComponent();
  }

  /** Dispose of the Component without unsubscribing any events */
  disposeComponent(): void {
    // protected _editorContainers!: Array<HTMLElement | null>;
    this._modalBodyTopValidationElm?.remove();
    this._modalSaveButtonElm?.remove();

    if (typeof this._modalElm?.remove === 'function') {
      this._modalElm.remove();

      // remove the body backdrop click listener, every other listeners will be dropped automatically since we destroy the component
      document.body.classList.remove('slick-modal-open');
    }
    this._editorContainers = [];
  }

  /**
   * Dynamically change value of an input from the Composite Editor form.
   *
   * NOTE: user might get an error thrown when trying to apply a value on a Composite Editor that was not found in the form,
   * but in some cases the user might still want the value to be applied to the formValues so that it will be sent to the save in final item data context
   * and when that happens, you can just skip that error so it won't throw.
   * @param {String | Column} columnIdOrDef - column id or column definition
   * @param {*} newValue - the new value
   * @param {Boolean} skipMissingEditorError - defaults to False, skipping the error when the Composite Editor was not found will allow to still apply the value into the formValues object
   * @param {Boolean} triggerOnCompositeEditorChange - defaults to True, will this change trigger a onCompositeEditorChange event?
   */
  changeFormInputValue(
    columnIdOrDef: string | Column,
    newValue: any,
    skipMissingEditorError = false,
    triggerOnCompositeEditorChange = true
  ): void {
    const columnDef = this.getColumnByObjectOrId(columnIdOrDef);
    const columnId = typeof columnIdOrDef === 'string' ? columnIdOrDef : (columnDef?.id ?? '');
    const editor = this._editors?.[columnId];
    let outputValue = newValue;

    if (!editor && !skipMissingEditorError) {
      throw new Error(`Composite Editor with column id "${columnId}" not found.`);
    }

    if (typeof editor?.setValue === 'function' && Array.isArray(this._editorContainers)) {
      editor.setValue(newValue, true, triggerOnCompositeEditorChange);
      const editorContainerElm = (this._editorContainers as HTMLElement[]).find((editorElm) => editorElm!.dataset!.editorid === columnId);
      const excludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;

      if (!editor.disabled || (editor.disabled && !excludeDisabledFieldFormValues)) {
        editorContainerElm?.classList?.add('modified');
      } else {
        outputValue = '';
        editorContainerElm?.classList?.remove('modified');
      }

      // when the field is disabled, we will only allow a blank value anything else will be disregarded
      if (editor.disabled && (outputValue !== '' || outputValue !== null || outputValue !== undefined || outputValue !== 0)) {
        outputValue = '';
      }
    }

    // is the field a complex object, like "address.streetNumber"
    // we'll set assign the value as a complex object following the `field` dot notation
    const fieldName = columnDef?.field ?? '';
    if (columnDef && fieldName?.includes('.')) {
      // when it's a complex object, user could override the object path (where the editable object is located)
      // else we use the path provided in the Field Column Definition
      const objectPath = columnDef.editor?.complexObjectPath ?? fieldName ?? '';
      setDeepValue(this._formValues ?? {}, objectPath, newValue);
    } else {
      this._formValues = { ...this._formValues, [columnId]: outputValue };
    }
  }

  /**
   * Dynamically update the `formValues` object directly without triggering the onCompositeEditorChange event.
   * The fact that this doesn't trigger an event, might not always be good though, in these cases you are probably better with using the changeFormInputValue() method
   * @param {String | Column} columnIdOrDef - column id or column definition
   * @param {*} newValue - the new value
   */
  changeFormValue(columnIdOrDef: string | Column, newValue: any): void {
    const columnDef = this.getColumnByObjectOrId(columnIdOrDef);
    const columnId = typeof columnIdOrDef === 'string' ? columnIdOrDef : (columnDef?.id ?? '');

    // is the field a complex object, like "address.streetNumber"
    // we'll set assign the value as a complex object following the `field` dot notation
    const fieldName = columnDef?.field ?? (columnIdOrDef as string);
    if (fieldName?.includes('.')) {
      // when it's a complex object, user could override the object path (where the editable object is located)
      // else we use the path provided in the Field Column Definition
      const objectPath = columnDef?.editor?.complexObjectPath ?? fieldName ?? '';
      setDeepValue(this._formValues, objectPath, newValue);
    } else {
      this._formValues = { ...this._formValues, [columnId]: newValue };
    }

    this._formValues = deepMerge({}, this._itemDataContext, this._formValues);
  }

  /**
   * Dynamically change an Editor option of the Composite Editor form
   * For example, a use case could be to dynamically change the "minDate" of another Date Editor in the Composite Editor form.
   * @param {String} columnId - column id
   * @param {*} newValue - the new value
   */
  changeFormEditorOption(columnId: string, optionName: string, newOptionValue: any): void {
    const editor = this._editors?.[columnId];

    // change an Editor option (not all Editors have that method, so make sure it exists before trying to call it)
    if (editor?.changeEditorOption) {
      editor.changeEditorOption(optionName, newOptionValue);
    } else {
      throw new Error(
        `Editor with column id "${columnId}" not found OR the Editor does not support "changeEditorOption" (current only available with Date, MultipleSelect, SingleSelect & Slider Editors).`
      );
    }
  }

  /**
   * Disable (or enable) an input of the Composite Editor form
   * @param {String} columnId - column definition id
   * @param isDisabled - defaults to True, are we disabling the associated form input
   */
  disableFormInput(columnId: string, isDisabled = true): void {
    const editor = this._editors?.[columnId];
    if (editor?.disable && Array.isArray(this._editorContainers)) {
      editor.disable(isDisabled);
    }
  }

  /** Entry point to initialize and open the Composite Editor modal window */
  openDetails(options: CompositeEditorOpenDetailOption): SlickCompositeEditorComponent | null {
    const onError = options.onError ?? DEFAULT_ON_ERROR;
    const defaultOptions = {
      backdrop: 'static',
      showCloseButtonOutside: true,
      shouldClearRowSelectionAfterMassAction: true,
      viewColumnLayout: 'auto',
      modalType: 'edit',
    } as CompositeEditorOpenDetailOption;

    try {
      if (!this.grid || (this.grid.getEditorLock().isActive() && !this.grid.getEditorLock().commitCurrentEdit())) {
        return null;
      }

      this._formValues = null; // make sure there's no leftover from previous change
      this._options = {
        ...defaultOptions,
        ...this.gridOptions.compositeEditorOptions,
        ...options,
        labels: { ...this.gridOptions.compositeEditorOptions?.labels, ...options?.labels },
      }; // merge default options with user options
      this._options.backdrop = options.backdrop !== undefined ? options.backdrop : 'static';
      const viewColumnLayout = this._options.viewColumnLayout || 1;
      const activeCell = this.grid.getActiveCell();
      const activeColIndex = activeCell?.cell ?? 0;
      const activeRow = activeCell?.row ?? 0;
      const gridUid = this.grid.getUID() || '';
      let headerTitle = options.headerTitle || '';

      // execute callback before creating the modal window (that is in short the first event in the lifecycle)
      if (typeof this._options.onBeforeOpen === 'function') {
        this._options.onBeforeOpen();
      }

      if (this.hasRowSelectionEnabled() && this._options.modalType === 'auto-mass' && this.grid.getSelectedRows) {
        const selectedRowsIndexes = this.grid.getSelectedRows() || [];
        if (selectedRowsIndexes.length > 0) {
          this._options.modalType = 'mass-selection';
          if (options?.headerTitleMassSelection) {
            headerTitle = options?.headerTitleMassSelection;
          }
        } else {
          this._options.modalType = 'mass-update';
          if (options?.headerTitleMassUpdate) {
            headerTitle = options?.headerTitleMassUpdate;
          }
        }
      }
      const modalType: CompositeEditorModalType = this._options.modalType || 'edit';

      if (!this.gridOptions.editable) {
        onError({
          type: 'error',
          code: 'EDITABLE_GRID_REQUIRED',
          message: 'Your grid must be editable in order to use the Composite Editor Modal.',
        });
        return null;
      } else if (!this.gridOptions.enableCellNavigation) {
        onError({
          type: 'error',
          code: 'ENABLE_CELL_NAVIGATION_REQUIRED',
          message: 'Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.',
        });
        return null;
      } else if (!this.gridOptions.enableAddRow && (modalType === 'clone' || modalType === 'create')) {
        onError({
          type: 'error',
          code: 'ENABLE_ADD_ROW_REQUIRED',
          message:
            'Composite Editor requires the flag "enableAddRow" to be set to True in your Grid Options when cloning/creating a new item.',
        });
        return null;
      } else if (!activeCell && (modalType === 'clone' || modalType === 'edit')) {
        onError({ type: 'warning', code: 'NO_RECORD_FOUND', message: 'No records selected for edit or clone operation.' });
        return null;
      } else {
        const isWithMassChange = modalType === 'mass-update' || modalType === 'mass-selection';
        const dataContext = !isWithMassChange ? this.grid.getDataItem(activeRow) : {};
        this._originalDataContext = extend(true, {}, dataContext);
        this._columns = this.grid.getColumns();
        const selectedRowsIndexes = this.hasRowSelectionEnabled() ? this.grid.getSelectedRows() : [];
        const fullDatasetLength = this.dataView?.getItemCount() ?? 0;
        this._lastActiveRowNumber = activeRow;
        const dataContextIds = this.dataView.getAllSelectedIds();

        // focus on a first cell with an Editor (unless current cell already has an Editor then do nothing)
        // also when it's a "Create" modal, we'll scroll to the end of the grid
        const rowIndex = modalType === 'create' ? this.dataViewLength : activeRow;
        const hasFoundEditor = this.focusOnFirstColumnCellWithEditor(
          this._columns,
          dataContext,
          activeColIndex,
          rowIndex,
          isWithMassChange
        );
        if (!hasFoundEditor) {
          return null;
        }

        if (modalType === 'edit' && !dataContext) {
          onError({ type: 'warning', code: 'ROW_NOT_EDITABLE', message: 'Current row is not editable.' });
          return null;
        } else if (modalType === 'mass-selection') {
          if (selectedRowsIndexes.length < 1) {
            onError({
              type: 'warning',
              code: 'ROW_SELECTION_REQUIRED',
              message: 'You must select some rows before trying to apply new value(s).',
            });
            return null;
          }
        }

        let modalColumns: Column[] = [];
        if (isWithMassChange) {
          // when using Mass Update, we only care about the columns that have the "massUpdate: true", we disregard anything else
          modalColumns = this._columns.filter((col) => col.editorClass && col.editor?.massUpdate === true);
        } else {
          modalColumns = this._columns.filter((col) => col.editorClass);
        }

        // user could optionally show the form inputs in a specific order instead of using default column definitions order
        if (modalColumns.some((col) => col.editor?.compositeEditorFormOrder !== undefined)) {
          modalColumns.sort((col1: Column, col2: Column) => {
            const val1 = col1?.editor?.compositeEditorFormOrder ?? Infinity;
            const val2 = col2?.editor?.compositeEditorFormOrder ?? Infinity;
            return numericSortComparer(val1, val2, SortDirectionNumber.asc);
          });
        }

        // open the editor modal and we can also provide a header title with optional parsing pulled from the dataContext, via template {{ }}
        // for example {{title}} => display the item title, or even complex object works {{product.name}} => display item product name
        const parsedHeaderTitle = headerTitle.replace(/\{\{(.*?)\}\}/g, (_match, group) => getDescendantProperty(dataContext, group));
        const layoutColCount = viewColumnLayout === 'auto' ? this.autoCalculateLayoutColumnCount(modalColumns.length) : viewColumnLayout;

        this._modalElm = createDomElement('div', { className: `slick-editor-modal ${gridUid}` });
        const modalContentElm = createDomElement('div', { className: 'slick-editor-modal-content' });

        // add dark mode CSS class when enabled
        if (this.gridOptions?.darkMode) {
          modalContentElm.classList.add('slick-dark-mode');
        }

        if ((!isNaN(viewColumnLayout as number) && +viewColumnLayout > 1) || (viewColumnLayout === 'auto' && layoutColCount > 1)) {
          const splitClassName = layoutColCount === 2 ? 'split-view' : 'triple-split-view';
          modalContentElm.classList.add(splitClassName);
        }

        const modalHeaderTitleElm = createDomElement('div', { className: 'slick-editor-modal-title' });
        this.grid.applyHtmlCode(modalHeaderTitleElm, parsedHeaderTitle);

        const modalCloseButtonElm = createDomElement('button', {
          type: 'button',
          ariaLabel: 'Close',
          textContent: '×',
          className: 'close',
          dataset: { action: 'close' },
        });
        if (this._options.showCloseButtonOutside) {
          modalHeaderTitleElm?.classList?.add('outside');
          modalCloseButtonElm?.classList?.add('outside');
        }

        const modalHeaderElm = createDomElement('div', { ariaLabel: 'Close', className: 'slick-editor-modal-header' });
        modalHeaderElm.appendChild(modalHeaderTitleElm);
        modalHeaderElm.appendChild(modalCloseButtonElm);

        const modalBodyElm = createDomElement('div', { className: 'slick-editor-modal-body' });
        this._modalBodyTopValidationElm = createDomElement(
          'div',
          { className: 'validation-summary', style: { display: 'none' } },
          modalBodyElm
        );
        const modalFooterElm = createDomElement('div', { className: 'slick-editor-modal-footer' });
        const modalCancelButtonElm = createDomElement('button', {
          type: 'button',
          ariaLabel: this.getLabelText('cancelButton', 'TEXT_CANCEL', 'Cancel'),
          className: 'btn btn-cancel btn-default btn-sm',
          textContent: this.getLabelText('cancelButton', 'TEXT_CANCEL', 'Cancel'),
          dataset: { action: 'cancel' },
        });

        let leftFooterText = '';
        let saveButtonText = '';
        switch (modalType) {
          case 'clone':
            saveButtonText = this.getLabelText('cloneButton', 'TEXT_CLONE', 'Clone');
            break;
          case 'mass-update':
            const footerUnparsedText = this.getLabelText('massUpdateStatus', 'TEXT_ALL_X_RECORDS_SELECTED', 'All {{x}} records selected');
            leftFooterText = this.parseText(footerUnparsedText, { x: fullDatasetLength });
            saveButtonText = this.getLabelText('massUpdateButton', 'TEXT_APPLY_MASS_UPDATE', 'Mass Update');
            break;
          case 'mass-selection':
            const selectionUnparsedText = this.getLabelText('massSelectionStatus', 'TEXT_X_OF_Y_MASS_SELECTED', '{{x}} of {{y}} selected');
            leftFooterText = this.parseText(selectionUnparsedText, { x: dataContextIds.length, y: fullDatasetLength });
            saveButtonText = this.getLabelText('massSelectionButton', 'TEXT_APPLY_TO_SELECTION', 'Update Selection');
            break;
          default:
            saveButtonText = this.getLabelText('saveButton', 'TEXT_SAVE', 'Save');
        }

        const selectionCounterElm = createDomElement('div', { className: 'footer-status-text', textContent: leftFooterText });
        this._modalSaveButtonElm = createDomElement('button', {
          type: 'button',
          className: 'btn btn-save btn-primary btn-sm',
          ariaLabel: saveButtonText,
          textContent: saveButtonText,
          dataset: {
            action: modalType === 'create' || modalType === 'edit' ? 'save' : modalType,
            ariaLabel: saveButtonText,
          },
        });

        const footerContainerElm = createDomElement('div', { className: 'footer-buttons' });

        if (modalType === 'mass-update' || modalType === 'mass-selection') {
          modalFooterElm.appendChild(selectionCounterElm);
        }
        footerContainerElm.appendChild(modalCancelButtonElm);
        footerContainerElm.appendChild(this._modalSaveButtonElm);
        modalFooterElm.appendChild(footerContainerElm);

        modalContentElm.appendChild(modalHeaderElm);
        modalContentElm.appendChild(modalBodyElm);
        modalContentElm.appendChild(modalFooterElm);
        this._modalElm.appendChild(modalContentElm);

        for (const columnDef of modalColumns) {
          if (columnDef.editorClass) {
            const itemContainer = createDomElement('div', { className: `item-details-container editor-${columnDef.id}` });

            if (layoutColCount === 1) {
              itemContainer.classList.add('slick-col-medium-12');
            } else {
              itemContainer.classList.add('slick-col-medium-6', `slick-col-xlarge-${12 / layoutColCount}`);
            }

            const templateItemLabelElm = createDomElement('div', { className: `item-details-label editor-${columnDef.id}` });
            this.grid.applyHtmlCode(templateItemLabelElm, this.getColumnLabel(columnDef) || 'n/a');
            const templateItemEditorElm = createDomElement('div', {
              className: 'item-details-editor-container slick-cell',
              dataset: { editorid: `${columnDef.id}` },
            });
            const templateItemValidationElm = createDomElement('div', {
              className: `item-details-validation editor-${columnDef.id}`,
            });

            // optionally add a reset button beside each editor
            if (this._options?.showResetButtonOnEachEditor) {
              const editorResetButtonElm = this.createEditorResetButtonElement(`${columnDef.id}`);
              this._bindEventService.bind(editorResetButtonElm, 'click', this.handleResetInputValue.bind(this) as EventListener);
              templateItemLabelElm.appendChild(editorResetButtonElm);
            }

            itemContainer.appendChild(templateItemLabelElm);
            itemContainer.appendChild(templateItemEditorElm);
            itemContainer.appendChild(templateItemValidationElm);
            modalBodyElm.appendChild(itemContainer);
          }
        }

        // optionally add a form reset button
        if (this._options?.showFormResetButton) {
          const resetButtonContainerElm = this.createFormResetButtonElement();
          this._bindEventService.bind(resetButtonContainerElm, 'click', this.handleResetFormClicked.bind(this));
          modalBodyElm.appendChild(resetButtonContainerElm);
        }

        document.body.appendChild(this._modalElm);
        document.body.classList.add('slick-modal-open'); // add backdrop to body
        this._bindEventService.bind(document.body, 'click', this.handleBodyClicked.bind(this));

        // execute lifecycle callback after the modal window is created and rendered in the DOM
        if (typeof this._options.onRendered === 'function') {
          this._options.onRendered(this._modalElm);
        }

        this._editors = {};
        this._editorContainers = modalColumns.map((col) => modalBodyElm.querySelector<HTMLDivElement>(`[data-editorid='${col.id}']`)) || [];
        this._compositeOptions = {
          destroy: this.disposeComponent.bind(this),
          modalType,
          validationMsgPrefix: '* ',
          formValues: {},
          editors: this._editors,
        };
        const compositeEditor = new (SlickCompositeEditor as any)(
          modalColumns,
          this._editorContainers,
          this._compositeOptions
        ) as typeof SlickCompositeEditor;
        this.grid.editActiveCell(compositeEditor as any);

        // --
        // Add a few Event Handlers

        // keyboard, blur & button event handlers
        this._bindEventService.bind(modalCloseButtonElm, 'click', this.cancelEditing.bind(this) as EventListener);
        this._bindEventService.bind(modalCancelButtonElm, 'click', this.cancelEditing.bind(this) as EventListener);
        this._bindEventService.bind(this._modalSaveButtonElm, 'click', this.handleSaveClicked.bind(this) as EventListener);
        this._bindEventService.bind(this._modalElm, 'keydown', this.handleKeyDown.bind(this) as EventListener);
        this._bindEventService.bind(this._modalElm, 'focusout', this.validateCurrentEditor.bind(this) as EventListener);
        this._bindEventService.bind(this._modalElm, 'blur', this.validateCurrentEditor.bind(this) as EventListener);

        // when any of the input of the composite editor form changes, we'll add/remove a "modified" CSS className for styling purposes
        this._eventHandler.subscribe(this.grid.onCompositeEditorChange, this.handleOnCompositeEditorChange.bind(this));

        // when adding a new row to the grid, we need to invalidate that row and re-render the grid
        this._eventHandler.subscribe(this.grid.onAddNewRow, (_e, args) => {
          this._originalDataContext = this.insertNewItemInDataView(args.item); // this becomes the new data context
        });
      }
      return this;
    } catch (error: any) {
      this.dispose();
      const errorMsg = typeof error === 'string' ? error : (error?.message ?? error?.body?.message ?? '');
      const errorCode = typeof error === 'string' ? error : (error?.status ?? error?.body?.status ?? errorMsg);
      onError({ type: 'error', code: errorCode, message: errorMsg });
      return null;
    }
  }

  /** Cancel the Editing which will also close the modal window */
  async cancelEditing(): Promise<void> {
    let confirmed = true;
    if (this.formValues && Object.keys(this.formValues).length > 0 && typeof this._options.onClose === 'function') {
      confirmed = await this._options.onClose();
    }

    if (confirmed) {
      this.grid.getEditController()?.cancelCurrentEdit();

      // cancel current edit is not enough when editing/cloning,
      // we also need to reset with the original item data context to undo/reset the entire row
      if (this._options?.modalType === 'edit' || this._options?.modalType === 'clone') {
        this.resetCurrentRowDataContext();
      }

      this.grid.setActiveRow(this._lastActiveRowNumber);
      this.dispose();
    }
  }

  /** Show a Validation Summary text (as a <div>) when a validation fails or simply hide it when there's no error */
  showValidationSummaryText(isShowing: boolean, errorMsg = ''): void {
    if (isShowing && errorMsg !== '') {
      this._modalBodyTopValidationElm.textContent = errorMsg;
      this._modalBodyTopValidationElm.style.display = 'block';
      this._modalBodyTopValidationElm.scrollIntoView?.();
      this._modalSaveButtonElm.disabled = false;
      this._modalSaveButtonElm.classList.remove('saving');
    } else {
      this._modalBodyTopValidationElm.style.display = 'none';
      this._modalBodyTopValidationElm.textContent = errorMsg;
    }
  }

  // --
  // protected methods
  // ----------------

  /** Apply Mass Update Changes (form values) to the entire dataset */
  protected applySaveMassUpdateChanges(formValues: any, _selection: DataSelection, applyToDataview = true): any[] {
    // not applying to dataView means that we're doing a preview of dataset and we should use a deep copy of it instead of applying changes directly to it
    const data = applyToDataview ? this.dataView.getItems() : extend(true, [], this.dataView.getItems());

    // from the "lastCompositeEditor" object that we kept as reference, it contains all the changes inside the "formValues" property
    // we can loop through these changes and apply them on the selected row indexes
    Object.keys(formValues).forEach((itemProp) => {
      if (itemProp in formValues) {
        data.forEach((dataContext: any) => {
          // prettier-ignore
          if (itemProp in formValues && (this._options?.validateMassUpdateChange === undefined || this._options.validateMassUpdateChange(itemProp, dataContext, formValues) !== false)) {
            dataContext[itemProp] = formValues[itemProp];
          }
        });
      }
    });

    // change the entire dataset with our updated dataset
    if (applyToDataview) {
      this.dataView.setItems(data, this.gridOptions.datasetIdPropertyName);
      this.grid.invalidate();
    }
    return data;
  }

  /** Apply Mass Changes to the Selected rows in the grid (form values) */
  protected applySaveMassSelectionChanges(formValues: any, selection: DataSelection, applyToDataview = true): any[] {
    const selectedItemIds = selection?.dataContextIds ?? [];
    const selectedTmpItems = selectedItemIds.map((itemId) => this.dataView.getItemById(itemId));

    // not applying to dataView means that we're doing a preview of dataset and we should use a deep copy of it instead of applying changes directly to it
    const selectedItems = applyToDataview ? selectedTmpItems : extend(true, [], selectedTmpItems);

    // from the "lastCompositeEditor" object that we kept as reference, it contains all the changes inside the "formValues" property
    // we can loop through these changes and apply them on the selected row indexes
    Object.keys(formValues).forEach((itemProp) => {
      if (itemProp in formValues) {
        selectedItems.forEach((dataContext: any) => {
          // prettier-ignore
          if (itemProp in formValues && (this._options?.validateMassUpdateChange === undefined || this._options.validateMassUpdateChange(itemProp, dataContext, formValues) !== false)) {
            dataContext[itemProp] = formValues[itemProp];
          }
        });
      }
    });

    // update all items in the grid with the grid service
    if (applyToDataview) {
      this.gridService?.updateItems(selectedItems);
    }
    return selectedItems;
  }

  /**
   * Auto-Calculate how many columns to display in the view layout (1, 2, or 3).
   * We'll display a 1 column layout for 8 or less Editors, 2 columns layout for less than 15 Editors or 3 columns when more than 15 Editors
   * @param {number} editorCount - how many Editors do we have in total
   * @returns {number} count - calculated column count (1, 2 or 3)
   */
  protected autoCalculateLayoutColumnCount(editorCount: number): number {
    if (editorCount >= 15) {
      return 3;
    } else if (editorCount >= 8) {
      return 2;
    }
    return 1;
  }

  /**
   * Create a reset button for each editor and attach a button click handler
   * @param {String} columnId - column id
   * @returns {Object} - html button
   */
  protected createEditorResetButtonElement(columnId: string): HTMLButtonElement {
    const resetButtonElm = createDomElement('button', {
      type: 'button',
      name: columnId,
      ariaLabel: 'Reset',
      title: this._options?.labels?.resetFormButton ?? 'Reset Form Input',
      className: 'btn btn-xs btn-editor-reset',
    });

    if (this._options?.resetEditorButtonCssClass) {
      const resetBtnClasses = classNameToList(this._options?.resetEditorButtonCssClass);
      for (const cssClass of resetBtnClasses) {
        resetButtonElm.classList.add(cssClass);
      }
    }

    return resetButtonElm;
  }

  /**
   * Create a form reset button and attach a button click handler
   * @param {String} columnId - column id
   * @returns {Object} - html button
   */
  protected createFormResetButtonElement(): HTMLDivElement {
    const resetButtonContainerElm = createDomElement('div', { className: 'reset-container' });
    const resetButtonElm = createDomElement('button', { type: 'button', className: 'btn btn-sm reset-form' }, resetButtonContainerElm);
    createDomElement('span', { className: this._options?.resetFormButtonIconCssClass ?? '' }, resetButtonElm);
    resetButtonElm.appendChild(document.createTextNode(' Reset Form'));

    return resetButtonContainerElm;
  }

  /**
   * Execute the onError callback when defined
   * or use the default onError callback which is to simply display the error in the console
   */
  protected executeOnError(error: OnErrorOption): void {
    const onError = this._options?.onError ?? DEFAULT_ON_ERROR;
    onError(error);
  }

  /**
   * A simple and generic method to execute the "OnSave" callback if it's defined by the user OR else simply execute built-in apply changes callback.
   * This method deals with multiple callbacks as shown below
   * @param {Function} applyChangesCallback - first callback to apply the changes into the grid (this could be a user custom callback)
   * @param {Function} executePostCallback - second callback to execute right after the "onSave"
   * @param {Function} beforeClosingCallback - third and last callback to execute after Saving but just before closing the modal window
   * @param {Object} itemDataContext - item data context when modal type is (create/clone/edit)
   */
  protected async executeOnSave(
    applyChangesCallback: ApplyChangesCallbackFn,
    executePostCallback: PlainFunc,
    beforeClosingCallback?: PlainFunc,
    itemDataContext?: any
  ): Promise<void> {
    try {
      this.showValidationSummaryText(false, '');
      const validationResults = this.validateCompositeEditors();

      if (validationResults.valid) {
        this._modalSaveButtonElm.classList.add('saving');
        this._modalSaveButtonElm.disabled = true;

        if (typeof this._options?.onSave === 'function') {
          const isMassChange = this._options.modalType === 'mass-update' || this._options.modalType === 'mass-selection';

          // apply the changes in the grid early when that option is enabled (that is before the await of `onSave`)
          let updatedDataset;
          if (isMassChange && this._options?.shouldPreviewMassChangeDataset) {
            updatedDataset = applyChangesCallback(this.formValues, this.getCurrentRowSelections(), false) as any[];
          }
          // call the custon onSave callback when defined and note that the item data context will only be filled for create/clone/edit
          const dataContextOrUpdatedDatasetPreview = isMassChange ? updatedDataset : itemDataContext;
          const successful = await this._options?.onSave(
            this.formValues,
            this.getCurrentRowSelections(),
            dataContextOrUpdatedDatasetPreview
          );

          if (successful) {
            // apply the changes in the grid (if it's not yet applied)
            applyChangesCallback(this.formValues, this.getCurrentRowSelections());

            // once we're done doing the mass update, we can cancel the current editor since we don't want to add any new row
            // that will also destroy/close the modal window
            executePostCallback();
          }
        } else {
          applyChangesCallback(this.formValues, this.getCurrentRowSelections());
          executePostCallback();
        }

        // run any function before closing the modal
        if (typeof beforeClosingCallback === 'function') {
          beforeClosingCallback();
        }

        // close the modal only when successful
        this.dispose();
      }
    } catch (error: any) {
      const errorMsg = typeof error === 'string' ? error : (error?.message ?? error?.body?.message ?? '');
      this.showValidationSummaryText(true, errorMsg);
    }
  }

  // For the Composite Editor to work, the current active cell must have an Editor (because it calls editActiveCell() and that only works with a cell with an Editor)
  // so if current active cell doesn't have an Editor, we'll find the first column with an Editor and focus on it (from left to right starting at index 0)
  protected focusOnFirstColumnCellWithEditor(
    columns: Column[],
    dataContext: any,
    columnIndex: number,
    rowIndex: number,
    isWithMassChange: boolean
  ): boolean {
    // make sure we're not trying to activate a cell outside of the grid, that can happen when using MassUpdate without `enableAddRow` flag enabled
    const activeCellIndex =
      isWithMassChange && !this.gridOptions.enableAddRow && rowIndex >= this.dataViewLength ? this.dataViewLength - 1 : rowIndex;

    let columnIndexWithEditor = columnIndex;
    const cellEditor = columns[columnIndex].editorClass;
    let activeEditorCellNode = this.grid.getCellNode(activeCellIndex, columnIndex);

    if (!cellEditor || !activeEditorCellNode || !this.getActiveCellEditor(activeCellIndex, columnIndex)) {
      columnIndexWithEditor = this.findNextAvailableEditorColumnIndex(columns, dataContext, rowIndex, isWithMassChange);
      if (columnIndexWithEditor === -1) {
        this.executeOnError({
          type: 'error',
          code: 'NO_EDITOR_FOUND',
          message: 'We could not find any Editor in your Column Definition',
        });
        return false;
      } else {
        this.grid.setActiveCell(activeCellIndex, columnIndexWithEditor, false);

        if (isWithMassChange) {
          // when it's a mass change, we'll activate the last row without scrolling to it
          // that is possible via the 3rd argument "suppressScrollIntoView" set to "true"
          this.grid.setActiveRow(this.dataViewLength, columnIndexWithEditor, true);
        }
      }
    }

    // check again if the cell node is now being created, if it is then we're good
    activeEditorCellNode = this.grid.getCellNode(activeCellIndex, columnIndexWithEditor);

    return !!activeEditorCellNode;
  }

  protected findNextAvailableEditorColumnIndex(columns: Column[], dataContext: any, rowIndex: number, isWithMassUpdate: boolean): number {
    let columnIndexWithEditor = -1;

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const col = columns[colIndex];
      if (col.editorClass && (!isWithMassUpdate || (isWithMassUpdate && col.editor?.massUpdate))) {
        // we can check that the cell is really editable by checking the onBeforeEditCell event not returning false (returning undefined, null also mean it is editable)
        const isCellEditable = this.grid.onBeforeEditCell
          .notify({
            row: rowIndex,
            cell: colIndex,
            item: dataContext,
            column: col,
            grid: this.grid,
            target: 'composite',
            compositeEditorOptions: this._compositeOptions,
          })
          .getReturnValue();
        this.grid.setActiveCell(rowIndex, colIndex, false);
        if (isCellEditable !== false) {
          columnIndexWithEditor = colIndex;
          break;
        }
      }
    }
    return columnIndexWithEditor;
  }

  /**
   * Get a column definition by providing a column id OR a column definition.
   * If the input is a string, we'll assume it's a columnId and we'll simply search for the column in the column definitions list
   */
  protected getColumnByObjectOrId(columnIdOrDef: string | Column): Column | undefined {
    let column: Column | undefined;

    if (typeof columnIdOrDef === 'object') {
      column = columnIdOrDef;
    } else if (typeof columnIdOrDef === 'string') {
      column = this._columns.find((col) => col.id === (columnIdOrDef as string));
    }
    return column;
  }

  protected getActiveCellEditor(row: number, cell: number): Editor | null {
    this.grid.setActiveCell(row, cell, false);
    return this.grid.getCellEditor();
  }

  /**
   * Get the column label, the label might have an optional "columnGroup" (or "columnGroupKey" which need to be translated)
   * @param {object} columnDef - column definition
   * @returns {string} label - column label
   */
  protected getColumnLabel(columnDef: Column): string {
    const columnGroupSeparator = this.gridOptions.columnGroupSeparator || ' - ';
    let columnName = columnDef.nameCompositeEditor || columnDef.name || '';
    let columnGroup = columnDef.columnGroup || '';

    if (this.gridOptions.enableTranslate && this.translaterService) {
      const translationKey = columnDef.nameCompositeEditorKey || columnDef.nameKey;
      if (translationKey) {
        columnName = this.translaterService.translate(translationKey);
      }
      if (columnDef.columnGroupKey && this.translaterService?.translate) {
        columnGroup = this.translaterService.translate(columnDef.columnGroupKey);
      }
    }

    const columnLabel = columnGroup ? `${columnGroup}${columnGroupSeparator}${columnName}` : columnName;
    return getHtmlStringOutput(columnLabel, 'innerHTML');
  }

  /** Get the correct label text depending, if we use a Translater Service then translate the text when possible else use default text */
  protected getLabelText(labelProperty: keyof CompositeEditorLabel, localeText: string, defaultText: string): string {
    const textLabels = { ...this.gridOptions.compositeEditorOptions?.labels, ...this._options?.labels };

    if (
      this.gridOptions?.enableTranslate &&
      this.translaterService?.translate &&
      textLabels.hasOwnProperty(`${labelProperty}Key` as keyof CompositeEditorLabel)
    ) {
      const translationKey = textLabels[`${labelProperty}Key` as keyof CompositeEditorLabel];
      return this.translaterService.translate(translationKey || '');
    }
    return textLabels?.[labelProperty as keyof CompositeEditorLabel] ?? this._locales?.[localeText as keyof Locale] ?? defaultText;
  }

  /** Retrieve the current selection of row indexes & data context Ids */
  protected getCurrentRowSelections(): { gridRowIndexes: number[]; dataContextIds: Array<string | number> } {
    const dataContextIds = this.dataView.getAllSelectedIds();
    const gridRowIndexes = this.dataView.mapIdsToRows(dataContextIds);
    return { gridRowIndexes, dataContextIds };
  }

  protected handleBodyClicked(event: Event): void {
    if ((event.target as HTMLElement)?.classList?.contains('slick-editor-modal')) {
      if (this._options?.backdrop !== 'static') {
        this.dispose();
      }
    }
  }

  protected handleKeyDown(event: KeyboardEvent): void {
    if (event.code === 'Escape') {
      this.cancelEditing();
      event.stopPropagation();
      event.preventDefault();
    } else if (event.code === 'Tab') {
      this.validateCurrentEditor();
    }
  }

  protected handleResetInputValue(event: DOMEvent<HTMLButtonElement>): void {
    const columnId = event.target.name;
    const editor = this._editors?.[columnId];
    if (typeof editor?.reset === 'function') {
      editor.reset();
    }
    delete this._formValues?.[columnId];
  }

  /** Callback which processes a Mass Update or Mass Selection Changes */
  protected async handleMassSaving(modalType: 'mass-update' | 'mass-selection', executePostCallback: PlainFunc): Promise<void> {
    if (!this.formValues || Object.keys(this.formValues).length === 0) {
      this.executeOnError({ type: 'warning', code: 'NO_CHANGES_DETECTED', message: 'Sorry we could not detect any changes.' });
    } else {
      const applyCallbackFnName = modalType === 'mass-update' ? 'applySaveMassUpdateChanges' : 'applySaveMassSelectionChanges';
      this.executeOnSave(this[applyCallbackFnName].bind(this), executePostCallback.bind(this));
    }
  }

  /** Anytime an input of the Composite Editor form changes, we'll add/remove a "modified" CSS className for styling purposes */
  protected handleOnCompositeEditorChange(_e: SlickEventData, args: OnCompositeEditorChangeEventArgs): void {
    const columnId = args.column?.id ?? '';
    this._formValues = { ...this._formValues, ...args.formValues };
    const editor = this._editors?.[columnId] as Editor;
    const isEditorValueTouched = editor?.isValueTouched?.() ?? editor?.isValueChanged?.() ?? false;
    this._itemDataContext = editor?.dataContext ?? {}; // keep reference of the item data context

    // add extra css styling to the composite editor input(s) that got modified
    const editorElm = this._modalElm.querySelector(`[data-editorid='${columnId}']`);
    if (editorElm?.classList) {
      if (isEditorValueTouched) {
        editorElm.classList.add('modified');
      } else {
        editorElm.classList.remove('modified');
      }
    }

    // after any input changes we'll re-validate all fields
    this.validateCompositeEditors();
  }

  /** Check wether the grid has the Row Selection enabled */
  protected hasRowSelectionEnabled(): boolean {
    const selectionModel = this.grid.getSelectionModel();
    // Either the CellSelectionModel or the RowSelectionModel must be active for
    // the grid to return the selected rows.
    return !!selectionModel;
  }

  /** Reset Form button handler */
  protected handleResetFormClicked(): void {
    for (const columnId of Object.keys(this._editors)) {
      const editor = this._editors[columnId];
      if (editor?.reset) {
        editor.reset();
      }
    }

    this._formValues = emptyObject(this._formValues);
  }

  /** switch case handler to determine which code to execute depending on the modal type */
  protected async handleSaveClicked(): Promise<void> {
    const modalType = this._options?.modalType;
    switch (modalType) {
      case 'mass-update':
        this.handleMassSaving(modalType, () => {
          this.grid.getEditController()?.cancelCurrentEdit();
          this.grid.setActiveCell(0, 0, false);
          if (this._options.shouldClearRowSelectionAfterMassAction) {
            this.grid.setSelectedRows([]);
          }
        });
        break;
      case 'mass-selection':
        this.handleMassSaving(modalType, () => {
          this.grid.getEditController()?.cancelCurrentEdit();
          this.grid.setActiveRow(this._lastActiveRowNumber);
          if (this._options.shouldClearRowSelectionAfterMassAction) {
            this.grid.setSelectedRows([]);
          }
        });
        break;
      case 'clone':
        // the clone object will be a merge of the selected data context (original object) with the changed form values
        const clonedItemDataContext = { ...this._originalDataContext, ...this.formValues };

        // post save callback (before closing modal)
        const postSaveCloneCallback = () => {
          this.grid.getEditController()?.cancelCurrentEdit();
          this.grid.setActiveCell(0, 0, false);
        };

        // call the onSave execution and provide the item data context so that it's available to the user
        this.executeOnSave(
          this.insertNewItemInDataView.bind(this, clonedItemDataContext),
          postSaveCloneCallback,
          this.resetCurrentRowDataContext.bind(this),
          clonedItemDataContext
        );
        break;
      case 'create':
      case 'edit':
      default:
        // commit the changes into the grid
        // if it's a "create" then it will triggered the "onAddNewRow" event which will in term push it to the grid
        // while an "edit" will simply applies the changes directly on the same row
        let isFormValid = this.grid.getEditController()?.commitCurrentEdit();

        // if the user provided the "onSave" callback, let's execute it with the item data context
        if (isFormValid && typeof this._options?.onSave === 'function') {
          const itemDataContext =
            modalType === 'create'
              ? this._originalDataContext // the inserted item was previously assigned to this ref when "onAddNewRow" is triggered
              : this.grid.getDataItem(this._lastActiveRowNumber); // for clone, we can get item data context directly from DataView
          isFormValid = await this._options?.onSave(this.formValues, this.getCurrentRowSelections(), itemDataContext);
        }
        if (isFormValid) {
          this.dispose(); // when the form is valid, we can close the modal
        }
        break;
    }
  }

  /** Insert an item into the DataView or throw an error when finding duplicate id in the dataset */
  protected insertNewItemInDataView(item: any): void {
    const fullDatasetLength = this.dataView?.getItemCount() || 0;
    const newId = this._options.insertNewId ?? fullDatasetLength + 1;
    item[this.gridOptions.datasetIdPropertyName || 'id'] = newId;

    if (!this.dataView.getItemById(newId)) {
      this.gridService?.addItem(item, this._options.insertOptions);
    } else {
      this.executeOnError({
        type: 'error',
        code: 'ITEM_ALREADY_EXIST',
        message: `The item object which you are trying to add already exist with the same Id:: ${newId}`,
      });
    }
    return item;
  }

  protected parseText(inputText: string, mappedArgs: any): string {
    return inputText.replace(/\{\{(.*?)\}\}/g, (match, group) => {
      return mappedArgs[group] !== undefined ? mappedArgs[group] : match;
    });
  }

  /** Put back the current row to its original item data context using the DataView without triggering a change */
  protected resetCurrentRowDataContext(): void {
    const idPropName = this.gridOptions.datasetIdPropertyName || 'id';
    const dataView = this.grid.getData<SlickDataView>();
    dataView.updateItem(this._originalDataContext[idPropName], this._originalDataContext);
  }

  /** Validate all the Composite Editors that are defined in the form */
  protected validateCompositeEditors(targetElm?: HTMLElement): EditorValidationResult {
    let validationResults: EditorValidationResult = { valid: true, msg: '' };
    const currentEditor = this.grid.getCellEditor();

    if (currentEditor) {
      validationResults = currentEditor.validate(targetElm);
    }
    return validationResults;
  }

  /** Validate the current cell editor */
  protected validateCurrentEditor(): void {
    const currentEditor = this.grid.getCellEditor();
    if (currentEditor?.validate) {
      currentEditor.validate();
    }
  }
}
