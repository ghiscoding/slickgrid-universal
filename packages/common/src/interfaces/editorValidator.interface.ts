import type { EditorArguments, EditorValidationResult } from './index';

export type EditorValidator = (value: any, args?: EditorArguments) => EditorValidationResult;
