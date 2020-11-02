import { Formatter } from './../interfaces/index';

export const percentCompleteBarWithTextFormatter: Formatter = (_row: number, _cell: number, value: any): string => {
  const isNumber = (value === null || value === undefined || value === '') ? false : !isNaN(+value);
  if (!isNumber) {
    return '';
  }

  let color = '';
  let inputNumber = parseFloat(value);
  if (inputNumber > 100) {
    inputNumber = 100;
  }

  if (inputNumber < 30) {
    color = 'red';
  } else if (inputNumber < 70) {
    color = 'silver';
  } else {
    color = 'green';
  }

  return `<div class="percent-complete-bar-with-text" title="${inputNumber}%" style="background:${color}; width:${inputNumber}%">${inputNumber}%</div>`;
};
