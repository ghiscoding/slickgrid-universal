import type { Formatter } from './../interfaces/index.js';

/**
 * Takes a complex data object and return the data under that property (for example: "user.firstName" will return the first name "John")
 * You can pass the complex structure in the "field" (field: "user.firstName") or in the "params" (labelKey: "firstName", params: { complexField: "user" }) properties.
 * For example::
 * this.columnDefs = [{ id: 'username', field: 'user.firstName', ... }]
 * OR this.columnDefs = [{ id: 'username', field: 'user', labelKey: 'firstName', params: { complexField: 'user' }, ... }]
 * OR this.columnDefs = [{ id: 'username', field: 'user', params: { complexField: 'user.firstName' }, ... }]
 */
export const complexObjectFormatter: Formatter = (_row, _cell, cellValue, columnDef, dataContext) => {
  const columnParams = columnDef.params || {};
  const complexField = columnParams.complexField ?? columnParams.complexFieldLabel ?? columnDef.field;

  if (!complexField) {
    throw new Error(`For the Formatters.complexObject to work properly, you need to tell it which property of the complex object to use.
      There are 3 ways to provide it:
      1- via the generic "params" with a "complexField" property on your Column Definition, example: this.columnDefs = [{ id: 'user', field: 'user', params: { complexField: 'user.firstName' } }]
      2- via the generic "params" with a "complexField" and a "labelKey" property on your Column Definition, example: this.columnDefs = [{ id: 'user', field: 'user', labelKey: 'firstName', params: { complexField: 'user' } }]
      3- via the field name that includes a dot notation, example: this.columnDefs = [{ id: 'user', field: 'user.firstName'}] `);
  }

  if (columnDef.labelKey && dataContext.hasOwnProperty(complexField)) {
    return dataContext[complexField]?.[columnDef.labelKey];
  }

  // when complexField includes the dot ".", we will do the split and get the value from the complex object
  // however we also need to make sure that the complex objet exist, else we'll return the cell value (original value)
  if (typeof complexField === 'string' && complexField.indexOf('.') > 0) {
    let outputValue = complexField.split('.').reduce((obj, i) => (obj?.hasOwnProperty(i) ? obj[i] : ''), dataContext);
    if (
      outputValue === undefined ||
      outputValue === null ||
      (typeof outputValue === 'object' && Object.entries(outputValue).length === 0 && !(outputValue instanceof Date))
    ) {
      outputValue = ''; // return empty string when value ends up being an empty object
    }
    return outputValue;
  }
  return cellValue;
};
