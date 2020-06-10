import {
  HeaderButtonOption,
  HeaderButtonOnCommandArgs,
  SlickEvent,
  SlickGrid,
} from './index';

/** A plugin to add custom buttons to column headers. */
export interface SlickHeaderButtons {
  pluginName: 'HeaderButtons';

  /** Constructor of the SlickGrid 3rd party plugin, it can optionally receive options */
  constructor: (options: HeaderButtonOption) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  // --
  // Events

  /** Fired when a command is clicked */
  onCommand?: SlickEvent<HeaderButtonOnCommandArgs>;
}
