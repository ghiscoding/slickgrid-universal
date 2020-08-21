import { Editor, CompositeEditorExtension, getDescendantProperty, SlickGrid } from '@slickgrid-universal/common';

export class SlickCompositeEditorComponent {
  private _modalElm: HTMLDivElement;

  constructor(private grid: SlickGrid) { }

  dispose() {
    if (typeof this._modalElm?.remove === 'function') {
      this._modalElm.remove();
    }
  }

  openDetails(headerTitle = 'Details') {
    const activeCell = this.grid.getActiveCell();
    const gridOptions = this.grid.getOptions();
    const gridUid = this.grid.getUID() || '';

    if (!this.grid || (this.grid.getEditorLock().isActive() && !this.grid.getEditorLock().commitCurrentEdit())) {
      return;
    }

    if (!gridOptions.enableCellNavigation) {
      throw new Error('Composite Editor requires the flag "enableCellNavigation" to be set to True in your Grid Options.');
    } else if (!activeCell) {
      throw new Error('No records selected for edit operation');
    } else {
      const columnDefinitions = this.grid.getColumns();
      let columnIndexWithEditor = activeCell.cell || 0;
      const dataContext = this.grid.getDataItem(activeCell.row);
      const parsedHeaderTitle = headerTitle.replace(/\#{(.*?)}/g, (_match, group) => getDescendantProperty(dataContext, group));

      // make sure that current active cell has an editor
      // if current active cell doesn't have an Editor, we'll find the next available cell with an editor (from left to right starting at index 0)
      // then we'll change the active cell to that position so that we can call the editActiveCell() on it
      const hasEditor = columnDefinitions[columnIndexWithEditor].editor;
      if (!hasEditor) {
        columnIndexWithEditor = columnDefinitions.findIndex(col => col.editor);
        if (columnIndexWithEditor === -1) {
          throw new Error('We could not find any Editor in your Column Definition');
        } else {
          this.grid.setActiveCell(activeCell.row, columnIndexWithEditor, false);
        }
      }

      this._modalElm = document.createElement('div');
      this._modalElm.className = `slick-editor-modal ${gridUid}`;

      const modalHeaderTitleElm = document.createElement('div');
      modalHeaderTitleElm.className = 'slick-editor-modal-title';
      modalHeaderTitleElm.textContent = parsedHeaderTitle;

      const modalCloseButtonElm = document.createElement('button');
      modalCloseButtonElm.type = 'button';
      modalCloseButtonElm.className = 'close mdi mdi-close mdi-20px';
      modalCloseButtonElm.dataset.action = 'cancel';
      modalCloseButtonElm.dataset.ariaLabel = 'Close';

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
      modalCancelButtonElm.className = 'btn btn-save btn-default';
      modalCancelButtonElm.dataset.action = 'cancel';
      modalCancelButtonElm.dataset.ariaLabel = 'Cancel';
      modalCancelButtonElm.textContent = 'Cancel';

      const modalSaveButtonElm = document.createElement('button');
      modalSaveButtonElm.type = 'button';
      modalSaveButtonElm.className = 'btn btn-cancel btn-primary';
      modalSaveButtonElm.dataset.action = 'save';
      modalSaveButtonElm.dataset.ariaLabel = 'Save';
      modalSaveButtonElm.textContent = 'Save';

      modalFooterElm.appendChild(modalCancelButtonElm);
      modalFooterElm.appendChild(modalSaveButtonElm);

      this._modalElm.appendChild(modalHeaderElm);
      this._modalElm.appendChild(modalBodyElm);
      this._modalElm.appendChild(modalFooterElm);

      for (const column of columnDefinitions) {
        if (column.editor) {
          const templateItemLabelElm = document.createElement('div');
          templateItemLabelElm.className = 'slick-editor-detail-label';
          templateItemLabelElm.textContent = column.name || 'n/a';

          const templateItemEditorElm = document.createElement('div');
          templateItemEditorElm.className = 'slick-editor-detail-container slick-cell';
          templateItemEditorElm.dataset.editorId = `${column.id}`;

          const templateItemValidationElm = document.createElement('div');
          templateItemValidationElm.className = `slick-editor-detail-validation editor-${column.id}`;

          modalBodyElm.appendChild(templateItemLabelElm);
          modalBodyElm.appendChild(templateItemEditorElm);
          modalBodyElm.appendChild(templateItemValidationElm);
        }
      }

      document.body.appendChild(this._modalElm);

      const containers = columnDefinitions.map(col => modalBodyElm.querySelector<HTMLDivElement>(`[data-editor-id=${col.id}]`)) || [];
      const compositeEditor = new CompositeEditorExtension(columnDefinitions, containers, { destroy: this.dispose.bind(this) });
      this.grid.editActiveCell(compositeEditor.editor as unknown as Editor);

      // add event handlers
      modalCloseButtonElm.addEventListener('click', this.handleCancelClicked.bind(this));
      modalCancelButtonElm.addEventListener('click', this.handleCancelClicked.bind(this));
      modalSaveButtonElm.addEventListener('click', this.handleSaveClicked.bind(this));
      this._modalElm.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.code === 'Escape') {
          this.handleCancelClicked();
          event.stopPropagation();
          event.preventDefault();
        } else if (event.code === 'Tab') {
          this.validateCurrentEditor();
        }
      });
      this._modalElm.addEventListener('focusout', this.validateCurrentEditor.bind(this));
      this._modalElm.addEventListener('blur', this.validateCurrentEditor.bind(this));
    }
  }

  handleCancelClicked() {
    this.grid.getEditController().cancelCurrentEdit();
  }

  handleSaveClicked() {
    this.grid.getEditController().commitCurrentEdit();
  }

  validateCurrentEditor() {
    const currentEditor = this.grid.getCellEditor();
    currentEditor.validate();
  }
}
