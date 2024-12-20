import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, setDeepValue, toSentenceCase } from '@slickgrid-universal/utils';

import { Constants } from '../constants.js';
import type {
  Column,
  ColumnEditor,
  CompositeEditorOption,
  CurrentSliderOption,
  Editor,
  EditorArguments,
  EditorValidator,
  EditorValidationResult,
  GridOption,
  SliderOption,
} from '../interfaces/index.js';
import { getDescendantProperty } from '../services/utilities.js';
import { sliderValidator } from '../editorValidators/sliderValidator.js';
import { SlickEventData, type SlickGrid } from '../core/index.js';

/*
 * An example of a 'detached' editor.
 * KeyDown events are also handled to provide handling for Tab, Shift-Tab, Esc and Ctrl-Enter.
 */
export class SliderEditor implements Editor {
  protected _bindEventService: BindingEventService;
  protected _defaultValue = 0;
  protected _isValueTouched = false;
  protected _originalValue?: number | string;
  protected _cellContainerElm!: HTMLElement;
  protected _editorElm!: HTMLDivElement;
  protected _inputElm!: HTMLInputElement;
  protected _sliderOptions!: CurrentSliderOption;
  protected _sliderTrackElm!: HTMLDivElement;
  protected _sliderNumberElm: HTMLSpanElement | null = null;

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
    return this.columnDef?.editor ?? ({} as ColumnEditor);
  }

  /** Getter for the item data context object */
  get dataContext(): any {
    return this.args.item;
  }

  /** Getter for the Editor DOM Element */
  get editorDomElement(): HTMLDivElement {
    return this._editorElm;
  }

  /** Getter for the Editor Input DOM Element */
  get editorInputDomElement(): HTMLInputElement {
    return this._inputElm;
  }

  get editorOptions(): SliderOption {
    return { ...this.gridOptions.defaultEditorOptions?.slider, ...this.columnEditor?.editorOptions };
  }

  get hasAutoCommitEdit(): boolean {
    return this.gridOptions.autoCommitEdit ?? false;
  }

  /** Getter for the current Slider Options */
  get sliderOptions(): CurrentSliderOption | undefined {
    return this._sliderOptions;
  }

  /** Get the Validator function, can be passed in Editor property or Column Definition */
  get validator(): EditorValidator | undefined {
    return this.columnEditor.validator ?? this.columnDef?.validator;
  }

  init(): void {
    this._cellContainerElm = this.args?.container;

    if (this._cellContainerElm && this.columnDef) {
      // define the input & slider number IDs
      const compositeEditorOptions = this.args.compositeEditorOptions;

      // create HTML string template
      this._editorElm = this.buildDomElement();

      if (!compositeEditorOptions) {
        this.focus();
      }

      // watch on change event
      this._cellContainerElm.appendChild(this._editorElm);
      this._bindEventService.bind(this._sliderTrackElm, ['click', 'mouseup'], this.sliderTrackClicked.bind(this) as EventListener);
      this._bindEventService.bind(this._inputElm, ['change', 'mouseup', 'touchend'], this.handleChangeEvent.bind(this) as EventListener);

      // if user chose to display the slider number on the right side, then update it every time it changes
      // we need to use both "input" and "change" event to be all cross-browser
      this._bindEventService.bind(this._inputElm, ['input', 'change'], this.handleChangeSliderNumber.bind(this));
    }
  }

  cancel(): void {
    if (this._inputElm) {
      this._inputElm.value = `${this._originalValue}`;
    }
    this.args.cancelChanges();
  }

  destroy(): void {
    this._bindEventService.unbindAll();
    this._inputElm?.remove();
    this._editorElm?.remove();
    this._sliderTrackElm?.remove();
  }

  disable(isDisabled = true): void {
    const prevIsDisabled = this.disabled;
    this.disabled = isDisabled;

    if (this._inputElm) {
      if (isDisabled) {
        this._inputElm.disabled = true;

        // clear value when it's newly disabled and not empty
        const currentValue = this.getValue();
        if (prevIsDisabled !== isDisabled && this.args?.compositeEditorOptions && currentValue !== '') {
          this.reset(0, true, true);
        }
      } else {
        this._inputElm.disabled = false;
      }
    }
  }

  focus(): void {
    // always set focus on grid first so that plugin to copy range (SlickCellExternalCopyManager) would still be able to paste at that position
    this.grid.focus();
    this._inputElm?.focus();
  }

  show(): void {
    const isCompositeEditor = !!this.args?.compositeEditorOptions;
    if (isCompositeEditor) {
      // when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor
      this.applyInputUsabilityState();
    }
  }

  getValue(): string {
    return this._inputElm?.value ?? '';
  }

  setValue(value: number | string, isApplyingValue = false, triggerOnCompositeEditorChange = true): void {
    if (this._inputElm) {
      this._inputElm.value = `${value}`;
    }
    if (this._sliderNumberElm) {
      this._sliderNumberElm.textContent = `${value}`;
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

  applyValue(item: any, state: any): void {
    const fieldName = this.columnDef?.field ?? '';
    if (fieldName !== undefined) {
      const isComplexObject = fieldName?.indexOf('.') > 0; // is the field a complex object, "address.streetNumber"

      const validation = this.validate(undefined, state);
      const newValue = validation && validation.valid ? state : '';

      // set the new value to the item datacontext
      if (isComplexObject) {
        // when it's a complex object, user could override the object path (where the editable object is located)
        // else we use the path provided in the Field Column Definition
        const objectPath = this.columnEditor.complexObjectPath ?? fieldName ?? '';
        setDeepValue(item, objectPath, newValue);
      } else if (item) {
        item[fieldName] = newValue;
      }
    }
  }

  /**
   * Dynamically change an Editor option, this is especially useful with Composite Editor
   * since this is the only way to change option after the Editor is created (for example dynamically change "minDate" or another Editor)
   * @param {string} optionName - Slider editor option name
   * @param {newValue} newValue - Slider editor new option value
   */
  changeEditorOption<T extends keyof Required<CurrentSliderOption & SliderOption>, K extends Required<CurrentSliderOption & SliderOption>[T]>(
    optionName: T,
    newValue: K
  ): void {
    if (this.columnEditor) {
      this.columnEditor.editorOptions ??= {};
      this.columnEditor.editorOptions[optionName] = newValue;
      (this._sliderOptions as any)[optionName] = newValue;

      switch (optionName) {
        case 'hideSliderNumber':
          this.renderSliderNumber(this._editorElm, 0);
          break;
        case 'sliderStartValue':
          this._inputElm.value = `${newValue}`;
          this._inputElm.defaultValue = `${newValue}`;
          break;
        case 'maxValue':
        case 'minValue':
        case 'step':
          this._inputElm[optionName.replace('Value', '') as 'min' | 'max' | 'step'] = `${newValue}`;
          break;
      }
    }
  }

  isValueChanged(): boolean {
    const elmValue = this._inputElm?.value ?? '';
    return !(elmValue === '' && this._originalValue === undefined) && +elmValue !== this._originalValue;
  }

  isValueTouched(): boolean {
    return this._isValueTouched;
  }

  loadValue(item: any): void {
    const fieldName = this.columnDef?.field ?? '';

    if (item && fieldName !== undefined) {
      // is the field a complex object, "address.streetNumber"
      const isComplexObject = fieldName?.indexOf('.') > 0;
      // prettier-ignore
      let value = (isComplexObject) ? getDescendantProperty(item, fieldName) : (item.hasOwnProperty(fieldName) ? item[fieldName] : this._defaultValue);

      if (value === '' || value === null || value === undefined) {
        value = this._defaultValue; // load default value when item doesn't have any value
      }
      this._originalValue = +value;
      if (this._inputElm) {
        this._inputElm.value = `${value}`;
        this._inputElm.title = `${value}`;
      }
      if (this._sliderNumberElm) {
        this._sliderNumberElm.textContent = `${value}`;
      }
    }
    this.updateTrackFilledColorWhenEnabled();
  }

  /**
   * You can reset or clear the input value,
   * when no value is provided it will use the original value to reset (could be useful with Composite Editor Modal with edit/clone)
   */
  reset(value?: number | string, triggerCompositeEventWhenExist = true, clearByDisableCommand = false): void {
    const inputValue = value ?? this._originalValue ?? 0;
    if (this._inputElm) {
      this._inputElm.value = `${inputValue}`;
    }
    if (this._sliderNumberElm) {
      this._sliderNumberElm.textContent = `${inputValue}`;
    }
    this._isValueTouched = false;

    const compositeEditorOptions = this.args.compositeEditorOptions;
    if (compositeEditorOptions && triggerCompositeEventWhenExist) {
      const shouldDeleteFormValue = !clearByDisableCommand;
      this.handleChangeOnCompositeEditor(null, compositeEditorOptions, 'user', shouldDeleteFormValue);
    }
  }

  save(): void {
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

  serializeValue(): string | number | undefined {
    const elmValue: string = this._inputElm?.value ?? '';
    return elmValue !== '' ? parseInt(elmValue, 10) : this._originalValue;
  }

  validate(_targetElm?: any, inputValue?: any): EditorValidationResult {
    // when using Composite Editor, we also want to recheck if the field if disabled/enabled since it might change depending on other inputs on the composite form
    if (this.args.compositeEditorOptions) {
      this.applyInputUsabilityState();
    }

    // when field is disabled, we can assume it's valid
    if (this.disabled) {
      return { valid: true, msg: '' };
    }

    const elmValue = inputValue !== undefined ? inputValue : this._inputElm?.value;
    return sliderValidator(elmValue, {
      editorArgs: this.args,
      errorMessage: this.columnEditor.errorMessage,
      minValue: this.columnEditor.minValue,
      maxValue: this.columnEditor.maxValue,
      required: this.args?.compositeEditorOptions ? false : this.columnEditor.required,
      validator: this.validator,
    });
  }

  //
  // protected functions
  // ------------------

  /**
   * Create the HTML template as a string
   */
  protected buildDomElement(): HTMLDivElement {
    const columnId = this.columnDef?.id ?? '';
    const title = this.columnEditor.title ?? '';
    const minValue = +(this.columnEditor.minValue ?? Constants.SLIDER_DEFAULT_MIN_VALUE);
    const maxValue = +(this.columnEditor.maxValue ?? Constants.SLIDER_DEFAULT_MAX_VALUE);
    const step = +(this.columnEditor.valueStep ?? Constants.SLIDER_DEFAULT_STEP);
    const defaultValue = this.editorOptions.sliderStartValue ?? minValue;
    this._defaultValue = +defaultValue;

    this._sliderTrackElm = createDomElement('div', { className: 'slider-track' });
    this._inputElm = createDomElement('input', {
      type: 'range',
      title,
      defaultValue: `${defaultValue}`,
      value: `${defaultValue}`,
      min: `${minValue}`,
      max: `${maxValue}`,
      step: `${this.columnEditor.valueStep ?? Constants.SLIDER_DEFAULT_STEP}`,
      ariaLabel: this.columnEditor.ariaLabel ?? `${toSentenceCase(columnId + '')} Slider Editor`,
      className: `slider-editor-input editor-${columnId}`,
    });

    const divContainerElm = createDomElement('div', { className: 'slider-container slider-editor' });
    const sliderInputContainerElm = createDomElement('div', { className: 'slider-input-container slider-editor' });
    sliderInputContainerElm.appendChild(this._sliderTrackElm);
    sliderInputContainerElm.appendChild(this._inputElm);
    divContainerElm.appendChild(sliderInputContainerElm);

    this.renderSliderNumber(divContainerElm, defaultValue);

    // merge options with optional user's custom options
    this._sliderOptions = { minValue, maxValue, step };

    return divContainerElm;
  }

  protected renderSliderNumber(divContainerElm: HTMLDivElement, defaultValue: number | string): void {
    if (!this.editorOptions.hideSliderNumber) {
      divContainerElm.classList.add('input-group');

      const divGroupAddonElm = createDomElement('div', { className: 'input-group-addon input-group-append slider-value' });
      this._sliderNumberElm = createDomElement('span', { className: `input-group-text`, textContent: `${defaultValue}` });
      divGroupAddonElm.appendChild(this._sliderNumberElm);
      divContainerElm.appendChild(divGroupAddonElm);
    } else {
      divContainerElm.querySelector('.slider-value')?.remove();
    }
  }

  /** when it's a Composite Editor, we'll check if the Editor is editable (by checking onBeforeEditCell) and if not Editable we'll disable the Editor */
  protected applyInputUsabilityState(): void {
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
    this.disable(isCellEditable === false);
  }

  protected handleChangeEvent(event: MouseEvent): void {
    this._isValueTouched = true;
    const compositeEditorOptions = this.args.compositeEditorOptions;

    if (compositeEditorOptions) {
      this.handleChangeOnCompositeEditor(event, compositeEditorOptions);
    } else {
      this.save();
    }
  }

  protected handleChangeSliderNumber(event: Event): void {
    const value = (<HTMLInputElement>event.target)?.value ?? '';
    if (value !== '') {
      if (!this.editorOptions.hideSliderNumber && this._sliderNumberElm) {
        this._sliderNumberElm.textContent = value;
      }
      this._inputElm.title = value;

      // trigger mouse enter event on the editor for optionally hooked SlickCustomTooltip
      if (!this.args?.compositeEditorOptions) {
        this.grid.onMouseEnter.notify({ column: this.columnDef, grid: this.grid }, new SlickEventData(event));
      }
    }
    this.updateTrackFilledColorWhenEnabled();
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
    const newValue = this.serializeValue();

    // when valid, we'll also apply the new value to the dataContext item object
    if (this.validate().valid) {
      this.applyValue(this.dataContext, newValue);
    }
    this.applyValue(compositeEditorOptions.formValues, newValue);

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

  protected sliderTrackClicked(e: MouseEvent): void {
    e.preventDefault();
    const sliderTrackX = e.offsetX;
    const sliderTrackWidth = this._sliderTrackElm.offsetWidth;
    const trackPercentPosition = ((sliderTrackX + 0) * 100) / sliderTrackWidth;

    if (this._inputElm) {
      // automatically move to calculated clicked percentage
      // dispatch a change event to update its value & number when shown
      this._inputElm.value = `${trackPercentPosition}`;
      this._inputElm.dispatchEvent(new Event('change'));
    }
  }

  protected updateTrackFilledColorWhenEnabled(): void {
    if (this.editorOptions.enableSliderTrackColoring && this._inputElm) {
      const percent1 = 0;
      const percent2 = ((+this.getValue() - +this._inputElm.min) / (this.sliderOptions?.maxValue ?? 0 - +this._inputElm.min)) * 100;
      const bg = 'linear-gradient(to right, %b %p1, %c %p1, %c %p2, %b %p2)'
        .replace(/%b/g, '#eee')
        .replace(/%c/g, (this.editorOptions?.sliderTrackFilledColor ?? 'var(--slick-slider-filter-thumb-color, #86bff8)') as string)
        .replace(/%p1/g, `${percent1}%`)
        .replace(/%p2/g, `${percent2}%`);

      this._sliderTrackElm.style.background = bg;
      this._sliderOptions.sliderTrackBackground = bg;
    }
  }
}
