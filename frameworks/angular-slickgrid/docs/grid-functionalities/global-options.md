You might find yourself re-using the same configurations over and over, in that case we got you covered. You can change any of the global options directly in your App Module through `forRoot` which accept an optional object of Grid Options.

### 1. for `Angular-Slickgrid` <= 9.0 - Include it in your App Module (or App Config for Standalone)
```typescript
import { AngularSlickgridModule } from 'angular-slickgrid';

@NgModule({
  declarations: [ /*...*/ ],
  imports: [
    AngularSlickgridModule.forRoot({
      enableAutoResize: true,
      autoResize: {
        containerId: 'grid-container',
        sidePadding: 15
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enablePagination: true,
      enableSelection: true,
      enableTranslate: true,
      sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
      //...
    }),
  ],
  providers: [ /*...*/ ]
});

export class AppModule { }
```

### 2. for `Angular-Slickgrid` >= 10.x - Standalone Component

```typescript
import { AngularSlickgridComponent, GridOption } from 'angular-slickgrid';

// optional Grid Option
const gridOptionConfig: GridOption = {
  enableAutoResize: true,
  autoResize: {
    container: '#demo-container',
    rightPadding: 10,
  },
  sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
};

bootstrapApplication(AppComponent, {
  providers: [
    AngularSlickgridComponent,
    { provide: 'defaultGridOption', useValue: gridOptionConfig },
    // ....
  ],
}).catch((err) => console.log(err));
```

### List of Global Options
For the complete list of available Grid Option, you can take a look at the [Default Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/app/angular-slickgrid/global-grid-options.ts) file and/or technically any of the options from the [grid options - interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/library/models/gridOption.interface.ts) are configurable.