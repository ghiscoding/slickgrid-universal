import 'slickgrid/slick.compositeeditor.js';

import {
  Editor,
  Column,
  CompositeEditorModalType,
  EditorValidationResult,
  getDescendantProperty,
  GetSlickEventType,
  GridOption,
  GridService,
  GridServiceInsertOption,
  sanitizeTextByAvailableSanitizer,
  SlickEventHandler,
  SlickGrid,
  SlickNamespace,
  SlickDataView,
  TranslaterService,
} from '@slickgrid-universal/common';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

const DEFAULT_ON_ERROR = (msg: string) => console.log(msg);

interface CompositeEditorOpenDetailOption {
  /**
   * Composite Editor modal header title with support to optional parsing and HTML rendering of any item property pulled from the dataContext, via template #{}
   * for example:
   * - #{title} => would display the item title, or you could even parse complex object like #{product.name} => displays the item product name
   * - Editing (id: <i>#{id}</i>) => would display the "Editing (id: 123)" where the Id has italic font style
   */
  headerTitle: string;

  /** When backdrop is set to "static", the modal will not close when clicking outside it. Default is undefined, which mean clicking outside the modal will close it */
  backdrop?: 'static' | null;

  /** Do we have the close button outside or inside the modal? Defaults to false (inside) */
  closeOutside?: boolean;

  /** Defaults to "bottom", which position in the grid do we want to insert and show the new row (on top or bottom of the grid) */
  insertOptions?: GridServiceInsertOption;

  /** what is the default insert Id to use when creating a new item? Defaults to dataset length + 1. */
  insertNewId?: number;

  /** Composite Editor modal type (create, edit, mass-update, mass-selection) */
  modalType?: CompositeEditorModalType;

  /**
   * Defaults to 1, how many columns do we want to show in the view layout?
   * For example if you wish to see your form split in a 2 columns layout (split view)
   */
  viewColumnLayout?: 1 | 2 | 3;

  /** onError callback allows user to override what the system does when an error (error message & type) is thrown, defaults to console.log */
  onError?: (errorMsg: string, errorType: 'error' | 'info' | 'warning') => void;
}

export class SlickCompositeEditorComponent {
  private _eventHandler: SlickEventHandler;
  private _modalElm: HTMLDivElement;
  private _options: CompositeEditorOpenDetailOption;
  private _lastCompositeEditor: { item: any; formValues: any; };
  private _lastActiveRowNumber: number;

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get dataView(): SlickDataView {
    return this.grid.getData() as SlickDataView;
  }

  get dataViewLength(): number {
    return this.dataView.getLength();
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
      closeOutside: true,
      viewColumnLayout: 1,
      modalType: 'edit',
    } as CompositeEditorOpenDetailOption;

    try {
      if (!this.grid || (this.grid.getEditorLock().isActive() && !this.grid.getEditorLock().commitCurrentEdit())) {
        return;
      }

      this._options = { ...defaultOptions, ...options, }; // merge default options with user options

      this._options.backdrop = options.backdrop !== undefined ? options.backdrop : 'static';
      const viewColumnLayout = this._options.viewColumnLayout || 1;
      const modalType = this._options.modalType || 'edit';
      const activeCell = this.grid.getActiveCell();
      const activeColIndex = activeCell && activeCell.cell || 0;
      const activeRow = activeCell && activeCell.row || 0;
      const gridUid = this.grid.getUID() || '';

      if (!this.gridOptions.editable) {
        onError('Your grid must be editable in order to use the Composite Editor Modal', 'error');
        return;
      } else if (!this.gridOptions.enableCellNavigation) {
        onError('Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.', 'error');
        return;
      } else if (!activeCell && modalType === 'edit') {
        onError('No records selected for edit operation', 'warning');
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
          onError('Current row is not editable', 'warning');
          return;
        } else if (modalType === 'mass-selection') {
          if (selectedRowsIndexes.length < 1) {
            onError('You must select some rows before trying to apply new value(s)', 'warning');
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

        // open the editor modal and we can also provide a header title with optional parsing pulled from the dataContext, via template #{}
        // for example #{title} => display the item title, or even complex object works #{product.name} => display item product name
        const parsedHeaderTitle = options.headerTitle.replace(/\#{(.*?)}/g, (_match, group) => getDescendantProperty(dataContext, group));
        const sanitizedHeaderTitle = sanitizeTextByAvailableSanitizer(this.gridOptions, parsedHeaderTitle);

        this._modalElm = document.createElement('div');
        this._modalElm.className = `slick-editor-modal ${gridUid}`;

        const modalContentElm = document.createElement('div');
        modalContentElm.className = 'slick-editor-modal-content';
        if (viewColumnLayout > 1) {
          const splitClassName = viewColumnLayout === 2 ? 'split-view' : 'triple-split-view';
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
        if (this._options.closeOutside) {
          modalHeaderTitleElm?.classList?.add('outside');
          modalCloseButtonElm?.classList?.add('outside');
        }

        const modalHeaderElm = document.createElement('div');
        modalHeaderElm.className = 'slick-editor-modal-header';
        modalHeaderElm.appendChild(modalHeaderTitleElm);
        modalHeaderElm.appendChild(modalCloseButtonElm);

        const modalBodyElm = document.createElement('div');
        modalBodyElm.className = 'slick-editor-modal-body';

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
        const modalSaveButtonElm = document.createElement('button');
        modalSaveButtonElm.type = 'button';
        modalSaveButtonElm.className = 'btn btn-save btn-primary btn-sm';
        modalSaveButtonElm.dataset.action = (modalType === 'create' || modalType === 'edit') ? 'save' : modalType;
        modalSaveButtonElm.dataset.ariaLabel = saveButtonText;
        modalSaveButtonElm.textContent = saveButtonText;

        const footerContainerElm = document.createElement('div');
        footerContainerElm.className = 'footer-buttons';

        if (modalType === 'mass-update' || modalType === 'mass-selection') {
          modalFooterElm.appendChild(selectionCounterElm);
        }
        footerContainerElm.appendChild(modalCancelButtonElm);
        footerContainerElm.appendChild(modalSaveButtonElm);
        modalFooterElm.appendChild(footerContainerElm);

        modalContentElm.appendChild(modalHeaderElm);
        modalContentElm.appendChild(modalBodyElm);
        modalContentElm.appendChild(modalFooterElm);
        this._modalElm.appendChild(modalContentElm);

        for (const columnDef of modalColumns) {
          if (columnDef.editor) {
            const itemContainer = document.createElement('div');
            itemContainer.className = `item-details-container editor-${columnDef.id}`;
            if (viewColumnLayout > 1) {
              itemContainer.classList.add('slick-col-medium-6', `slick-col-xlarge-${12 / viewColumnLayout}`);
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
          console.log('onCompositeEditorChange', args);
          const columnId = args.column?.id ?? '';

          // keep reference to the last composite editor, we'll need it when doing a MassUpdate or UpdateSelection
          this._lastCompositeEditor = {
            item: args.item,
            formValues: args.formValues
          };

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
        modalSaveButtonElm.addEventListener('click', this.handleSaveClicked.bind(this));
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
      onError(error, 'error');
    }
  }

  cancelEditing() {
    this.grid.getEditController().cancelCurrentEdit();
    this.grid.setActiveRow(this._lastActiveRowNumber);
    this.dispose();
  }

  handleSaveClicked() {
    switch (this._options?.modalType) {
      case 'mass-update':
        this.handleSaveMassUpdate();
        break;
      case 'mass-selection':
        this.handleSaveMassSelection();
        break;
      case 'create':
      case 'edit':
      default:
        this.grid.getEditController().commitCurrentEdit();
        break;
    }
  }

  handleSaveMassUpdate() {
    const validationResults = this.validateCompositeEditors();
    const isFormValid = validationResults.valid;
    const data = this.dataView.getItems();

    if (isFormValid && this._lastCompositeEditor && this._lastCompositeEditor.formValues) {
      // from the "lastCompositeEditor" object that we kept as reference, it contains all the changes inside the "formValues" property
      // we can loop through these changes and apply them on the selected row indexes
      for (const itemProp in this._lastCompositeEditor.formValues) {
        if (this._lastCompositeEditor.formValues.hasOwnProperty(itemProp)) {
          data.forEach(item => {
            if (this._lastCompositeEditor.formValues.hasOwnProperty(itemProp)) {
              item[itemProp] = this._lastCompositeEditor.formValues[itemProp];
            }
          });
        }
      }

      // change the entire dataset with our updated dataset
      this.dataView.setItems(data, this.gridOptions.datasetIdPropertyName);
      this.grid.invalidate();

      // once we're done doing the mass update, we can cancel the current editor since we don't want to add any new row
      // that will also destroy/close the modal window
      this.grid.getEditController().cancelCurrentEdit();
      this.grid.setActiveCell(0, 0, false);
      this.dispose();
    }
  }

  handleSaveMassSelection() {
    const validationResults = this.validateCompositeEditors();
    const isFormValid = validationResults.valid;
    const selectedRowsIndexes = this.grid.getSelectedRows();
    const data = this.dataView.getItems();

    if (isFormValid && this._lastCompositeEditor && this._lastCompositeEditor.formValues) {
      // from the "lastCompositeEditor" object that we kept as reference, it contains all the changes inside the "formValues" property
      // we can loop through these changes and apply them on the selected row indexes
      for (const itemProp in this._lastCompositeEditor.formValues) {
        if (this._lastCompositeEditor.formValues.hasOwnProperty(itemProp)) {
          selectedRowsIndexes.forEach(rowIndex => {
            if (data[rowIndex] && data[rowIndex].hasOwnProperty(itemProp) && this._lastCompositeEditor.formValues.hasOwnProperty(itemProp)) {
              data[rowIndex][itemProp] = this._lastCompositeEditor.formValues[itemProp];
              this.grid.updateRow(rowIndex);
            }
          });
        }
      }

      // once we're done doing the mass update, we can cancel the current editor since we don't want to add any new row
      // that will also destroy/close the modal window
      this.grid.getEditController().cancelCurrentEdit();
      this.grid.setActiveRow(this._lastActiveRowNumber);
      this.dispose();
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
        const onError = this._options?.onError ?? DEFAULT_ON_ERROR;
        onError('We could not find any Editor in your Column Definition', 'error');
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
