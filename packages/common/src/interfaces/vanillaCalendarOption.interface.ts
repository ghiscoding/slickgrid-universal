import type { IRange, ISelected, ISelection, IVisibility } from 'vanilla-calendar-picker';

export interface VanillaCalendarOption {
  /** sets the language localization of the calendar */
  lang: string;

  /**
   * This parameter sets the start of the week in accordance with the international standard ISO 8601.
   * If set to 'false', the week will start on Sunday; otherwise, it starts on Monday.
   */
  iso8601: boolean;

  range: Partial<IRange>;
  selection: Partial<ISelection>;
  selected: Partial<ISelected>;
  visibility: Partial<IVisibility>;

  //-- extra options used by SlickGrid

  /** defaults to false, do we want to hide the clear date button? */
  hideClearButton?: boolean;
}
