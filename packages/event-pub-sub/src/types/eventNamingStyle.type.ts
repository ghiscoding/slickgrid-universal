export type EventNamingStyle =
  /** Event name showing in Camel Case, so "onValidationError" would stay as "onValidationError" (i.e. Angular) */
  | 'camelCase'

  /** Event name showing in Camel Case but with an extra (duplicate) "on" prefix, so "onValidationError" would become "onOnValidationError" (i.e. Slickgrid-Vue). */
  | 'camelCaseWithExtraOnPrefix'

  /** Event name showing in Kebab Case, so "onValidationError" would become "on-validation-error" (i.e. Aurelia-Slickgrid) */
  | 'kebabCase'

  /** Event name showing all in lowercase, so "onValidationError" would become "onvalidationerror" */
  | 'lowerCase'

  /** Event name showing all in lowercase but without the "on" prefix, so "onValidationError" would be "validationerror" (i.e. Salesforce). */
  | 'lowerCaseWithoutOnPrefix';
