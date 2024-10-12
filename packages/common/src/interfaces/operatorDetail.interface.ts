import type { OperatorString } from '../enums/index.js';

/** Operator detail alternate texts */
export interface OperatorDetailAlt {
  operatorAlt?: string;
  descAlt?: string;
}

/** Operator with its Description */
export interface OperatorDetail extends OperatorDetailAlt {
  operator: OperatorString;
  desc: string;
}
