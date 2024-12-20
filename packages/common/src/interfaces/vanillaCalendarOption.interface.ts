import type { IRange, ISelected, ISelection, ISettings, IVisibility } from 'vanilla-calendar-pro/types';

export type IPartialSettings = Partial<
  Pick<ISettings, 'iso8601' | 'lang'> & {
    range: Partial<IRange>;
    selection: Partial<ISelection>;
    selected: Partial<ISelected>;
    visibility: Partial<IVisibility>;
  }
>;

export interface VanillaCalendarOption extends IPartialSettings {
  //-- extra options used by SlickGrid

  /** defaults to false, do we want to hide the clear date button? */
  hideClearButton?: boolean;

  /** defaults to false, should keyboard entries be allowed in input field? */
  allowInput?: boolean;
}
