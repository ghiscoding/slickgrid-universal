import { arrayToCsvFormatter } from './arrayToCsvFormatter';
import { Formatter } from './../interfaces/index';
import { findOrDefault } from '../services/index';

/**
 * Roughly the same as the "collectionFormatter" except that it
 * looks up values from the columnDefinition.editor.collection (instead of params) property and displays the label in CSV or string format
 * @example
 * // the grid will display 'foo' and 'bar' and not 1 and 2 from your dataset
 * { editor: { collection: [{ value: 1, label: 'foo'}, {value: 2, label: 'bar' }] }}
 * const dataset = [1, 2];
 */
export const collectionEditorFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
  if (!value || !columnDef || !columnDef.internalColumnEditor || !columnDef.internalColumnEditor.collection
    || !columnDef.internalColumnEditor.collection.length) {
    return value;
  }

  const { internalColumnEditor, internalColumnEditor: { collection } } = columnDef;
  const labelName = (internalColumnEditor.customStructure) ? internalColumnEditor.customStructure.label : 'label';
  const valueName = (internalColumnEditor.customStructure) ? internalColumnEditor.customStructure.value : 'value';

  if (Array.isArray(value)) {
    if (collection.every((x: any) => typeof x === 'string')) {
      return arrayToCsvFormatter(row,
        cell,
        value.map((v: any) => findOrDefault(collection, (c: any) => c === v)),
        columnDef,
        dataContext,
        grid);
    } else {
      return arrayToCsvFormatter(row,
        cell,
        value.map((v: any) => findOrDefault(collection, (c: any) => c[valueName] === v)[labelName]),
        columnDef,
        dataContext,
        grid);
    }
  }

  return findOrDefault(collection, (c: any) => c[valueName] === value)[labelName] || '';
};
