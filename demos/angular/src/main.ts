import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module.js';
import { environment } from './environments/environment.js';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule, { preserveWhitespaces: true }) // preserveWhitespaces is now default to False since Angular 6
  .catch((err) => console.log(err));
