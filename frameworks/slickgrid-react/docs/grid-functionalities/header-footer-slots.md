### Description
You can add Header and/or Footer to your grid by using the `#header` and `#footer` Slots, it's as simple as that. Using these slots also has the advantage of being contained in the same container making them the same width as the grid container.

### Demo

[Demo](https://ghiscoding.github.io/slickgrid-react/#/example29) / [Demo Component](https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example29.tsx)

### Basic Usage

##### Component

```tsx
<SlickgridReact gridId="grid"
    columnDefinitions={columns}
    gridOptions={options}
    dataset={dataset}
    header={<Header />}
    footer={<Footer />}
/>
```
