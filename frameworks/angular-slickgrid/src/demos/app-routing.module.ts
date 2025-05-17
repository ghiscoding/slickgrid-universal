import { NgModule } from '@angular/core';
import { type Routes, RouterModule, provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { HomeComponent } from './examples/home.component';
import { Example1Component } from './examples/example01.component';
import { Example2Component } from './examples/example02.component';
import { Example3Component } from './examples/example03.component';
import { Example4Component } from './examples/example04.component';
import { Example5Component } from './examples/example05.component';
import { Example6Component } from './examples/example06.component';
import { Example7Component } from './examples/example07.component';
import { Example8Component } from './examples/example08.component';
import { Example9Component } from './examples/example09.component';
import { Example10Component } from './examples/example10.component';
import { Example11Component } from './examples/example11.component';
import { Example12Component } from './examples/example12.component';
import { Example13Component } from './examples/example13.component';
import { Example14Component } from './examples/example14.component';
import { Example15Component } from './examples/example15.component';
import { Example16Component } from './examples/example16.component';
import { Example17Component } from './examples/example17.component';
import { Example18Component } from './examples/example18.component';
import { Example19Component } from './examples/example19.component';
import { Example20Component } from './examples/example20.component';
import { Example21Component } from './examples/example21.component';
import { Example22Component } from './examples/example22.component';
import { Example23Component } from './examples/example23.component';
import { Example24Component } from './examples/example24.component';
import { Example25Component } from './examples/example25.component';
import { Example26Component } from './examples/example26.component';
import { Example27Component } from './examples/example27.component';
import { Example28Component } from './examples/example28.component';
import { Example29Component } from './examples/example29.component';
import { Example30Component } from './examples/example30.component';
import { Example32Component } from './examples/example32.component';
import { Example33Component } from './examples/example33.component';
import { Example34Component } from './examples/example34.component';
import { Example35Component } from './examples/example35.component';
import { Example36Component } from './examples/example36.component';
import { Example37Component } from './examples/example37.component';
import { Example38Component } from './examples/example38.component';
import { Example39Component } from './examples/example39.component';
import { Example40Component } from './examples/example40.component';
import { Example41Component } from './examples/example41.component';
import { Example42Component } from './examples/example42.component';
import { Example43Component } from './examples/example43.component';
import { Example44Component } from './examples/example44.component';
import { Example45Component } from './examples/example45.component';
import { SwtCommonGridTestComponent } from './examples/swt-common-grid-test.component';

const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'example01', component: Example1Component },
  { path: 'example02', component: Example2Component },
  { path: 'example03', component: Example3Component },
  { path: 'example04', component: Example4Component },
  { path: 'example05', component: Example5Component },
  { path: 'example06', component: Example6Component },
  { path: 'example07', component: Example7Component },
  { path: 'example08', component: Example8Component },
  { path: 'example09', component: Example9Component },
  { path: 'example10', component: Example10Component },
  { path: 'example11', component: Example11Component },
  { path: 'example12', component: Example12Component },
  { path: 'example13', component: Example13Component },
  { path: 'example14', component: Example14Component },
  { path: 'example15', component: Example15Component },
  { path: 'example16', component: Example16Component },
  { path: 'example17', component: Example17Component },
  { path: 'example18', component: Example18Component },
  { path: 'example19', component: Example19Component },
  { path: 'example20', component: Example20Component },
  { path: 'example21', component: Example21Component },
  { path: 'example22', component: Example22Component },
  { path: 'example23', component: Example23Component },
  { path: 'example24', component: Example24Component },
  { path: 'example25', component: Example25Component },
  { path: 'example26', component: Example26Component },
  { path: 'example27', component: Example27Component },
  { path: 'example28', component: Example28Component },
  { path: 'example29', component: Example29Component },
  { path: 'example30', component: Example30Component },
  { path: 'example31', component: SwtCommonGridTestComponent },
  { path: 'example32', component: Example32Component },
  { path: 'example33', component: Example33Component },
  { path: 'example34', component: Example34Component },
  { path: 'example35', component: Example35Component },
  { path: 'example36', component: Example36Component },
  { path: 'example37', component: Example37Component },
  { path: 'example38', component: Example38Component },
  { path: 'example39', component: Example39Component },
  { path: 'example40', component: Example40Component },
  { path: 'example41', component: Example41Component },
  { path: 'example42', component: Example42Component },
  { path: 'example43', component: Example43Component },
  { path: 'example44', component: Example44Component },
  { path: 'example45', component: Example45Component },
  { path: '', redirectTo: '/example34', pathMatch: 'full' },
  { path: '**', redirectTo: '/example34', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true }), TranslateModule],
  exports: [RouterModule, TranslateModule],
  providers: [provideRouter(routes)],
})
export class AppRoutingRoutingModule {}
