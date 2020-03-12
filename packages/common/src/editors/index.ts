import { LongTextEditor } from './longTextEditor';
import { SliderEditor } from './sliderEditor';
import { TextEditor } from './textEditor';

export const Editors = {
  /** Long Text Editor (uses a textarea) */
  longText: LongTextEditor,

  /** Slider Editor */
  slider: SliderEditor,

  /** Text Editor */
  text: TextEditor
};
