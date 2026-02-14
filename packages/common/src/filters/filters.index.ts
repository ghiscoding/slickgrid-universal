import type { FilterConstructor } from '../interfaces/filter.interface.js';
import { AutocompleterFilter } from './autocompleterFilter.js';
import { CompoundDateFilter } from './compoundDateFilter.js';
import { CompoundInputFilter } from './compoundInputFilter.js';
import { CompoundInputNumberFilter } from './compoundInputNumberFilter.js';
import { CompoundInputPasswordFilter } from './compoundInputPasswordFilter.js';
import { CompoundSliderFilter } from './compoundSliderFilter.js';
import { DateRangeFilter } from './dateRangeFilter.js';
import { InputFilter } from './inputFilter.js';
import { InputMaskFilter } from './inputMaskFilter.js';
import { InputNumberFilter } from './inputNumberFilter.js';
import { InputPasswordFilter } from './inputPasswordFilter.js';
import { MultipleSelectFilter } from './multipleSelectFilter.js';
import { SingleSelectFilter } from './singleSelectFilter.js';
import { SingleSliderFilter } from './singleSliderFilter.js';
import { SliderRangeFilter } from './sliderRangeFilter.js';

export const Filters: Record<string, FilterConstructor> = {
  /** AutoComplete Filter (using https://github.com/kraaden/autocomplete) */
  autocompleter: AutocompleterFilter,

  /** Compound Date Filter (compound of Operator + Date picker) */
  compoundDate: CompoundDateFilter,

  /** Alias to compoundInputText to Compound Input Filter (compound of Operator + Input Text) */
  compoundInput: CompoundInputFilter,

  /** Compound Input Number Filter (compound of Operator + Input of type Number) */
  compoundInputNumber: CompoundInputNumberFilter,

  /** Compound Input Password Filter (compound of Operator + Input of type Password, also note that only the text shown in the UI will be masked, filter query is still plain text) */
  compoundInputPassword: CompoundInputPasswordFilter,

  /** Compound Input Text Filter (compound of Operator + Input Text) */
  compoundInputText: CompoundInputFilter,

  /** Compound Slider Filter (compound of Operator + Slider) */
  compoundSlider: CompoundSliderFilter,

  /** Range Date Filter (uses the Flactpickr Date picker with range option) */
  dateRange: DateRangeFilter,

  /** Alias to inputText, input type text filter (this is the default filter when no type is provided) */
  input: InputFilter,

  /**
   * Input Filter of type text that will be formatted with a mask output
   * e.g.: column: { filter: { model: Filters.inputMask }, params: { mask: '(000) 000-0000' }}
   */
  inputMask: InputMaskFilter,

  /** Input Filter of type Number */
  inputNumber: InputNumberFilter,

  /** Input Filter of type Password (note that only the text shown in the UI will be masked, filter query is still plain text) */
  inputPassword: InputPasswordFilter,

  /** Default Filter, input type text filter */
  inputText: InputFilter,

  /** Multiple Select filter, which uses 3rd party lib "multiple-select-vanilla" */
  multipleSelect: MultipleSelectFilter,

  /** Single Select filter, which uses 3rd party lib "multiple-select-vanilla" */
  singleSelect: SingleSelectFilter,

  /** Slider Filter (single value) */
  slider: SingleSliderFilter,

  /** Slider Range Filter (dual values, lowest/highest filter range) */
  sliderRange: SliderRangeFilter,
};
