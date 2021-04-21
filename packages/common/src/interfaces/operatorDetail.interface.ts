import { OperatorString, OperatorType } from '../enums/index';

/** Operator with its Description */
export interface OperatorDetail {
  operator: OperatorString | OperatorType;
  description: string;
}