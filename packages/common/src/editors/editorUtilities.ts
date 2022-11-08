// import { InferObjectPropTypeByName } from '../enums/inferObjectPropTypeByName.type';
import { ColumnEditor } from '../interfaces/index';

/**
 * Get option from editor.params PR editor.editorOptions
 * @deprecated this should be removed when slider editorParams are replaced by editorOptions
 */
export function getEditorOptionByName<T, K extends keyof T>(columnEditor: ColumnEditor, optionName: K, defaultValue?: any): T[K] | undefined {
  let outValue;

  if (columnEditor.editorOptions?.[optionName] !== undefined) {
    outValue = (columnEditor.editorOptions as T)[optionName];
  } else if (columnEditor?.params?.[optionName] !== undefined) {
    console.warn(`[Slickgrid-Universal] All editor.params are moving to "editorOptions" for better typing support and "params" will be deprecated in future release.`);
    outValue = columnEditor?.params?.[optionName];
  }
  return outValue ?? defaultValue;
}
