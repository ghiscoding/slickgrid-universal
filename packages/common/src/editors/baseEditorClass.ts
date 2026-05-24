import { BindingEventService } from '@slickgrid-universal/binding';
import { SlickEventData, type SlickGrid } from '../core/index.js';
import type { Column, ColumnEditor, CompositeEditorOption, EditorArguments, EditorValidator, GridOption } from './../interfaces/index.js';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class BaseEditorClass {
  protected _bindEventService: BindingEventService;
  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  protected grid: SlickGrid;

  /** Grid options */
  protected gridOptions: GridOption;

  constructor(protected readonly args: EditorArguments) {
    this.grid = args.grid;
    this.gridOptions = (this.grid.getOptions() || {}) as GridOption;
    this._bindEventService = new BindingEventService();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.editor || ({} as ColumnEditor);
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  // --
  // protected functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected checkInputUsabilityState(): boolean {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell
      .notify({
        ...activeCell,
        item: this.dataContext,
        column: this.args.column,
        grid: this.grid,
        target: 'composite',
        compositeEditorOptions: this.args.compositeEditorOptions,
      })
      .getReturnValue();
    return isCellEditable;
  }

  protected handleChangeOnCompositeEditor(
    event: Event | null,
    compositeEditorOptions: CompositeEditorOption,
    triggeredBy: 'user' | 'system' = 'user',
    isCalledByClearValue = false
  ): void {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const columnId = this.columnDef?.id ?? '';
    const item = this.dataContext;
    const grid = this.grid;

    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (
      isCalledByClearValue ||
      (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(columnId))
    ) {
      delete compositeEditorOptions.formValues[columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify(
      {
        ...activeCell,
        item,
        grid,
        column,
        formValues: compositeEditorOptions.formValues,
        editors: compositeEditorOptions.editors,
        triggeredBy,
      },
      new SlickEventData(event)
    );
  }
}
