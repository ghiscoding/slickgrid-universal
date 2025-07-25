### Description
You can add Header and/or Footer to your grid by using the `#header` and `#footer` Slots, it's as simple as that. Using these slots also has the advantage of being contained in the same container making them the same width as the grid container.

### Demo

[Demo](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/example29) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example29.ts)

### Basic Usage

###### ViewModel

```html
<aurelia-slickgrid grid-id="grid"
                    columns.bind="columnDefinitions"
                    options.bind="gridOptions"
                    dataset.bind="dataset">
  <div au-slot="slickgrid-header" class="custom-header-slot">
    <h3>Grid Header</h3>
  </div>
  <div au-slot="slickgrid-footer" class="custom-footer-slot">
    <h3>Grid Footer</h3>
  </div>
</aurelia-slickgrid>
````
