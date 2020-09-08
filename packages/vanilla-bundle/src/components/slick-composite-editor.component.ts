import 'slickgrid/slick.compositeeditor.js';

import {
  Editor,
  Column,
  CompositeEditorOpenDetailOption,
  EditorValidationResult,
  getDescendantProperty,
  GetSlickEventType,
  GridOption,
  GridService,
  OnErrorOption,
  sanitizeTextByAvailableSanitizer,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  SlickDataView,
  TranslaterService,
} from '@slickgrid-universal/common';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

const DEFAULT_ON_ERROR = (error: OnErrorOption) => console.log(error.message);

export class SlickCompositeEditorComponent {
  private _eventHandler: SlickEventHandler;
  private _modalElm: HTMLDivElement;
  private _options: CompositeEditorOpenDetailOption;
  private _lastActiveRowNumber: number;
  private _formValues: any;
  private _modalBodyTopValidationElm: HTMLDivElement;
  private _modalSaveButtonElm: HTMLButtonElement;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get dataView(): SlickDataView {
    return this.grid.getData() as SlickDataView;
  }

  get dataViewLength(): number {
    return this.dataView.getLength();
  }

  get formValues(): any {
    return this._formValues;
  }

  get gridOptions(): GridOption {
    return this.grid.getOptions();
  }

  constructor(private grid: SlickGrid, private gridService: GridService, private translaterService?: TranslaterService) {
    this._eventHandler = new Slick.EventHandler();
    if (this.gridOptions.enableTranslate && (!this.translaterService || !this.translaterService.translate)) {
      throw new Error('[Slickgrid-Universal] requires a Translate Service to be installed and configured when the grid option "enableTranslate" is enabled.');
    }
  }

  /** Dispose of the Component & unsubscribe all events */
  dispose() {
    this._formValues = undefined;
    this.disposeComponent();
    this._eventHandler.unsubscribeAll();
  }

  /** Dispose of the Component without unsubscribing any events */
  disposeComponent() {
    if (typeof this._modalElm?.remove === 'function') {
      this._modalElm.remove();

      // remove the body backdrop click listener, every other listeners will be dropped automatically since we destroy the component
      document.body.classList.remove('slick-modal-open');
      document.body.removeEventListener('click', this.handleBodyClicked);
    }
  }

  openDetails(options: CompositeEditorOpenDetailOption): null | void {
    const onError = options.onError ?? DEFAULT_ON_ERROR;
    const defaultOptions = {
      backdrop: 'static',
      showCloseButtonOutside: true,
      viewColumnLayout: 'auto',
      modalType: 'edit',
    } as CompositeEditorOpenDetailOption;

    try {
      if (!this.grid || (this.grid.getEditorLock().isActive() && !this.grid.getEditorLock().commitCurrentEdit())) {
        return;
      }

      this._options = { ...defaultOptions, ...options, }; // merge default options with user options
      this._options.backdrop = options.backdrop !== undefined ? options.backdrop : 'static';
      const viewColumnLayout = this._options.viewColumnLayout || 1;
      const activeCell = this.grid.getActiveCell();
      const activeColIndex = activeCell?.cell ?? 0;
      const activeRow = activeCell?.row ?? 0;
      const gridUid = this.grid.getUID() || '';
      let headerTitle = options.headerTitle;

      if (this._options.modalType === 'auto-mass' && this.grid.getSelectedRows) {
        const selectedRowsIndexes = this.grid.getSelectedRows() || [];
        if (selectedRowsIndexes.length > 0) {
          this._options.modalType = 'mass-selection';
          headerTitle = options?.headerTitleMassSelection ?? options.headerTitle;
        } else {
          this._options.modalType = 'mass-update';
          headerTitle = options?.headerTitleMassUpdate ?? options.headerTitle;
        }
      }
      const modalType = this._options.modalType || 'edit';


      if (!this.gridOptions.editable) {
        onError({ type: 'error', code: 'EDITABLE_GRID_REQUIRED', message: 'Your grid must be editable in order to use the Composite Editor Modal.', });
        return;
      } else if (!this.gridOptions.enableCellNavigation) {
        onError({ type: 'error', code: 'ENABLE_CELL_NAVIGATION_REQUIRED', message: 'Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.', });
        return;
      } else if (!activeCell && modalType === 'edit') {
        onError({ type: 'warning', code: 'NO_RECORD_FOUND', message: 'No records selected for edit operation.' });
        return;
      } else {
        const dataContext = this.grid.getDataItem(activeRow);
        const isWithMassChange = (modalType === 'mass-update' || modalType === 'mass-selection');
        const columnDefinitions = this.grid.getColumns();
        const selectedRowsIndexes = this.grid.getSelectedRows();
        const datasetLength = this.dataViewLength;
        this._lastActiveRowNumber = activeRow;

        // focus on a first cell with an Editor (unless current cell already has an Editor then do nothing)
        // also when it's a "Create" modal, we'll scroll to the end of the grid
        const rowIndex = modalType === 'create' ? this.dataViewLength : activeRow;
        const hasFoundEditor = this.focusOnFirstCellWithEditor(columnDefinitions, dataContext, activeColIndex, rowIndex, isWithMassChange);
        if (!hasFoundEditor) {
          return;
        }

        if (modalType === 'edit' && !dataContext) {
          onError({ type: 'warning', code: 'ROW_NOT_EDITABLE', message: 'Current row is not editable.', });
          return;
        } else if (modalType === 'mass-selection') {
          if (selectedRowsIndexes.length < 1) {
            onError({ type: 'warning', code: 'ROW_SELECTION_REQUIRED', message: 'You must select some rows before trying to apply new value(s).', });
            return;
          }
        }

        let modalColumns: Column[] = [];
        if (isWithMassChange) {
          // when using Mass Update, we only care about the columns that have the "massUpdate: true", we disregard anything else
          modalColumns = columnDefinitions.filter(col => col.editor && col.internalColumnEditor?.massUpdate === true);
        } else {
          modalColumns = columnDefinitions.filter(col => col.editor);
        }

        // open the editor modal and we can also provide a header title with optional parsing pulled from the dataContext, via template {{ }}
        // for example {{title}} => display the item title, or even complex object works {{product.name}} => display item product name
        const parsedHeaderTitle = headerTitle.replace(/\{\{(.*?)\}\}/g, (_match, group) => getDescendantProperty(dataContext, group));
        const sanitizedHeaderTitle = sanitizeTextByAvailableSanitizer(this.gridOptions, parsedHeaderTitle);
        const layoutColCount = viewColumnLayout === 'auto' ? this.autoCalculateLayoutColumnCount(modalColumns.length) : viewColumnLayout;

        this._modalElm = document.createElement('div');
        this._modalElm.className = `slick-editor-modal ${gridUid}`;

        const modalContentElm = document.createElement('div');
        modalContentElm.className = 'slick-editor-modal-content';

        if (viewColumnLayout > 1 || (viewColumnLayout === 'auto' && layoutColCount > 1)) {
          const splitClassName = layoutColCount === 2 ? 'split-view' : 'triple-split-view';
          modalContentElm.classList.add(splitClassName);
        }

        const modalHeaderTitleElm = document.createElement('div');
        modalHeaderTitleElm.className = 'slick-editor-modal-title';
        modalHeaderTitleElm.innerHTML = sanitizedHeaderTitle;

        const modalCloseButtonElm = document.createElement('button');
        modalCloseButtonElm.type = 'button';
        modalCloseButtonElm.textContent = '×';
        modalCloseButtonElm.className = 'close';
        modalCloseButtonElm.dataset.action = 'close';
        modalCloseButtonElm.dataset.ariaLabel = 'Close';
        if (this._options.showCloseButtonOutside) {
          modalHeaderTitleElm?.classList?.add('outside');
          modalCloseButtonElm?.classList?.add('outside');
        }

        const modalHeaderElm = document.createElement('div');
        modalHeaderElm.className = 'slick-editor-modal-header';
        modalHeaderElm.appendChild(modalHeaderTitleElm);
        modalHeaderElm.appendChild(modalCloseButtonElm);

        const modalBodyElm = document.createElement('div');
        modalBodyElm.className = 'slick-editor-modal-body';

        this._modalBodyTopValidationElm = document.createElement('div');
        this._modalBodyTopValidationElm.className = 'validation-summary';
        this._modalBodyTopValidationElm.style.display = 'none';
        modalBodyElm.appendChild(this._modalBodyTopValidationElm);

        const modalFooterElm = document.createElement('div');
        modalFooterElm.className = 'slick-editor-modal-footer';

        const modalCancelButtonElm = document.createElement('button');
        modalCancelButtonElm.type = 'button';
        modalCancelButtonElm.className = 'btn btn-cancel btn-default btn-sm';
        modalCancelButtonElm.dataset.action = 'cancel';
        modalCancelButtonElm.dataset.ariaLabel = 'Cancel';
        modalCancelButtonElm.textContent = 'Cancel';

        let leftFooterText = '';
        switch (modalType) {
          case 'mass-update':
            leftFooterText = `all ${datasetLength} items`;
            break;
          case 'mass-selection':
            leftFooterText = `${selectedRowsIndexes.length} of ${datasetLength} selected`;
            break;
        }
        const selectionCounterElm = document.createElement('div');
        selectionCounterElm.className = 'selection-counter';
        selectionCounterElm.textContent = leftFooterText;

        const saveButtonText = (modalType === 'create' || modalType === 'edit') ? 'Save' : (modalType === 'mass-update') ? 'Mass Update' : 'Apply to Selection';
        this._modalSaveButtonElm = document.createElement('button');
        this._modalSaveButtonElm.type = 'button';
        this._modalSaveButtonElm.className = 'btn btn-save btn-primary btn-sm';
        this._modalSaveButtonElm.dataset.action = (modalType === 'create' || modalType === 'edit') ? 'save' : modalType;
        this._modalSaveButtonElm.dataset.ariaLabel = saveButtonText;
        this._modalSaveButtonElm.textContent = saveButtonText;

        const footerContainerElm = document.createElement('div');
        footerContainerElm.className = 'footer-buttons';

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
          if (columnDef.editor) {
            const itemContainer = document.createElement('div');
            itemContainer.className = `item-details-container editor-${columnDef.id}`;

            if (layoutColCount === 1) {
              itemContainer.classList.add('slick-col-medium-12');
            } else {
              itemContainer.classList.add('slick-col-medium-6', `slick-col-xlarge-${12 / layoutColCount}`);
            }

            const templateItemLabelElm = document.createElement('div');
            templateItemLabelElm.className = `item-details-label editor-${columnDef.id}`;
            templateItemLabelElm.textContent = this.getColumnLabel(columnDef) || 'n/a';

            const templateItemEditorElm = document.createElement('div');
            templateItemEditorElm.className = 'item-details-editor-container slick-cell';
            templateItemEditorElm.dataset.editorid = `${columnDef.id}`;

            const templateItemValidationElm = document.createElement('div');
            templateItemValidationElm.className = `item-details-validation editor-${columnDef.id}`;

            itemContainer.appendChild(templateItemLabelElm);
            itemContainer.appendChild(templateItemEditorElm);
            itemContainer.appendChild(templateItemValidationElm);
            modalBodyElm.appendChild(itemContainer);
          }
        }

        document.body.appendChild(this._modalElm);
        document.body.classList.add('slick-modal-open'); // add backdrop to body
        document.body.addEventListener('click', this.handleBodyClicked.bind(this));

        const containers = modalColumns.map(col => modalBodyElm.querySelector<HTMLDivElement>(`[data-editorid=${col.id}]`)) || [];

        const compositeEditor = new Slick.CompositeEditor(modalColumns, containers, { destroy: this.disposeComponent.bind(this), modalType, validationMsgPrefix: '* ', formValues: {} });
        this.grid.editActiveCell(compositeEditor);

        const onCompositeEditorChangeHandler = this.grid.onCompositeEditorChange;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCompositeEditorChangeHandler>>).subscribe(onCompositeEditorChangeHandler, (e, args) => {
          const columnId = args.column?.id ?? '';
          this._formValues = args.formValues;

          // add extra css styling to the composite editor input(s) that got modified
          if (args.formValues.hasOwnProperty(columnId)) {
            const editorElm = document.querySelector(`[data-editorid=${columnId}]`);
            editorElm?.classList?.add('modified');
          } else {
            const editorElm = document.querySelector(`[data-editorid=${columnId}]`);
            editorElm?.classList?.remove('modified');
          }

          // after any input changes we'll re-validate all fields
          this.validateCompositeEditors();
        });

        // add event handlers
        modalCloseButtonElm.addEventListener('click', this.cancelEditing.bind(this));
        modalCancelButtonElm.addEventListener('click', this.cancelEditing.bind(this));
        this._modalSaveButtonElm.addEventListener('click', this.handleSaveClicked.bind(this));
        this._modalElm.addEventListener('keydown', this.handleKeyDown.bind(this));
        this._modalElm.addEventListener('focusout', this.validateCurrentEditor.bind(this));
        this._modalElm.addEventListener('blur', this.validateCurrentEditor.bind(this));

        // when adding a new row to the grid, we need to invalidate that row and re-render the grid
        const onAddNewRowHandler = this.grid.onAddNewRow;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onAddNewRowHandler>>).subscribe(onAddNewRowHandler, (_e, args) => {
          console.log('add new row', args);
          const newId = options.insertNewId ?? this.dataViewLength + 1;
          const item = args.item;
          item[this.gridOptions.datasetIdPropertyName || ''] = newId;
          if (!this.dataView.getItemById(newId)) {
            this.gridService.addItem(item, options.insertOptions);
            this.dispose();
          }
        });
      }
    } catch (error) {
      this.dispose();
      const errorMsg = (typeof error === 'string') ? error : (error?.message ?? error?.body?.message ?? '');
      onError({ type: 'error', code: errorMsg, message: errorMsg });
    }
  }

  /** Apply Mass Update Changes from a the form changes */
  applySaveMassUpdateChanges(formValues: any) {
    const data = this.dataView.getItems();

    // from the "lastCompositeEditor" object that we kept as reference, it contains all the changes inside the "formValues" property
    // we can loop through these changes and apply them on the selected row indexes
    for (const itemProp in formValues) {
      if (formValues.hasOwnProperty(itemProp)) {
        data.forEach(item => {
          if (formValues.hasOwnProperty(itemProp)) {
            item[itemProp] = formValues[itemProp];
          }
        });
      }
    }

    // change the entire dataset with our updated dataset
    this.dataView.setItems(data, this.gridOptions.datasetIdPropertyName);
    this.grid.invalidate();
  }

  applySaveMassSelectionChanges(formValues: any) {
    const selectedRowsIndexes = this.grid.getSelectedRows();
    const data = this.dataView.getItems();

    // from the "lastCompositeEditor" object that we kept as reference, it contains all the changes inside the "formValues" property
    // we can loop through these changes and apply them on the selected row indexes
    for (const itemProp in formValues) {
      if (formValues.hasOwnProperty(itemProp)) {
        selectedRowsIndexes.forEach(rowIndex => {
          if (data[rowIndex] && data[rowIndex].hasOwnProperty(itemProp) && formValues.hasOwnProperty(itemProp)) {
            data[rowIndex][itemProp] = formValues[itemProp];
            this.grid.updateRow(rowIndex);
          }
        });
      }
    }
  }

  async cancelEditing() {
    let confirmed = true;
    if (this.formValues && Object.keys(this.formValues).length > 0 && typeof this._options.onClose === 'function') {
      confirmed = await this._options.onClose();
    }

    if (confirmed) {
      this.grid.getEditController().cancelCurrentEdit();
      this.grid.setActiveRow(this._lastActiveRowNumber);
      this.dispose();
    }
  }

  handleSaveClicked() {
    const modalType = this._options?.modalType;
    switch (modalType) {
      case 'mass-update':
        this.handleMassSaving(modalType, () => {
          this.grid.getEditController().cancelCurrentEdit();
          this.grid.setActiveCell(0, 0, false);
          this.dispose();
        });
        break;
      case 'mass-selection':
        this.handleMassSaving(modalType, () => {
          this.grid.getEditController().cancelCurrentEdit();
          this.grid.setActiveRow(this._lastActiveRowNumber);
          this.dispose();
        });
        break;
      case 'create':
      case 'edit':
      default:
        this.grid.getEditController().commitCurrentEdit();
        break;
    }
  }

  async handleMassSaving(modalType: 'mass-update' | 'mass-selection', executeCallback: () => void) {
    const validationResults = this.validateCompositeEditors();
    const isFormValid = validationResults.valid;
    this._modalBodyTopValidationElm.style.display = 'none';
    this._modalBodyTopValidationElm.textContent = '';
    const applyCallbackFnName = (modalType === 'mass-update') ? 'applySaveMassUpdateChanges' : 'applySaveMassSelectionChanges';

    try {
      if (typeof this[applyCallbackFnName] === 'function') {
        if (!this.formValues || Object.keys(this.formValues).length === 0) {
          this.executeOnError({ type: 'warning', code: 'NO_CHANGES_DETECTED', message: 'Sorry we could not detect any changes.' });
        } else if (isFormValid && this.formValues) {
          this._modalSaveButtonElm.classList.add('saving');
          this._modalSaveButtonElm.disabled = true;

          if (this._options?.onSave) {
            const successful = await this._options?.onSave(this.formValues, this[applyCallbackFnName].bind(this));

            if (successful) {
              // once we're done doing the mass update, we can cancel the current editor since we don't want to add any new row
              // that will also destroy/close the modal window
              executeCallback();
            }
          } else {
            this[applyCallbackFnName](this.formValues);
            executeCallback();
            this.dispose();
          }
          this._modalSaveButtonElm.disabled = false;
          this._modalSaveButtonElm.classList.remove('saving');
        }
      }
    } catch (errorMsg) {
      this._modalBodyTopValidationElm.textContent = errorMsg;
      this._modalBodyTopValidationElm.style.display = 'block';
      this._modalSaveButtonElm.disabled = false;
      this._modalSaveButtonElm.classList.remove('saving');
    }
  }

  validateCurrentEditor() {
    const currentEditor = this.grid.getCellEditor();
    if (currentEditor?.validate) {
      currentEditor.validate();
    }
  }

  // --
  // private methods
  // ----------------

  /**
   * Auto-Calculate how many columns to display in the view layout (1, 2, or 3).
   * We'll display a 1 column layount for 8 or less Editors, 2 columns layout for less than 15 Editors or 3 columns when more than 15 Editors
   * @param {number} editorCount - how many Editors do we have in total
   * @returns {number} count - calculated column count (1, 2 or 3)
   */
  private autoCalculateLayoutColumnCount(editorCount: number): number {
    if (editorCount >= 15) {
      return 3;
    } else if (editorCount >= 8) {
      return 2;
    }
    return 1;
  }

  private executeOnError(error: OnErrorOption) {
    const onError = this._options?.onError ?? DEFAULT_ON_ERROR;
    onError(error);
  }
  /**
   * Get the column label, the label might have an optional "columnGroup" (or "columnGroupKey" which need to be translated)
   * @param {object} columnDef - column definition
   * @returns {string} label - column label
   */
  private getColumnLabel(columnDef: Column): string {
    const columnGroupSeparator = this.gridOptions.columnGroupSeparator || ' - ';
    let columnName = columnDef.name || '';
    let columnGroup = columnDef.columnGroup || '';

    if (this.gridOptions.enableTranslate && this.translaterService) {
      if (columnDef.nameKey) {
        columnName = this.translaterService.translate(columnDef.nameKey);
      }
      if (columnDef.columnGroupKey && this.translaterService?.translate) {
        columnGroup = this.translaterService.translate(columnDef.columnGroupKey);
      }
    }

    const columnLabel = columnGroup ? `${columnGroup}${columnGroupSeparator}${columnName}` : columnName;
    return columnLabel || '';
  }

  private handleBodyClicked(event: Event) {
    if ((event.target as HTMLElement)?.classList?.contains('slick-editor-modal')) {
      if (this._options?.backdrop !== 'static') {
        this.dispose();
      }
    }
  }

  private handleKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.cancelEditing();
      event.stopPropagation();
      event.preventDefault();
    } else if (event.code === 'Tab') {
      this.validateCurrentEditor();
    }
  }

  // For the Composite Editor to work, the current active cell must have an Editor (because it calls editActiveCell() and that only works with a cell with an Editor)
  // so if current active cell doesn't have an Editor, we'll find the first column with an Editor and focus on it (from left to right starting at index 0)
  private focusOnFirstCellWithEditor(columns: Column[], dataContext: any, columnIndex: number, rowIndex: number, isWithMassChange: boolean): boolean {
    let columnIndexWithEditor = columnIndex;
    const cellEditor = columns[columnIndex].editor;

    if (!cellEditor || !this.getActiveCellEditor(rowIndex, columnIndex)) {
      columnIndexWithEditor = this.findNextAvailableEditorColumnIndex(columns, dataContext, rowIndex, isWithMassChange);
      if (columnIndexWithEditor === -1) {
        this.executeOnError({ type: 'error', code: 'NO_EDITOR_FOUND', message: 'We could not find any Editor in your Column Definition' });
        return false;
      } else {
        this.grid.setActiveCell(rowIndex, columnIndexWithEditor, false);
        if (isWithMassChange) {
          // when it's a mass change, we'll activate the last row without scrolling to it
          // that is possible via the 3rd argument "suppressScrollIntoView" set to "true"
          this.grid.setActiveRow(this.dataViewLength, columnIndexWithEditor, true);
        }
      }
    }
    return true;
  }

  private findNextAvailableEditorColumnIndex(columns: Column[], dataContext: any, rowIndex: number, isWithMassUpdate: boolean): number {
    let columnIndexWithEditor = -1;

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const col = columns[colIndex];
      if (col.editor && (!isWithMassUpdate || (isWithMassUpdate && col.internalColumnEditor?.massUpdate))) {
        // we can check that the cell is really editable by checking the onBeforeEditCell event not returning false (returning undefined, null also mean it is editable)
        const isCellEditable = this.grid.onBeforeEditCell.notify({ row: rowIndex, cell: colIndex, item: dataContext, column: col, grid: this.grid });
        this.grid.setActiveCell(rowIndex, colIndex, false);
        if (isCellEditable !== false) {
          columnIndexWithEditor = colIndex;
          break;
        }
      }
    }
    return columnIndexWithEditor;
  }

  private getActiveCellEditor(row: number, cell: number): Editor | null {
    this.grid.setActiveCell(row, cell, false);
    return this.grid.getCellEditor();
  }

  private validateCompositeEditors(targetElm?: HTMLElement): EditorValidationResult {
    let validationResults: EditorValidationResult = { valid: true, msg: '' };
    const currentEditor = this.grid.getCellEditor();

    if (currentEditor) {
      validationResults = currentEditor.validate(targetElm);
    }
    return validationResults;
  }
}
