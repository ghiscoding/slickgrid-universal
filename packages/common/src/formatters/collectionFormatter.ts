import { arrayToCsvFormatter } from './arrayToCsvFormatter';
import { Formatter } from './../interfaces/index';
import { findOrDefault } from '../services/index';

/**
 * Looks up values from the columnDefinition.params.collection property and displays the label in CSV or string format
 * @example
 * // the grid will display 'foo' and 'bar' and not 1 and 2 from your dataset
 * { params: { collection: [{ value: 1, label: 'foo'}, {value: 2, label: 'bar' }] }}
 * const dataset = [1, 2];
 */
export const collectionFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  if (!value || !columnDef || !columnDef.params || !columnDef.params.collection
    || !columnDef.params.collection.length) {
    return value;
  }

  const { params, params: { collection } } = columnDef;
  const labelName = (params.customStructure) ? params.customStructure.label : 'label';
  const valueName = (params.customStructure) ? params.customStructure.value : 'value';

  if (Array.isArray(value)) {
    return arrayToCsvFormatter(row,
      cell,
      value.map((v: any) => findOrDefault(collection, (c: any) => c[valueName] === v)[labelName]),
      columnDef,
      dataContext,
      grid);
  }

  return findOrDefault(collection, (c: any) => c[valueName] === value)[labelName] || '';
};
