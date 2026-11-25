import type { Formatter } from 'slickgrid-svelte';

/** Render the example's toggle with the same checked and unchecked colors as the other demos. */
export const completedToggleFormatter: Formatter = (_row, _cell, value) =>
  `<span style="margin-left: 5px"><button class="btn btn-xs btn-default btn-icon"><i class="mdi ${value ? 'mdi-check-circle' : 'mdi-circle'}" style="color: ${value ? 'black' : 'lavender'}" aria-hidden="true"></i></button></span>`;
