export interface InputNumericOption {
  /** how many decimal places does the number has? */
  decimalPlaces?: number;

  /** defaults to "." and will be used to separate decimals, ie: $12.55 */
  decimalSeparator?: number;

  /** defaults to false, do we want to display parentheses around negative numbers, ie: ($10.55) */
  displayNegativeNumberWithParentheses?: boolean;

  /** how many minimum decimals to show? */
  minDecimal?: number;

  /** how many maximum decimals to show? */
  maxDecimal?: number;

  /** defaults to "," and represents the separator to use to separate thousand numbers, ie: 1,000,000.00 */
  thousandSeparator?: string;
}

export interface InputMaskOption {
  mask?: string;
}
