import { Column, Formatter } from './../interfaces/index';

export const percentCompleteBarWithTextFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any): string => {
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
