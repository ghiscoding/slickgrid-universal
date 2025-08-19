import { emptyElement, isDefined } from '@slickgrid-universal/utils';
import type { TrustedHTML } from 'trusted-types/lib/index.js';

import type { Sanitizer } from '../interfaces/gridOption.interface.js';

/**
 * Apply HTML code by 3 different ways depending on what is provided as input and what options are enabled.
 * 1. value is an HTMLElement or DocumentFragment, then first empty the target and simply append the HTML to the target element.
 * 2. value is string and `enableHtmlRendering` is enabled, then use `target.innerHTML = value;`
 * 3. value is string and `enableHtmlRendering` is disabled, then use `target.textContent = value;`
 * @param target - target element to apply to
 * @param val - input value can be either a string or an HTMLElement
 * @param options -
 *  - `emptyTarget`, defaults to true, will empty the target.
 *  - `enableHtmlRendering` do we want to render using `innerHTML` (ideally sanitize the data prior to assignment).
 *  - `skipEmptyReassignment`, defaults to true, when enabled it will not try to reapply an empty value when the target is already empty
 *  - `sanitizer` when using `innerHTML` what sanitizer should we use?
 */
export function applyHtmlToElement(
  target: HTMLElement,
  val: string | boolean | number | HTMLElement | DocumentFragment = '',
  options?: {
    emptyTarget?: boolean;
    enableHtmlRendering?: boolean;
    skipEmptyReassignment?: boolean;
    sanitizer?: (dirtyHtml: string) => TrustedHTML | string;
  }
): void {
  if (target) {
    if (val instanceof HTMLElement || val instanceof DocumentFragment) {
      // first empty target and then append new HTML element
      const emptyTarget = options?.emptyTarget !== false;
      if (emptyTarget) {
        emptyElement(target);
      }
      target.appendChild(val);
    } else {
      // when it's already empty and we try to reassign empty, it's probably ok to skip the assignment
      const skipEmptyReassignment = options?.skipEmptyReassignment !== false;
      if (skipEmptyReassignment && !isDefined(val) && !target.innerHTML) {
        return; // same result, just skip it
      }

      if (typeof val === 'number' || typeof val === 'boolean') {
        target.textContent = String(val);
      } else {
        const sanitizeHtmlString = <T extends string | TrustedHTML>(dirtyHtml: unknown): T => {
          if (typeof options?.sanitizer !== 'function' || !dirtyHtml || typeof dirtyHtml !== 'string') {
            return dirtyHtml as T;
          }
          return options.sanitizer(dirtyHtml) as T;
        };
        const sanitizedText = sanitizeHtmlString(val);

        // apply HTML when enableHtmlRendering is enabled
        // but make sure we do have a value (without a value, it will simply use `textContent` to clear text content)
        if (options?.enableHtmlRendering && sanitizedText) {
          target.innerHTML = sanitizedText as unknown as string;
        } else {
          target.textContent = sanitizedText as unknown as string;
        }
      }
    }
  }
}

/**
 * Sanitize possible dirty html string (remove any potential XSS code like scripts and others) when a `sanitizer` is provided via grid options.
 * The logic will only call the sanitizer if it exists and the value is a defined string, anything else will be skipped (number, boolean, TrustedHTML will all be skipped)
 * @param {*} dirtyHtml: dirty html string
 * @param {(dirtyHtml: String) => string | TrustedHTML} [sanitizer] - optional sanitizer function
 */
export function runOptionalHtmlSanitizer<T extends string | TrustedHTML>(dirtyHtml: unknown, sanitizer?: Sanitizer): T {
  if (typeof sanitizer !== 'function' || !dirtyHtml || typeof dirtyHtml !== 'string') {
    return dirtyHtml as T;
  }
  return sanitizer(dirtyHtml) as T;
}
