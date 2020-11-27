import { Formatter } from './../interfaces/index';

/**
 * Takes a complex data object and return the data under that property (for example: "user.firstName" will return the first name "John")
 * You can pass the complex structure in the "field" or the "params: { complexField: string }" properties.
 * For example::
 * this.columnDefs = [{ id: 'username', field: 'user.firstName', ... }]
 * OR this.columnDefs = [{ id: 'username', field: 'user', params: { complexField: 'user.firstName' }, ... }]
 */
export const complexObjectFormatter: Formatter = (_row, _cell, cellValue, columnDef, dataContext) => {
  if (!columnDef) {
    return '';
  }

  const columnParams = columnDef.params || {};
  const complexFieldLabel = columnParams && columnParams.complexFieldLabel || columnDef.field;

  if (!complexFieldLabel) {
    throw new Error(`For the Formatters.complexObject to work properly, you need to tell it which property of the complex object to use.
      There are 3 ways to provide it:
      1- via the generic "params" with a "complexFieldLabel" property on your Column Definition, example: this.columnDefs = [{ id: 'user', field: 'user', params: { complexFieldLabel: 'user.firstName' } }]
      2- via the generic "params" with a "complexFieldLabel" and a "labelKey" property on your Column Definition, example: this.columnDefs = [{ id: 'user', field: 'user', labelKey: 'firstName' params: { complexFieldLabel: 'user' } }]
      3- via the field name that includes a dot notation, example: this.columnDefs = [{ id: 'user', field: 'user.firstName'}] `);
  }

  if (columnDef.labelKey && dataContext.hasOwnProperty(complexFieldLabel)) {
    return dataContext[complexFieldLabel] && dataContext[complexFieldLabel][columnDef.labelKey];
  }

  // when complexFieldLabel includes the dot ".", we will do the split and get the value from the complex object
  // however we also need to make sure that the complex objet exist, else we'll return the cell value (original value)
  if (typeof complexFieldLabel === 'string' && complexFieldLabel.indexOf('.') > 0) {
    return complexFieldLabel.split('.').reduce((obj, i) => (obj && obj.hasOwnProperty(i) ? obj[i] : cellValue), dataContext);
  }
  return cellValue;
};
