import { Formatter } from './../interfaces/index';

export const checkmarkMaterialFormatter: Formatter = (_row: number, _cell: number, value: any) => {
  let isChecked = false;
  const isNumber = (value === null || value === undefined || value === '') ? false : !isNaN(+value);

  if (isNumber) {
    value = +value; // convert to number before doing next condition
  }

  if (value === true || (isNumber && +value > 0) || (typeof value === 'string' && value.length > 0 && value.toLowerCase() !== 'false' && value !== '0')) {
    isChecked = true;
  }

  return isChecked ? `<i class="mdi mdi-18px mdi-check checkmark-icon" aria-hidden="true"></i>` : '';
};
