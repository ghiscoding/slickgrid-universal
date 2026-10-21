import type { BuiltInContextMenuCommand, BuiltInGridMenuCommand, BuiltInHeaderMenuCommand } from './interfaces/index.js';

/**
 * Built-in command visibility defaults, shared by all frameworks.
 * Spread a menu's hideCommands to include these IDs as explicit exclusions.
 * Explicit hideCommands take precedence over showCommands.
 */
export const MenuCommandDefaults: {
  readonly gridMenu: { readonly hideCommands: readonly BuiltInGridMenuCommand[] };
  readonly contextMenu: { readonly hideCommands: readonly BuiltInContextMenuCommand[] };
  readonly headerMenu: { readonly hideCommands: readonly BuiltInHeaderMenuCommand[] };
} = {
  gridMenu: { hideCommands: ['export-text-delimited', 'toggle-dark-mode'] },
  contextMenu: { hideCommands: ['export-text-delimited'] },
  headerMenu: { hideCommands: [] },
};
