import type { OperatorType } from '../enums/index.js';

/** Operator detail alternate texts */
export interface OperatorDetailAlt {
  operatorAlt?: string;
  descAlt?: string;
}

/** Operator with its Description */
export interface OperatorDetail extends OperatorDetailAlt {
  operator: OperatorType;
  desc: string;
}
