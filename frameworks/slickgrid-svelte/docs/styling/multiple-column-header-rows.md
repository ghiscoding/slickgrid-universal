## Multiple Column Header Rows

### Description

Column headers can wrap onto multiple lines. For a fixed header height on one grid, scope the styles to the wrapper element generated from its `gridId`. The outer element uses the ID `slickGridContainer-{gridId}`.

For example, for `<SlickgridSvelte gridId="mygrid" ... />`, add global CSS like this:

```scss
#slickGridContainer-mygrid {
  .slick-header-column {
    height: 55px;

    .slick-sort-indicator,
    .slick-sort-indicator-numbered {
      top: 40px;
    }
  }
}
```

Svelte component styles are scoped by default. Put these rules in a global stylesheet, or wrap them in `:global(...)` when declaring them in a component's `<style>` block.

For a content-driven header height, use `autoHeaderHeight` as described below.

### Automatic header height

Set `autoHeaderHeight: true` to size column headers from their rendered content. This supports multi-line text, HTML, and DOM elements used as column names. The calculated height is shared by pinned header regions and is recalculated after column resizing or autosizing.

```ts
const options: GridOption = {
  autoHeaderHeight: true,
};
```

The option is disabled by default. Use it with a theme stylesheet from Slickgrid-Universal; it provides the required header wrapping styles.
