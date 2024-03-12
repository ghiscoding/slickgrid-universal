import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, setDeepValue, toSentenceCase } from '@slickgrid-universal/utils';

import type {
  DOMEvent,
  Column,
  ColumnEditor,
  ColumnEditorDualInput,
  CompositeEditorOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  GridOption,
} from '../interfaces/index';
import { getDescendantProperty } from '../services/utilities';
import { floatValidator, integerValidator, textValidator } from '../editorValidators';
import { SlickEventData, SlickEventHandler, type SlickGrid } from '../core';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class DualInputEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _eventHandler: SlickEventHandler;
  protected _isValueSaveCalled = false;
  protected _lastEventType: string | undefined;
  protected _lastInputKeyEvent?: KeyboardEvent;
  protected _leftInput!: HTMLInputElement;
  protected _isLeftValueTouched = false;
  protected _isRightValueTouched = false;
  protected _rightInput!: HTMLInputElement;
  protected _leftFieldName!: string;
  protected _rightFieldName!: string;
  protected _originalLeftValue!: string | number;
  protected _originalRightValue!: string | number;
  protected _timer?: NodeJS.Timeout;

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
    this._eventHandler = new SlickEventHandler();
    this._bindEventService = new BindingEventService();
    this.init();

    this._eventHandler.subscribe(this.grid.onValidationError, () => this._isValueSaveCalled = true);
  }

  /** Get Column Definition object */
  get columnDef(): Column {
    return this.args.column;
  }

  /** Get Column Editor object */
  get columnEditor(): ColumnEditor {
    return this.columnDef?.editor || {} as ColumnEditor;
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): { leftInput: HTMLInputElement, rightInput: HTMLInputElement; } {
    return { leftInput: this._leftInput, rightInput: this._rightInput };
  }

  get editorParams(): ColumnEditorDualInput {
    return this.columnEditor.params || {};
  }

  get eventHandler(): SlickEventHandler {
    return this._eventHandler;
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  get isValueSaveCalled(): boolean {
    return this._isValueSaveCalled;
  }

  /** Get the Shared Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor?.validator ?? this.columnDef?.validator;
  }

  init() {
    if (!this.editorParams || !this.editorParams.leftInput || !this.editorParams.leftInput.field || !this.editorParams.rightInput || !this.editorParams.rightInput.field) {
      throw new Error(`[Slickgrid-Universal] Please make sure that your Combo Input Editor has params defined with "leftInput" and "rightInput" (example: { editor: { model: Editors.comboInput, params: { leftInput: { field: 'firstName' }, { rightSide: { field: 'lastName' } }}}`);
    }
    this._leftFieldName = this.editorParams.leftInput?.field;
    this._rightFieldName = this.editorParams.rightInput?.field;
    this._leftInput = this.createInput('leftInput');
    this._rightInput = this.createInput('rightInput');

    const containerElm = this.args?.container;
    if (containerElm && typeof containerElm.appendChild === 'function') {
      containerElm.appendChild(this._leftInput);
      containerElm.appendChild(this._rightInput);
    }

    this._bindEventService.bind(this._leftInput, 'keydown', ((event: KeyboardEvent) => this.handleKeyDown(event, 'leftInput')) as EventListener);
    this._bindEventService.bind(this._rightInput, 'keydown', ((event: KeyboardEvent) => this.handleKeyDown(event, 'rightInput')) as EventListener);

    // the lib does not get the focus out event for some reason, so register it here
    if (this.hasAutoCommitEdit) {
      this._bindEventService.bind(this._leftInput, 'focusout', ((event: DOMEvent<HTMLInputElement>) => this.handleFocusOut(event, 'leftInput')) as EventListener);
      this._bindEventService.bind(this._rightInput, 'focusout', ((event: DOMEvent<HTMLInputElement>) => this.handleFocusOut(event, 'rightInput')) as EventListener);
    }

    const compositeEditorOptions = this.args?.compositeEditorOptions;
    if (compositeEditorOptions) {
      this._bindEventService.bind(this._leftInput, 'input', this.handleChangeOnCompositeEditorDebounce.bind(this) as EventListener);
      this._bindEventService.bind(this._rightInput, 'input', this.handleChangeOnCompositeEditorDebounce.bind(this) as EventListener);
    } else {
      setTimeout(() => this._leftInput.select(), 50);
    }
  }

  handleFocusOut(event: DOMEvent<HTMLInputElement>, position: 'leftInput' | 'rightInput') {
    // when clicking outside the editable cell OR when focusing out of it
    const targetClassNames = event.relatedTarget?.className || '';
    const compositeEditorOptions = this.args.compositeEditorOptions;

    if (!compositeEditorOptions && (targetClassNames.indexOf('dual-editor') === -1 && this._lastEventType !== 'focusout-right')) {
      if (position === 'rightInput' || (position === 'leftInput' && this._lastEventType !== 'focusout-left')) {
        if (position === 'leftInput') {
          this._isLeftValueTouched = true;
        } else {
          this._isRightValueTouched = true;
        }
        this.save();
      }
    }
    const side = (position === 'leftInput') ? 'left' : 'right';
    this._lastEventType = `${event?.type}-${side}`;
  }

  handleKeyDown(event: KeyboardEvent, position: 'leftInput' | 'rightInput') {
    if (position === 'leftInput') {
      this._isLeftValueTouched = true;
    } else {
      this._isRightValueTouched = true;
    }
    this._lastInputKeyEvent = event;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'Tab') {
      event.stopImmediatePropagation();
    }
  }

  destroy() {
    // unsubscribe all SlickGrid events
    this._eventHandler.unsubscribeAll();
    this._bindEventService.unbindAll();
    this._leftInput?.remove?.();
    this._rightInput?.remove?.();
  }

  createInput(position: 'leftInput' | 'rightInput'): HTMLInputElement {
    const editorSideParams = this.editorParams[position];
    const columnId = this.columnDef?.id ?? '';
    const idPropName = this.gridOptions.datasetIdPropertyName || 'id';
    const itemId = this.args?.item?.[idPropName] ?? '';

    let fieldType: string = editorSideParams.type || 'text';
    if (fieldType === 'float' || fieldType === 'integer') {
      fieldType = 'number';
    }

    const input = createDomElement('input', {
      type: fieldType || 'text',
      id: `item-${itemId}-${position}`,
      ariaLabel: this.columnEditor?.ariaLabel ?? `${toSentenceCase(columnId + '')} Input Editor`,
      className: `dual-editor-text editor-${columnId} ${position.replace(/input/gi, '')}`,
      autocomplete: 'off', ariaAutoComplete: 'none',
      placeholder: editorSideParams.placeholder || '',
      title: editorSideParams.title || '',
    });

    if (fieldType === 'readonly') {
      // when the custom type is defined as readonly, we'll make a readonly text input
      input.readOnly = true;
      fieldType = 'text';
    }
    if (fieldType === 'number') {
      input.step = this.getInputDecimalSteps(position);
    }
    return input;
  }

  disable(isDisabled = true) {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._leftInput && this._rightInput) {
      if (isDisabled) {
        this._leftInput.setAttribute('disabled', 'disabled');
        this._rightInput.setAttribute('disabled', 'disabled');

        // clear the checkbox when it's newly disabled
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions) {
          this.reset('', true, true);
        }
      } else {
        this._leftInput.removeAttribute('disabled');
        this._rightInput.removeAttribute('disabled');
      }
    }
  }

  focus() {
    // always set focus on grid first, then do nothing since we have 2 inputs and we might focus on left/right depending on which is invalid and/or new
    this.grid.focus();
  }

  show() {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValues(): { [fieldName: string]: string | number; } {
    const obj = {};
    const leftInputValue = this._leftInput.value;
    const rightInputValue = this._rightInput.value;
    const isLeftInputTypeNumber = (this.editorParams.leftInput && (this.editorParams.leftInput.type === 'float' || this.editorParams.leftInput.type === 'integer'));
    const isRightInputTypeNumber = (this.editorParams.rightInput && (this.editorParams.rightInput.type === 'float' || this.editorParams.rightInput.type === 'integer'));
    const resultLeftValue = (leftInputValue !== '' && isLeftInputTypeNumber) ? +this._leftInput.value : (leftInputValue || '');
    const resultRightValue = (rightInputValue !== '' && isRightInputTypeNumber) ? +this._rightInput.value : (rightInputValue || '');
    setDeepValue(obj, this._leftFieldName, resultLeftValue);
    setDeepValue(obj, this._rightFieldName, resultRightValue);

    return obj;
  }

  setValues(values: Array<number | string>) {
    if (Array.isArray(values) && values.length === 2) {
      this._leftInput.value = `${values[0]}`;
      this._rightInput.value = `${values[1]}`;
    }
  }

  applyValue(item: any, state: any) {
    this.applyValueByPosition(item, state, 'leftInput');
    this.applyValueByPosition(item, state, 'rightInput');
  }

  applyValueByPosition(item: any, state: any, position: 'leftInput' | 'rightInput') {
    const fieldName = position === 'leftInput' ? this._leftFieldName : this._rightFieldName;
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      let fieldNameToUse = fieldName;
      if (isComplexObject) {
        const complexFieldNames = fieldName.split(/\.(.*)/);
        fieldNameToUse = (complexFieldNames.length > 1 ? complexFieldNames[1] : complexFieldNames) as string;
      }

      // validate the value before applying it (if not valid we'll set an empty string)
      const stateValue = isComplexObject ? getDescendantProperty(state, fieldNameToUse) : state[fieldName];
      const validation = this.validate(null, { position, inputValue: stateValue });

      // set the new value to the item datacontext
      if (isComplexObject) {
        const newValueFromComplex = getDescendantProperty(state, fieldNameToUse);
        const newValue = (validation && validation.valid) ? newValueFromComplex : '';
        // when it's a complex object, user could override the object path (where the editable object is located)
        // else we use the path provided in the Field Column Definition
        const objectPath = this.columnEditor?.complexObjectPath ?? fieldName ?? '';
        setDeepValue(item, objectPath, newValue);
      } else if (fieldName) {
        item[fieldName] = (validation && validation.valid) ? state[fieldName] : '';
      }
    }
  }

  isValueChanged(): boolean {
    const leftElmValue = this._leftInput.value;
    const rightElmValue = this._rightInput.value;
    const leftEditorParams = this.editorParams?.leftInput;
    const rightEditorParams = this.editorParams?.rightInput;
    const lastEventKey = this._lastInputKeyEvent?.key;
    if ((leftEditorParams && leftEditorParams.alwaysSaveOnEnterKey || rightEditorParams && rightEditorParams.alwaysSaveOnEnterKey) && lastEventKey === 'Enter') {
      return true;
    }
    const leftResult = (!(leftElmValue === '' && (this._originalLeftValue === null || this._originalLeftValue === undefined))) && (leftElmValue !== this._originalLeftValue);
    const rightResult = (!(rightElmValue === '' && (this._originalRightValue === null || this._originalRightValue === undefined))) && (rightElmValue !== this._originalRightValue);
    return leftResult || rightResult;
  }

  isValueTouched(): boolean {
    return this._isLeftValueTouched || this._isRightValueTouched;
  }

  loadValue(item: any) {
    this.loadValueByPosition(item, 'leftInput');
    this.loadValueByPosition(item, 'rightInput');
    this._leftInput.select();
  }

  loadValueByPosition(item: any, position: 'leftInput' | 'rightInput') {
    // is the field a complex object, "address.streetNumber"
    const fieldName = (position === 'leftInput') ? this._leftFieldName : this._rightFieldName;
    const originalValuePosition = (position === 'leftInput') ? '_originalLeftValue' : '_originalRightValue';
    const inputVarPosition = (position === 'leftInput') ? '_leftInput' : '_rightInput';

    if (item && fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0;
      const itemValue = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) ? item[fieldName] : '');

      this[originalValuePosition] = itemValue;
      if (this.editorParams[position].type === 'float') {
        const decimalPlaces = this.getDecimalPlaces(position);
        if (decimalPlaces !== null && (this[originalValuePosition] || this[originalValuePosition] === 0) && typeof this[originalValuePosition] !== undefined) {
          this[originalValuePosition] = (+this[originalValuePosition]).toFixed(decimalPlaces);
        }
      }
      if (this[inputVarPosition]) {
        this[inputVarPosition].value = `${this[originalValuePosition]}`;
      }
    }
  }

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: number | string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false) {
    const inputLeftValue = value ?? this._originalLeftValue ?? '';
    const inputRightValue = value ?? this._originalRightValue ?? '';
    if (this._leftInput && this._rightInput) {
      this._originalLeftValue = inputLeftValue;
      this._originalRightValue = inputRightValue;
      this._leftInput.value = `${inputLeftValue}`;
      this._rightInput.value = `${inputRightValue}`;
    }
    this._isLeftValueTouched = false;
    this._isRightValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'user', shouldDeleteFormValue);
    }
  }

  save() {
    const validation = this.validate();
    const isValid = (validation && validation.valid) || false;

    if (!this._isValueSaveCalled) {
      if (this.hasAutoCommitEdit && isValid) {
        this.grid.getEditorLock().commitCurrentEdit();
      } else {
        this.args.commitChanges();
      }
      this._isValueSaveCalled = true;
    }
  }

  serializeValue(): { [fieldName: string]: any; } {
    const obj = {};
    const leftValue = this.serializeValueByPosition('leftInput');
    const rightValue = this.serializeValueByPosition('rightInput');

    setDeepValue(obj, this._leftFieldName, leftValue);
    setDeepValue(obj, this._rightFieldName, rightValue);

    return obj;
  }

  serializeValueByPosition(position: 'leftInput' | 'rightInput') {
    const elmValue = position === 'leftInput' ? this._leftInput.value : this._rightInput.value;
    if (elmValue === '' || isNaN(+elmValue)) {
      return elmValue;
    }

    let rtn = parseFloat(elmValue);
    const decPlaces = this.getDecimalPlaces(position);
    if (decPlaces !== null && (rtn || rtn === 0) && rtn.toFixed) {
      rtn = parseFloat(rtn.toFixed(decPlaces));
    }

    return rtn;
  }

  getDecimalPlaces(position: 'leftInput' | 'rightInput'): number {
    const defaultDecimalPlaces = 0;

    // returns the number of fixed decimal places or null
    const positionSide = position === 'leftInput' ? 'leftInput' : 'rightInput';
    const sideParams = this.editorParams[positionSide];
    const rtn: number | undefined = sideParams?.decimal;

    if (rtn === undefined) {
      return defaultDecimalPlaces;
    }
    return rtn;
  }

  getInputDecimalSteps(position: 'leftInput' | 'rightInput'): string {
    const decimals = this.getDecimalPlaces(position);
    let zeroString = '';
    for (let i = 1; i < decimals; i++) {
      zeroString += '0';
    }

    if (decimals > 0) {
      return `0.${zeroString}1`;
    }
    return '1';
  }

  validate(_targetElm?: any, inputValidation?: { position: 'leftInput' | 'rightInput', inputValue: any; }): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    if (inputValidation) {
      const posValidation = this.validateByPosition(inputValidation.position, inputValidation.inputValue);
      if (!posValidation.valid) {
        inputValidation.position === 'leftInput' ? this._leftInput.select() : this._rightInput.select();
        return posValidation;
      }
    } else {
      const leftValidation = this.validateByPosition('leftInput');
      const rightValidation = this.validateByPosition('rightInput');

      if (!leftValidation.valid) {
        this._leftInput.select();
        return leftValidation;
      }
      if (!rightValidation.valid) {
        this._rightInput.select();
        return rightValidation;
      }
    }
    return { valid: true, msg: '' };
  }

  validateByPosition(position: 'leftInput' | 'rightInput', inputValue?: any): EditorValidationResult {
    const positionEditorParams = this.editorParams[position];
    let currentVal: any = '';
    if (inputValue) {
      currentVal = inputValue;
    } else {
      const input = position === 'leftInput' ? this._leftInput : this._rightInput;
      currentVal = input && input.value;
    }

    // there are 2 ways of passing a Validator, 1-independent validator on each side, 2-shared validator
    const commonValidator = this.validator;
    currentVal = typeof commonValidator === 'function' ? this.getValues() : currentVal;
    const baseValidatorOptions = {
      editorArgs: this.args,
      errorMessage: positionEditorParams.errorMessage,
      required: this.args?.compositeEditorOptions ? false : positionEditorParams.required,
      validator: typeof commonValidator === 'function' ? commonValidator : positionEditorParams.validator,
    };

    switch (positionEditorParams.type) {
      case 'float':
        return floatValidator(currentVal, {
          ...baseValidatorOptions,
          decimal: this.getDecimalPlaces(position),
          minValue: positionEditorParams.minValue,
          maxValue: positionEditorParams.maxValue,
          operatorConditionalType: positionEditorParams.operatorConditionalType,
        });
      case 'integer':
        return integerValidator(currentVal, {
          ...baseValidatorOptions,
          minValue: positionEditorParams.minValue,
          maxValue: positionEditorParams.maxValue,
          operatorConditionalType: positionEditorParams.operatorConditionalType,
        });
      case 'text':
      case 'password':
      default:
        return textValidator(currentVal, baseValidatorOptions);
    }
  }

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
    const leftInputId = this.columnEditor.params?.leftInput?.field ?? '';
    const rightInputId = this.columnEditor.params?.rightInput?.field ?? '';
    const item = this.dataContext;
    const grid = this.grid;
    const newValues = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.dataContext, newValues);
    }
    this.applyValue(compositeEditorOptions.formValues, newValues);

    // when the input is disabled we won't include it in the form result object
    // we'll check with both left/right inputs
    const isExcludeDisabledFieldFormValues = this.gridOptions?.compositeEditorOptions?.excludeDisabledFieldFormValues ?? false;
    if (isCalledByClearValue || (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(leftInputId))) {
      delete compositeEditorOptions.formValues[leftInputId];
    }
    if (isCalledByClearValue || (this.disabled && isExcludeDisabledFieldFormValues && compositeEditorOptions.formValues.hasOwnProperty(rightInputId))) {
      delete compositeEditorOptions.formValues[rightInputId];
    }
    grid.onCompositeEditorChange.notify(
      { ...activeCell, item, grid, column, formValues: compositeEditorOptions.formValues, editors: compositeEditorOptions.editors, triggeredBy },
      new SlickEventData(event)
    );
  }

  protected handleChangeOnCompositeEditorDebounce(event: KeyboardEvent) {
    const compositeEditorOptions = this.args?.compositeEditorOptions;
    if (compositeEditorOptions) {
      const typingDelay = this.gridOptions?.editorTypingDebounce ?? 500;
      clearTimeout(this._timer as NodeJS.Timeout);
      this._timer = setTimeout(() => this.handleChangeOnCompositeEditor(event, compositeEditorOptions), typingDelay);
    }
  }
}
