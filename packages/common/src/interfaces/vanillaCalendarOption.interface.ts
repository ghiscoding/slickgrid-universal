import type { ISettings } from 'vanilla-calendar-picker';

export interface VanillaCalendarOption extends Partial<ISettings> {
  //-- extra options used by SlickGrid

  /** defaults to false, do we want to hide the clear date button? */
  hideClearButton?: boolean;
}
