/**
 * Generic type for wrapping event output with detail property
 * Used for typed Angular output() signals that need both eventData and args
 * Extends CustomEvent for compatibility with event handlers
 * @template T - The event function type from AngularSlickgridOutputs interface
 */
export type SlickComponentEventOutput<T extends (...args: any) => any> = CustomEvent<{
  eventData: any;
  args: Parameters<T>[0];
}>;

/**
 * Generic type for wrapping simple event output with detail property
 * Extends CustomEvent for compatibility with event handlers
 * @template T - The event function type from AngularSlickgridOutputs interface
 */
export type RegularComponentEventOutput<T extends (...args: any) => any> = CustomEvent<Parameters<T>[0]>;

/**
 * React-specific event handler type for Slick Grid events with both eventData and args
 * Simple callback handler without function type wrapping
 * @template T - The event arguments type
 * @template R - The return type (void by default, or boolean | void for events that can return a boolean)
 */
export type ReactSlickEventHandler<T, R = void> = (e: CustomEvent<{ eventData: any; args: T }>) => R;

/**
 * React-specific event handler type for simple events with just the value
 * @template T - The event value type
 * @template R - The return type (void by default, or boolean | void for events that can return a boolean)
 */
export type ReactRegularEventHandler<T, R = void> = (e: CustomEvent<T>) => R;

/**
 * Vue-specific event handler type for Slick Grid events with both eventData and args
 * Simple callback handler without function type wrapping
 * @template T - The event arguments type
 * @template R - The return type (void by default, or boolean | void for events that can return a boolean)
 */
export type VueSlickEventHandler<T, R = void> = (e: CustomEvent<{ eventData: any; args: T }>) => R;

/**
 * Vue-specific event handler type for simple events with just the value
 * @template T - The event value type
 * @template R - The return type (void by default, or boolean | void for events that can return a boolean)
 */
export type VueRegularEventHandler<T, R = void> = (e: CustomEvent<T>) => R;
