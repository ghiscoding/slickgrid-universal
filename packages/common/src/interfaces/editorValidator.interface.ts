import type { EditorArguments, EditorValidationResult } from './index.js';

export type EditorValidator = (value: any, args?: EditorArguments) => EditorValidationResult;
