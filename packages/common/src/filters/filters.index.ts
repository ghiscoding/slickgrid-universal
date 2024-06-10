import { AutocompleterFilter } from './autocompleterFilter';
import { CompoundDateFilter } from './compoundDateFilter';
import { CompoundInputFilter } from './compoundInputFilter';
import { CompoundInputNumberFilter } from './compoundInputNumberFilter';
import { CompoundInputPasswordFilter } from './compoundInputPasswordFilter';
import { CompoundSliderFilter } from './compoundSliderFilter';
import { InputFilter } from './inputFilter';
import { InputMaskFilter } from './inputMaskFilter';
import { InputNumberFilter } from './inputNumberFilter';
import { InputPasswordFilter } from './inputPasswordFilter';
import { MultipleSelectFilter } from './multipleSelectFilter';
import { DateRangeFilter } from './dateRangeFilter';
import { SingleSelectFilter } from './singleSelectFilter';
import { SingleSliderFilter } from './singleSliderFilter';
import { SliderRangeFilter } from './sliderRangeFilter';
import type { FilterConstructor } from '../interfaces/filter.interface';

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

  /** Multiple Select filter, which uses 3rd party lib "multiple-select.js" */
  multipleSelect: MultipleSelectFilter,

  /** Single Select filter, which uses 3rd party lib "multiple-select.js" */
  singleSelect: SingleSelectFilter,

  /** Slider Filter (single value) */
  slider: SingleSliderFilter,

  /** Slider Range Filter (dual values, lowest/highest filter range) */
  sliderRange: SliderRangeFilter,
};
