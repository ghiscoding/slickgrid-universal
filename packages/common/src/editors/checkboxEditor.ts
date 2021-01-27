import { Constants } from './../constants';
import { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, GridOption, SlickGrid, SlickNamespace } from './../interfaces/index';
import { getDescendantProperty, setDeepValue } from '../services/utilities';
import { BindingEventService } from '../services/bindingEvent.service';

// using external non-typed js libraries
declare const Slick: SlickNamespace;

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class CheckboxEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _input: HTMLInputElement | null;
  protected _checkboxContainerElm: HTMLDivElement;
  protected _originalValue?: boolean | string;

  /** is the Editor disabled? */
  disabled = false;

  /** SlickGrid Grid object */
  grid: SlickGrid;

  /** Grid options */
  gridOptions: GridOption;

  constructor(protected readonly args: EditorArguments) {
    if (!args) {
      throw new Error('[Slickgrid-Universal] Something is wrong with this grid, an Editor must always have valid arguments.');
    }
    this.grid = args.grid;
    this.gridOptions = (this.grid.getOptions() || {}) as GridOption;
    this._bindEventService = new BindingEventService();
    this.init();
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef && this.columnDef.internalColumnEditor || {};
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): any {
    return this._input;
  }

  get hasAutoCommitEdit() {
    return this.args.grid.getOptions().autoCommitEdit;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return (this.columnEditor && this.columnEditor.validator) || (this.columnDef && this.columnDef.validator);
  }

  init(): void {
    const columnId = this.columnDef?.id ?? '';
    const title = this.columnEditor?.title ?? '';
    const compositeEditorOptions = this.args.compositeEditorOptions;

    this._checkboxContainerElm = document.createElement('div');
    this._checkboxContainerElm.className = `checkbox-editor-container editor-${columnId}`;

    this._input = document.createElement('input');
    this._input.className = `editor-checkbox editor-${columnId}`;
    this._input.title = title;
    this._input.type = 'checkbox';
    this._input.value = 'true';

    const cellContainer = this.args?.container;
    if (cellContainer && typeof cellContainer.appendChild === 'function') {
      if (compositeEditorOptions) {
        this._checkboxContainerElm.appendChild(this._input);
        cellContainer.appendChild(this._checkboxContainerElm);
      } else {
        cellContainer.appendChild(this._input);
      }
    }

    // make the checkbox editor act like a regular checkbox that commit the value on click
    if (this.hasAutoCommitEdit && !compositeEditorOptions) {
      this._bindEventService.bind(this._input, 'click', () => this.save());
    }

    if (compositeEditorOptions) {
      this._bindEventService.bind(this._input, 'change', (event: KeyboardEvent) => this.handleChangeOnCompositeEditor(event, compositeEditorOptions));
    } else {
      this.focus();
    }
  }

  destroy() {
    this._bindEventService.unbindAll();
    if (this._input?.remove) {
      this._input.remove();
    }
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._input) {
      if (isDisabled) {
        this._input.setAttribute('disabled', 'disabled');
        this._checkboxContainerElm.classList.add('disabled');

        // clear checkbox when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== false) {
          this._input.checked = false;
          this._originalValue = undefined;
          this.handleChangeOnCompositeEditor(null, this.args.compositeEditorOptions);
        }
      } else {
        this._input.removeAttribute('disabled');
        this._checkboxContainerElm.classList.remove('disabled');
      }
    }
  }

  focus(): void {
    if (this._input) {
      this._input.focus();
    }
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValue() {
    return this._input?.checked ?? false;
  }

  setValue(val: boolean | string, isApplyingValue = false) {
    const isChecked = val ? true : false;
    if (this._input) {
      this._input.checked = isChecked;
    }

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions) {
        this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'system');
      }
    }
  }

  applyValue(item: any, state: any) {
    const fieldName = this.columnDef && this.columnDef.field;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      // validate the value before applying it (if not valid we'll set an empty string)
      const validation = this.validate(null, state);
      const newValue = (validation && validation.valid) ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        setDeepValue(item, fieldName, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    return (this.serializeValue() !== this._originalValue);
  }

  loadValue(item: any) {
    const fieldName = this.columnDef && this.columnDef.field;

    if (item && fieldName !== undefined && this._input) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const value = (isComplexObject) ? getDescendantProperty(item, fieldName) : item[fieldName];

      this._originalValue = value;
      this._input.checked = !!this._originalValue;
    }
  }

  save() {
    const validation = this.validate();
    const isValid = (validation && validation.valid) || false;

    if (this.hasAutoCommitEdit && isValid) {
      // do not use args.commitChanges() as this sets the focus to the next row.
      // also the select list will stay shown when clicking off the grid
      this.grid.getEditorLock().commitCurrentEdit();
    } else {
      this.args.commitChanges();
    }
  }

  serializeValue(): boolean {
    return this._input?.checked ?? false;
  }

  validate(_targetElm?: null, inputValue?: any): EditorValidationResult {
    const isRequired = this.args?.compositeEditorOptions ? false : this.columnEditor.required;
    const isChecked = (inputValue !== undefined) ? inputValue : this._input?.checked;
    const errorMsg = this.columnEditor.errorMessage;

    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    if (this.validator) {
      return this.validator(isChecked, this.args);
    }

    // by default the editor is almost always valid (except when it's required but not provided)
    if (isRequired && !isChecked) {
      return {
        valid: false,
        msg: errorMsg || Constants.VALIDATION_REQUIRED_FIELD
      };
    }

    return {
      valid: true,
      msg: null
    };
  }

  // --
  // protected functions
  // ------------------

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState() {
    const activeCell = this.grid.getActiveCell();
    const isCellEditable = this.grid.onBeforeEditCell.notify({ ...activeCell, item: this.args.item, column: this.args.column, grid: this.grid });
    this.disable(isCellEditable === false);
  }

  protected handleChangeOnCompositeEditor(event: Event | null, compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user') {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const columnId = this.columnDef?.id ?? '';
    const item = this.args.item;
    const grid = this.grid;
    const newValue = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.args.item, newValue);
    }
    this.applyValue(compositeEditorOptions.formValues, newValue);

    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(columnId)) {
      delete compositeEditorOptions.formValues[columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify(
      { ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues, editors: compositeEditorOptions.editors, triggeredBy },
      { ...new Slick.EventData(), ...event }
    );
  }
}
