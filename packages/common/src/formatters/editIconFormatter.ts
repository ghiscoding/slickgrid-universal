import { Formatter } from './../interfaces/index';

/** Displays a Font-Awesome edit icon (fa-pencil) */
export const editIconFormatter: Formatter = () =>
  `<i class="fa fa-pencil pointer edit-icon" aria-hidden="true"></i>`;
