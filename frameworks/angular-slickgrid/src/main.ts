import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './demos/app.module';
import { environment } from './demos/environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule, { preserveWhitespaces: true }) // preserveWhitespaces is now default to False since Angular 6
  .catch((err) => console.log(err));
