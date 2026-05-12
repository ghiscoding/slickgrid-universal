## Multiple Column Header Rows

### Description

Angular-Slickgrid by default will use 2 rows to display each Column Headers, in some cases you might want to change that.

### Using SASS variable

If you use SASS, you can simply change the $slick-header-row-count variable and you're good to go. However, please note that this affects all your grids. If that is not what you want then keep reading.

Example:

```scss
$slick-header-row-count: 2;
@import '../node_modules/angular-slickgrid/styles/sass/slickgrid-theme-bootstrap.scss';
```

### Change x rows for only 1 grid

In the case that you want to change the number of rows used to display each Column Headers, you will have to use a little bit more SASS code and the gridId of your grid.

For example, let say your grid as the gridId of mygrid, with the following code

```html
<angular-slickgrid
    gridId="mygrid"
    [columnDefinitions]="columnDefinitions"
    [gridOptions]="gridOptions"
    [dataset]="dataset">
</angular-slickgrid>
```

You have to copy the id mygrid into the SASS code shown below (replace mygrid to your need). You also need to adjust the height in pixels, for 3 rows 55px seems to be a good number to use. You can also move the sort indicators as shown below.

```scss
#slickGridContainer-mygrid {
    .slickgrid-container .slick-header-columns {
        .slick-header-column {
            height: 55px;

            .slick-sort-indicator, .slick-sort-indicator-numbered {
                top: 40px;
            }
        }
    }
}
```

Also note that if you use a stylesheet attached to your component (or inline), you might need to change the encapsulation to use the ViewEncapsulation.None, like this:

```ts
@Component({
  selector: 'demo',
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./demo.component.scss'],
  templateUrl: './demo.component.html'
})
```