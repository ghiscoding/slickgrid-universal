import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, setDeepValue, toSentenceCase } from '@slickgrid-universal/utils';

import { Constants } from './../constants';
import type { Column, ColumnEditor, CompositeEditorOption, Editor, EditorArguments, EditorValidator, EditorValidationResult, GridOption } from './../interfaces/index';
import { getDescendantProperty, } from '../services/utilities';
import { SlickEventData, type SlickGrid } from '../core/index';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class CheckboxEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _checkboxContainerElm!: HTMLDivElement;
  protected _input!: HTMLInputElement;
  protected _isValueTouched = false;
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
    return this.columnDef?.internalColumnEditor || {} as ColumnEditor;
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): any {
    return this._input;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init(): void {
    const columnId = this.columnDef?.id ?? '';
    const compositeEditorOptions = this.args.compositeEditorOptions;

    this._checkboxContainerElm = createDomElement('div', { className: `checkbox-editor-container editor-${columnId}` });

    this._input = createDomElement('input', {
      type: 'checkbox', value: 'true',
      ariaLabel: this.columnEditor?.ariaLabel ?? `${toSentenceCase(columnId + '')} Checkbox Editor`,
      className: `editor-checkbox editor-${columnId}`,
      title: this.columnEditor?.title ?? '',
    });

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
      this._bindEventService.bind(this._input, 'click', () => {
        this._isValueTouched = true;
        this.save();
      });
    }

    if (compositeEditorOptions) {
      this._bindEventService.bind(this._input, 'change', ((event: KeyboardEvent) => {
        this._isValueTouched = true;
        this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
      }) as EventListener);
    } else {
      this.focus();
    }
  }

  destroy() {
    this._bindEventService.unbindAll();
    this._input?.remove?.();
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
          this.reset(false, true, true);
        }
      } else {
        this._input.removeAttribute('disabled');
        this._checkboxContainerElm.classList.remove('disabled');
      }
    }
  }

  focus(): void {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();
    this._input?.focus();
  }

  /** pre-click, when enabled, will simply toggle the checkbox without requiring to double-click */
  preClick() {
    if (this._input) {
      this._input.checked = !this._input.checked;
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

  setValue(val: boolean | string, isApplyingValue = false, triggerOnCompositeEditorChange = true) {
    const isChecked = val ? true : false;
    if (this._input) {
      this._input.checked = isChecked;
    }

    if (isApplyingValue) {
      this.applyValue(this.args.item, this.serializeValue());

      // if it's set by a Composite Editor, then also trigger a change for it
      const compositeEditorOptions = this.args.compositeEditorOptions;
      if (compositeEditorOptions && triggerOnCompositeEditorChange) {
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
      if (isComplexObject) {// when it's a complex object, user could override the object path (where the editable object is located)
        // else we use the path provided in the Field Column Definition
        const objectPath = this.columnEditor?.complexObjectPath ?? fieldName ?? '';
        setDeepValue(item, objectPath, newValue);
      } else {
        item[fieldName] = newValue;
      }
    }
  }

  isValueChanged(): boolean {
    return (this.serializeValue() !== this._originalValue);
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
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

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: boolean, triggerCompositeEventWhenExist = true, clearByDisableCommand = false) {
    const inputValue = value ?? this._originalValue ?? false;
    if (this._input) {
      this._originalValue = inputValue;
      this._input.checked = !!(inputValue);
    }
    this._isValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'user', shouldDeleteFormValue);
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

  validate(_targetElm?: any, inputValue?: any): EditorValidationResult {
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
    const isCellEditable = this.grid.onBeforeEditCell.notify({
      ...activeCell, item: this.dataContext, column: this.args.column, grid: this.grid, target: 'composite', compositeEditorOptions: this.args.compositeEditorOptions
    }).getReturnValue();
    this.disable(isCellEditable === false);
  }

  protected handleChangeOnCompositeEditor(event: Event | null, compositeEditorOptions: CompositeEditorOption, triggeredBy: 'user' | 'system' = 'user', isCalledByClearValue = false) {
    const activeCell = this.grid.getActiveCell();
    const column = this.args.column;
    const columnId = this.columnDef?.id ?? '';
    const item = this.dataContext;
    const grid = this.grid;
    const newValue = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.dataContext, newValue);
    }
    this.applyValue(compositeEditorOptions.formValues, newValue);

    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (isCalledByClearValue || (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(columnId))) {
      delete compositeEditorOptions.formValues[columnId]; // when the input is disabled we won't include it in the form result object
    }
    grid.onCompositeEditorChange.notify(
      { ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues, editors: compositeEditorOptions.editors, triggeredBy },
      new SlickEventData(event)
    );
  }
}
