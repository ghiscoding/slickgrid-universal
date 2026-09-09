#### Index
- [Introduction](#introduction)
- [Sticky Columns](#sticky-columns)
- [Sticky Rows](#sticky-rows)
- [Docking Budgets and Overflow](#docking-budgets-and-overflow)
- [Permanent Pins and Header Menus](#permanent-pins-and-header-menus)

### Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/example47) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example47.ts)

### Introduction
Sticky docking keeps configured columns or rows attached to the nearest grid edge only while normal scrolling would clip them. Unlike [`Column.pinned`](pinning.md), sticky items return to their natural position when they are visible again.

Sticky behavior is configured independently from permanent pinning. It uses the same single-viewport docking renderer and can be combined with left- or right-pinned columns and pinned rows.

### Sticky Columns
Set Column `sticky` property to `true`, `'left'`, `'right'`, `'both'`, or `false`:

```ts
const columns: Column[] = [
  { id: 'account', field: 'account', name: 'Account', sticky: 'left' },
  { id: 'quarter', field: 'quarter', name: 'Q1', sticky: 'both' },
  { id: 'amount', field: 'amount', name: 'Amount' },
];
```

`true` uses the leading edge (`left` in LTR and `right` in RTL). Use explicit `'left'` or
`'right'` values when the physical edge matters. `'both'` allows the resolver to choose the
nearest edge.

Sticky columns can also be changed at runtime through the SlickGrid instance:

```ts
grid.setColumnStickiness('quarter', 'both');
grid.setColumnStickiness('quarter', false);
```

### Sticky Rows
Configure rows with `stickyRows`. Each list accepts row indexes or values from
`datasetIdPropertyName`:

```ts
const gridOptions: GridOption = {
  stickyRows: {
    top: [0, 1],
    bottom: ['summary-row'],
    both: ['total-row'],
  },
};
```

`top` and `bottom` use the corresponding edge. Rows in `both` dock to whichever edge is nearest
when they would be clipped. Sticky rows remain part of the normal dataset and reuse their regular
row rendering when they move into the docking overlay.

### Docking Budgets and Overflow
The optional `docking` option controls how much of the viewport can be occupied by permanent and
sticky docking:

```ts
const gridOptions: GridOption = {
  docking: {
    maxColumnViewportWidthPercent: 60,
    maxRowViewportHeightPercent: 60,
    overflowStrategy: 'conveyor', // 'conveyor' | 'clamp' | 'priority'
    stickyHysteresis: 2,
  },
};
```

The default budgets prevent sticky content from consuming the entire viewport. `conveyor` moves
through candidates as space becomes available, `clamp` keeps the active set within the budget, and
`priority` favors the highest-priority candidates.

### Permanent Pins and Header Menus
Permanent pins take precedence over sticky candidates. Sticky columns do not have built-in Header
Menu commands, so there is no `Column.stickable` option. Use the column definition or
`setColumnStickiness()` when the application controls sticky behavior.

`Column.pinnable` only controls whether the Header Menu exposes pinning commands; it does not
control sticky behavior. See [Pinning of Columns/Rows](pinning.md) for permanent column and row
pinning.
