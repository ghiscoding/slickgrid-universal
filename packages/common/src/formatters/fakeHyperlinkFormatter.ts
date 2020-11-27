import { Formatter } from './../interfaces/index';

/** Takes any text value and display it as a fake a hyperlink (only styled as an hyperlink), this can be used in combo with "onCellClick" event */
export const fakeHyperlinkFormatter: Formatter = (_row, _cell, value) => {
  return value ? `<span class="fake-hyperlink">${value}</span>` : '';
};
