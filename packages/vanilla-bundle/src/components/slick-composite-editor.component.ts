import 'slickgrid/slick.compositeeditor.js';

import {
  Editor,
  Column,
  CompositeEditorExtension,
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
} from '@slickgrid-universal/common';

// using external non-typed js libraries
declare const Slick: SlickNamespace;


interface CompositeEditorOpenDetailOption {
  /**
   * Composite Editor modal header title with support to optional parsing and HTML rendering of any item property pulled from the dataContext, via template #{}
   * for example:
   * - #{title} => would display the item title, or you could even parse complex object like #{product.name} => displays the item product name
   * - Editing (id: <i>#{id}</i>) => would display the "Editing (id: 123)" where the Id has italic font style
   */
  headerTitle: string;

  /** Do we have the close button outside or inside the modal? Defaults to false (inside) */
  closeOutside?: boolean;

  /** Defaults to "bottom", which position in the grid do we want to insert and show the new row (on top or bottom of the grid) */
  insertOptions?: GridServiceInsertOption;

  /** what is the default insert Id to use when creating a new item? Defaults to dataset length + 1. */
  insertNewId?: number;

  /** Composite Editor modal type (create, edit, mass-update, mass-selection) */
  modalType?: CompositeEditorModalType;

  /** onError callback allows user to override what the system does when an error (error message & type) is thrown, defaults to console.log */
  onError: (errorMsg: string, errorType: 'error' | 'info' | 'warning') => void;
}

export class SlickCompositeEditorComponent {
  private _eventHandler: SlickEventHandler;
  private _modalElm: HTMLDivElement;
  private _modalType: CompositeEditorModalType;
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

  constructor(private grid: SlickGrid, private gridService: GridService) {
    this._eventHandler = new Slick.EventHandler();
  }

  dispose() {
    this.disposeComponent();
    this._eventHandler.unsubscribeAll();
  }

  disposeComponent() {
    if (typeof this._modalElm?.remove === 'function') {
      this._modalElm.remove();

      // remove the body backdrop click listener, every other listeners will be dropped automatically since we destroy the component
      document.body.classList.remove('slick-modal-open');
      document.body.removeEventListener('click', this.handleBodyClicked);
    }

  }

  openDetails(options: CompositeEditorOpenDetailOption = { headerTitle: 'Details', modalType: 'edit', onError: (msg) => console.log(msg) }) {
    try {
      if (!this.grid || (this.grid.getEditorLock().isActive() && !this.grid.getEditorLock().commitCurrentEdit())) {
        return;
      }

      this._modalType = options.modalType || 'edit';
      const activeCell = this.grid.getActiveCell();
      const activeRow = activeCell && activeCell.row || 0;
      const gridUid = this.grid.getUID() || '';

      if (!this.gridOptions.editable) {
        options.onError('Your grid must be editable in order to use the Composite Editor Modal', 'error');
      } else if (!this.gridOptions.enableCellNavigation) {
        options.onError('Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.', 'error');
      } else if (!activeCell && options.modalType === 'edit') {
        options.onError('No records selected for edit operation', 'warning');
      } else {
        const dataContext = this.grid.getDataItem(activeRow);
        const isWithMassChange = (options.modalType === 'mass-update' || options.modalType === 'mass-selection');
        const columnDefinitions = this.grid.getColumns();
        const selectedRowsIndexes = this.grid.getSelectedRows();
        const datasetLength = this.dataViewLength;
        this._lastActiveRowNumber = activeRow;

        // focus on a first cell with an Editor (unless current cell already has an Editor then do nothing)
        // also when it's a "Create" modal, we'll scroll to the end of the grid
        const rowIndex = options.modalType === 'create' ? this.dataViewLength : activeRow;
        this.focusOnFirstCellWithEditor(columnDefinitions, rowIndex, isWithMassChange);

        if (options.modalType === 'edit' && !dataContext) {
          options.onError('Current row is not editable', 'warning');
          return;
        } else if (options.modalType === 'mass-selection') {
          if (selectedRowsIndexes.length < 1) {
            options.onError('You must select some rows before trying to apply new value(s)', 'warning');
            return;
          }
        }

        let modalColumns = [];
        if (isWithMassChange) {
          // when using Mass Update, we only care about the columns that have the "massUpdate: true", we disregard anything else
          modalColumns = columnDefinitions.filter(col => col.internalColumnEditor?.massUpdate);
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

        const modalHeaderTitleElm = document.createElement('div');
        modalHeaderTitleElm.className = 'slick-editor-modal-title';
        modalHeaderTitleElm.innerHTML = sanitizedHeaderTitle;

        const modalCloseButtonElm = document.createElement('button');
        modalCloseButtonElm.type = 'button';
        modalCloseButtonElm.textContent = '×';
        modalCloseButtonElm.className = 'close';
        modalCloseButtonElm.dataset.action = 'close';
        modalCloseButtonElm.dataset.ariaLabel = 'Close';
        if (options?.closeOutside) {
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
        switch (options.modalType) {
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

        const saveButtonText = (options.modalType === 'create' || options.modalType === 'edit') ? 'Save' : (options.modalType === 'mass-update') ? 'Mass Update' : 'Apply to Selection';
        const modalSaveButtonElm = document.createElement('button');
        modalSaveButtonElm.type = 'button';
        modalSaveButtonElm.className = 'btn btn-save btn-primary btn-sm';
        modalSaveButtonElm.dataset.action = (options.modalType === 'create' || options.modalType === 'edit') ? 'save' : options.modalType;
        modalSaveButtonElm.dataset.ariaLabel = saveButtonText;
        modalSaveButtonElm.textContent = saveButtonText;

        const footerContainerElm = document.createElement('div');
        footerContainerElm.className = 'footer-buttons';

        if (options.modalType === 'mass-update' || options.modalType === 'mass-selection') {
          modalFooterElm.appendChild(selectionCounterElm);
        }
        footerContainerElm.appendChild(modalCancelButtonElm);
        footerContainerElm.appendChild(modalSaveButtonElm);
        modalFooterElm.appendChild(footerContainerElm);

        modalContentElm.appendChild(modalHeaderElm);
        modalContentElm.appendChild(modalBodyElm);
        modalContentElm.appendChild(modalFooterElm);
        this._modalElm.appendChild(modalContentElm);

        for (const column of modalColumns) {
          if (column.editor) {
            const templateItemLabelElm = document.createElement('div');
            templateItemLabelElm.className = `item-details-label editor-${column.id}`;
            templateItemLabelElm.textContent = column.name || 'n/a';

            const templateItemEditorElm = document.createElement('div');
            templateItemEditorElm.className = 'item-details-editor-container slick-cell';
            templateItemEditorElm.dataset.editorid = `${column.id}`;

            const templateItemValidationElm = document.createElement('div');
            templateItemValidationElm.className = `item-details-validation editor-${column.id}`;

            modalBodyElm.appendChild(templateItemLabelElm);
            modalBodyElm.appendChild(templateItemEditorElm);
            modalBodyElm.appendChild(templateItemValidationElm);
          }
        }

        document.body.appendChild(this._modalElm);
        document.body.classList.add('slick-modal-open'); // add backdrop to body
        document.body.addEventListener('click', this.handleBodyClicked.bind(this));

        const containers = modalColumns.map(col => modalBodyElm.querySelector<HTMLDivElement>(`[data-editorid=${col.id}]`)) || [];
        // const compositeEditor = new CompositeEditorExtension(modalColumns, containers, { destroy: this.dispose.bind(this) });
        // this.grid.editActiveCell((compositeEditor.editor) as unknown as Editor);

        // @ts-ignore
        const compositeEditor = new Slick.CompositeEditor(modalColumns, containers, { destroy: this.disposeComponent.bind(this), modalType: options.modalType });
        this.grid.editActiveCell(compositeEditor);

        const onCompositeEditorChangeHandler = this.grid.onCompositeEditorChange;
        (this._eventHandler as SlickEventHandler<GetSlickEventType<typeof onCompositeEditorChangeHandler>>).subscribe(onCompositeEditorChangeHandler, (e, args) => {
          console.log('onCompositeEditorChange', args);

          // keep reference to the last composite editor, we'll need it when doing a MassUpdate or UpdateSelection
          this._lastCompositeEditor = {
            item: args.item,
            formValues: args.formValues
          };

          // add extra css styling to the composite editor input(s) that got modified
          const editorElm = document.querySelector(`[data-editorid=${args.column?.id ?? ''}]`);
          editorElm?.classList?.add('modified');

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
          const newId = options?.insertNewId ?? this.dataViewLength + 1;
          const item = args.item;
          item[this.gridOptions.datasetIdPropertyName || ''] = newId;
          if (!this.dataView.getItemById(newId)) {
            this.gridService.addItem(item, options?.insertOptions);
            this.dispose();
          }
        });
      }
    } catch (error) {
      this.dispose();
      options.onError(error, 'error');
    }
  }

  cancelEditing() {
    this.grid.getEditController().cancelCurrentEdit();
    this.grid.setActiveRow(this._lastActiveRowNumber);
    this.dispose();
  }

  handleSaveClicked() {
    switch (this._modalType) {
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
    currentEditor.validate();
  }

  // --
  // private methods
  // ----------------

  private handleBodyClicked(event: Event) {
    if ((event.target as HTMLElement)?.classList?.contains('slick-editor-modal')) {
      this.dispose();
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
  private focusOnFirstCellWithEditor(columns: Column[], rowIndex: number, isWithMassChange: boolean) {
    let columnIndexWithEditor = 0;

    const hasEditor = columns[columnIndexWithEditor].editor;
    if (!hasEditor) {
      if (isWithMassChange) {
        columnIndexWithEditor = columns.findIndex(col => col.internalColumnEditor?.massUpdate);
      } else {
        columnIndexWithEditor = columns.findIndex(col => col.editor);
      }
      if (columnIndexWithEditor === -1) {
        throw new Error('We could not find any Editor in your Column Definition');
      } else {
        this.grid.setActiveCell(rowIndex, columnIndexWithEditor, false);
        if (isWithMassChange) {
          // when it's a mass change, we'll activate the last row without scrolling to it
          // that is possible via the 3rd argument "suppressScrollIntoView" set to "true"
          this.grid.setActiveRow(this.dataViewLength, columnIndexWithEditor, true);
        }
      }
    }
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
