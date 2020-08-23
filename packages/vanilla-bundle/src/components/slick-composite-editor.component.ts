// import 'slickgrid/slick.compositeeditor.js';
import { Editor, CompositeEditorExtension, getDescendantProperty, SlickGrid } from '@slickgrid-universal/common';

export class SlickCompositeEditorComponent {
  private _modalElm: HTMLDivElement;

  constructor(private grid: SlickGrid) { }

  dispose() {
    if (typeof this._modalElm?.remove === 'function') {
      this._modalElm.remove();

      // remove the body backdrop click listener, every other listeners will be dropped automatically since we destroy the component
      document.body.classList.remove('slick-modal-open');
      document.body.removeEventListener('click', this.handleBodyClicked);
    }
  }

  openDetails(headerTitle = 'Details', options?: { closeOutside: boolean; }) {
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

      // open the editor modal and we can also provide a header title with optional parsing pulled from the dataContext, via template #{}
      // for example #{title} => display the item title, or even complex object works #{product.name} => display item product name
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

      const modalContentElm = document.createElement('div');
      modalContentElm.className = 'slick-editor-modal-content';

      const modalHeaderTitleElm = document.createElement('div');
      modalHeaderTitleElm.className = 'slick-editor-modal-title';
      modalHeaderTitleElm.textContent = parsedHeaderTitle;

      const modalCloseButtonElm = document.createElement('button');
      modalCloseButtonElm.type = 'button';
      modalCloseButtonElm.textContent = '×';
      modalCloseButtonElm.className = 'close';
      modalCloseButtonElm.dataset.action = 'close';
      modalCloseButtonElm.dataset.ariaLabel = 'Close';
      if (options?.closeOutside) {
        modalHeaderTitleElm.classList.add('outside');
        modalCloseButtonElm.classList.add('outside');
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
      modalCancelButtonElm.className = 'btn btn-cancel btn-default';
      modalCancelButtonElm.dataset.action = 'cancel';
      modalCancelButtonElm.dataset.ariaLabel = 'Cancel';
      modalCancelButtonElm.textContent = 'Cancel';

      const modalSaveButtonElm = document.createElement('button');
      modalSaveButtonElm.type = 'button';
      modalSaveButtonElm.className = 'btn btn-save btn-primary';
      modalSaveButtonElm.dataset.action = 'save';
      modalSaveButtonElm.dataset.ariaLabel = 'Save';
      modalSaveButtonElm.textContent = 'Save';

      modalFooterElm.appendChild(modalCancelButtonElm);
      modalFooterElm.appendChild(modalSaveButtonElm);

      modalContentElm.appendChild(modalHeaderElm);
      modalContentElm.appendChild(modalBodyElm);
      modalContentElm.appendChild(modalFooterElm);
      this._modalElm.appendChild(modalContentElm);

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
      document.body.classList.add('slick-modal-open'); // add backdrop to body
      document.body.addEventListener('click', this.handleBodyClicked.bind(this));

      const containers = columnDefinitions.map(col => modalBodyElm.querySelector<HTMLDivElement>(`[data-editor-id=${col.id}]`)) || [];
      const compositeEditor = new CompositeEditorExtension(columnDefinitions, containers, { destroy: this.dispose.bind(this) });
      this.grid.editActiveCell((compositeEditor.editor) as unknown as Editor);

      // @ts-ignore
      // const compositeEditor = new Slick.CompositeEditor(columnDefinitions, containers, { destroy: this.dispose.bind(this) });
      // this.grid.editActiveCell(compositeEditor);

      // add event handlers
      modalCloseButtonElm.addEventListener('click', this.cancelEditing.bind(this));
      modalCancelButtonElm.addEventListener('click', this.cancelEditing.bind(this));
      modalSaveButtonElm.addEventListener('click', this.commitEditing.bind(this));
      this._modalElm.addEventListener('keydown', this.handleKeyDown.bind(this));
      this._modalElm.addEventListener('focusout', this.validateCurrentEditor.bind(this));
      this._modalElm.addEventListener('blur', this.validateCurrentEditor.bind(this));
    }
  }

  cancelEditing() {
    this.grid.getEditController().cancelCurrentEdit();
  }

  commitEditing() {
    this.grid.getEditController().commitCurrentEdit();
  }

  validateCurrentEditor() {
    const currentEditor = this.grid.getCellEditor();
    currentEditor.validate();
  }

  // --
  // private methods
  // ----------------

  private handleBodyClicked(event: Event) {
    if ((event.target as HTMLElement).classList.contains('slick-editor-modal')) {
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
}
