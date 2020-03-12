import { arrayToCsvFormatter } from './arrayToCsvFormatter';
import { Column, Formatter } from './../interfaces/index';
import { findOrDefault } from '../services/index';

/**
 * A formatter to show the label property value of a internalColumnEditor collection
 */
export const collectionEditorFormatter: Formatter = (row: number, cell: number, value: any, columnDef: Column, dataContext: any) => {
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
        dataContext);
    } else {
      return arrayToCsvFormatter(row,
        cell,
        value.map((v: any) => findOrDefault(collection, (c: any) => c[valueName] === v)[labelName]),
        columnDef,
        dataContext);
    }
  }

  return findOrDefault(collection, (c: any) => c[valueName] === value)[labelName] || '';
};
