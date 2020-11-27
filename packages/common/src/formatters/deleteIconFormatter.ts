import { Formatter } from './../interfaces/index';

/** Displays a Font-Awesome delete icon (fa-trash) */
export const deleteIconFormatter: Formatter = () =>
  `<i class="fa fa-trash pointer delete-icon" aria-hidden="true"></i>`;
