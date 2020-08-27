import { EditorArgs, EditorValidationResult } from './index';

export type EditorValidator = (value: any, args?: EditorArgs) => EditorValidationResult;
