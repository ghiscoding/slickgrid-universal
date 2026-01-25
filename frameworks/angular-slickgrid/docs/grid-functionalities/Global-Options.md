You might find yourself re-using the same configurations over and over, in that case we got you covered. You can change any of the global options directly in your App Module through `forRoot` which accept an optional object of Grid Options.

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
      //...
    }),
  ],
  providers: [ /*...*/ ]
});

export class AppModule { }
```
### List of Global Options
For the complete list of available Grid Option, you can take a look at the [Default Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/app/angular-slickgrid/global-grid-options.ts) file and/or technically any of the options from the [grid options - interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/app/angular-slickgrid/models/gridOption.interface.ts) are configurable.