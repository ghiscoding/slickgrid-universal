import type { IPartialSettings } from 'vanilla-calendar-picker';

export interface VanillaCalendarOption extends Partial<IPartialSettings> {
  //-- extra options used by SlickGrid

  /** defaults to false, do we want to hide the clear date button? */
  hideClearButton?: boolean;
}
