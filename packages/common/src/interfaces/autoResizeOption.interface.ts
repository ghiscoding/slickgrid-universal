import { ResizerOption } from './resizerOption.interface';

export interface AutoResizeOption extends ResizerOption {
  /** defaults to 10ms, delay before triggering the auto-resize (only on 1st page load) */
  delay?: number;
}
