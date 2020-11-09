import { Formatter } from './../interfaces/index';

export const fakeHyperlinkFormatter: Formatter = (_row: number, _cell: number, value: string) => {
  return value ? `<span class="fake-hyperlink">${value}</span>` : '';
};
