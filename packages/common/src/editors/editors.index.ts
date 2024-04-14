import { AutocompleterEditor } from './autocompleterEditor';
import { CheckboxEditor } from './checkboxEditor';
import { DateEditor } from './dateEditor';
import { DualInputEditor } from './dualInputEditor';
import { FloatEditor } from './floatEditor';
import { InputEditor } from './inputEditor';
import { InputPasswordEditor } from './inputPasswordEditor';
import { IntegerEditor } from './integerEditor';
import { LongTextEditor } from './longTextEditor';
import { MultipleSelectEditor } from './multipleSelectEditor';
import { SingleSelectEditor } from './singleSelectEditor';
import { SliderEditor } from './sliderEditor';

export const Editors = {
  /** Autocompleter Editor (using https://github.com/kraaden/autocomplete) */
  autocompleter: AutocompleterEditor,

  /** Checkbox Editor (uses native checkbox DOM element) */
  checkbox: CheckboxEditor,

  /** Date Picker Editor (which uses 3rd party lib "vanilla-calendar-pro") */
  date: DateEditor,

  /** Dual Input Editor, default input type is text but it could be (integer/float/number/password/text) */
  dualInput: DualInputEditor,

  /** Float Number Editor using an input of type "number" */
  float: FloatEditor,

  /** Integer Number Editor using an input of type "number" */
  integer: IntegerEditor,

  /**
   * Long Text Editor (uses a textarea) for longer text (you can also optionally configure its size).
   * When ready to Save you can click on the "Save" and/or use shortcuts (Ctrl+ENTER or Ctrl+s).
   */
  longText: LongTextEditor,

  /** Multiple Select editor (which uses 3rd party lib "multiple-select.js") */
  multipleSelect: MultipleSelectEditor,

  /** Editor with an input of type Password (note that only the text shown in the UI will be masked, the editor value is still plain text) */
  password: InputPasswordEditor,

  /** Single Select editor (which uses 3rd party lib "multiple-select.js") */
  singleSelect: SingleSelectEditor,

  /** Slider Editor using an input of type "range" */
  slider: SliderEditor,

  /** text Editor using an input of type "text" (this is the default editor when no type is provided) */
  text: InputEditor
};
