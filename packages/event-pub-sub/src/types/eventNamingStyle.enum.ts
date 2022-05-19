export enum EventNamingStyle {
  /** Event name showing in Camel Case, so "onValidationError" would stay as "onValidationError" */
  camelCase = 'camelCase',

  /** Event name showing in Kebab Case, so "onValidationError" would become "on-validation-error" */
  kebabCase = 'kebabCase',

  /** Event name showing all in lowercase, so "onValidationError" would become "onvalidationerror" */
  lowerCase = 'lowerCase',

  /** Event name showing all in lowercase but without the "on" prefix, so "onValidationError" would become "validationerror" */
  lowerCaseWithoutOnPrefix = 'lowerCaseWithoutOnPrefix',
}
