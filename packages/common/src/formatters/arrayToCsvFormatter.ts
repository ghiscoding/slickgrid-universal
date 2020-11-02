import { Formatter } from './../interfaces/index';

export const arrayToCsvFormatter: Formatter = (_row: number, _cell: number, value: any) => {
  if (value && Array.isArray(value) && value.length > 0) {
    const values = value.join(', ');
    return `<span title="${values}">${values}</span>`;
  }
  return value;
};
