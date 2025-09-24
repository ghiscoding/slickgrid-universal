import { type IRoute } from '@aurelia/router-direct';
// @ts-ignore
import AureliaLogo from './assets/aurelia-logo.png?url';
import './styles.scss';

export class MyApp {
  aureliaLogo = AureliaLogo;
  static routes: IRoute[] = [
    { path: '', redirectTo: 'example1' },
    { path: 'example1', component: () => import('./examples/slickgrid/example1.js'), title: '1- Basic Grid / 2 Grids' },
    { path: 'example2', component: () => import('./examples/slickgrid/example2.js'), title: '2- Formatters' },
    { path: 'example3', component: () => import('./examples/slickgrid/example3.js'), title: '3- Editors / Delete' },
    { path: 'example4', component: () => import('./examples/slickgrid/example4.js'), title: '4- Client Side Sort/Filter' },
    { path: 'example5', component: () => import('./examples/slickgrid/example5.js'), title: '5- Backend OData Service' },
    { path: 'example6', component: () => import('./examples/slickgrid/example6.js'), title: '6- Backend GraphQL Service' },
    { path: 'example7', component: () => import('./examples/slickgrid/example7.js'), title: '7- Header Button Plugin' },
    { path: 'example8', component: () => import('./examples/slickgrid/example8.js'), title: '8- Header Menu Plugin' },
    { path: 'example9', component: () => import('./examples/slickgrid/example9.js'), title: '9- Grid Menu Control' },
    { path: 'example10', component: () => import('./examples/slickgrid/example10.js'), title: '10- Row Selection / 2 Grids' },
    { path: 'example11', component: () => import('./examples/slickgrid/example11.js'), title: '11- Add/Update Grid Item' },
    { path: 'example12', component: () => import('./examples/slickgrid/example12.js'), title: '12- Localization (i18n)' },
    { path: 'example13', component: () => import('./examples/slickgrid/example13.js'), title: '13- Grouping & Aggregators' },
    { path: 'example14', component: () => import('./examples/slickgrid/example14.js'), title: '14- Column Span & Header Grouping' },
    { path: 'example15', component: () => import('./examples/slickgrid/example15.js'), title: '15- Grid State & Local Storage' },
    { path: 'example16', component: () => import('./examples/slickgrid/example16.js'), title: '16- Row Move Plugin' },
    { path: 'example17', component: () => import('./examples/slickgrid/example17.js'), title: '17- Grid from CSV' },
    { path: 'example18', component: () => import('./examples/slickgrid/example18.js'), title: '18- Draggable Grouping' },
    { path: 'example19', component: () => import('./examples/slickgrid/example19.js'), title: '19- Row Detail View' },
    { path: 'example20', component: () => import('./examples/slickgrid/example20.js'), title: '20- Pinned Columns/Rows' },
    { path: 'example21', component: () => import('./examples/slickgrid/example21.js'), title: '21- Grid AutoHeight (full height)' },
    { path: 'example22', component: () => import('./examples/slickgrid/example22.js'), title: '22- with Bootstrap Tabs' },
    { path: 'example23', component: () => import('./examples/slickgrid/example23.js'), title: '23- Filter by Range of Values' },
    { path: 'example24', component: () => import('./examples/slickgrid/example24.js'), title: '24- Cell & Context Menu' },
    { path: 'example25', component: () => import('./examples/slickgrid/example25.js'), title: '25- GraphQL without Pagination' },
    { path: 'example26', component: () => import('./examples/slickgrid/example26.js'), title: '26- Use of Aurelia Components' },
    { path: 'example27', component: () => import('./examples/slickgrid/example27.js'), title: '27- Tree Data (Parent/Child)' },
    { path: 'example28', component: () => import('./examples/slickgrid/example28.js'), title: '28- Tree Data (Hierarchical set)' },
    { path: 'example29', component: () => import('./examples/slickgrid/example29.js'), title: '29- Grid with header and footer slots' },
    { path: 'example30', component: () => import('./examples/slickgrid/example30.js'), title: '30- Composite Editor Modal' },
    { path: 'example31', component: () => import('./examples/slickgrid/example31.js'), title: '31- Backend OData with RxJS' },
    { path: 'example32', component: () => import('./examples/slickgrid/example32.js'), title: '32- Columns Resize by Content' },
    { path: 'example33', component: () => import('./examples/slickgrid/example33.js'), title: '33- Regular & Custom Tooltip' },
    { path: 'example34', component: () => import('./examples/slickgrid/example34.js'), title: '34- Real-Time Trading Platform' },
    { path: 'example35', component: () => import('./examples/slickgrid/example35.js'), title: '35- Row Based Editing' },
    { path: 'example36', component: () => import('./examples/slickgrid/example36.js'), title: '36- Excel Export Formulas' },
    { path: 'example37', component: () => import('./examples/slickgrid/example37.js'), title: '37- Footer Totals Row' },
    { path: 'example38', component: () => import('./examples/slickgrid/example38.js'), title: '38- Infinite Scroll with OData' },
    { path: 'example39', component: () => import('./examples/slickgrid/example39.js'), title: '39- Infinite Scroll with GraphQL' },
    { path: 'example40', component: () => import('./examples/slickgrid/example40.js'), title: '40- Infinite Scroll from JSON data' },
    { path: 'example41', component: () => import('./examples/slickgrid/example41.js'), title: '41- Drag & Drop' },
    { path: 'example42', component: () => import('./examples/slickgrid/example42.js'), title: '42- Custom Pagination' },
    { path: 'example43', component: () => import('./examples/slickgrid/example43.js'), title: '43- Colspan/Rowspan (timesheets)' },
    { path: 'example44', component: () => import('./examples/slickgrid/example44.js'), title: '44- Colspan/Rowspan (large data)' },
    { path: 'example45', component: () => import('./examples/slickgrid/example45.js'), title: '45- Row Detail with inner Grid' },
    { path: 'example46', component: () => import('./examples/slickgrid/example46.js'), title: '46- Tree Data with Lazy Loading' },
    { path: 'example47', component: () => import('./examples/slickgrid/example47.js'), title: '47- Row Detail + Grouping' },
    { path: 'home', component: () => import('./home-page.js'), title: 'Home' },
  ];

  routes = MyApp.routes;

  attached() {
    this.addGitHubStarsLogo();

    // scroll to active link route, there's probably a better way to do this but couldn't find lifecycle for it
    setTimeout(() => {
      const linkElm = document.querySelector('.nav-link.active');
      linkElm?.scrollIntoView({ block: 'nearest' });
    }, 45);
  }

  addGitHubStarsLogo() {
    // GitHub logo with Stars shouldn't be created while testing in Cypress (which always wait few seconds even minutes to load the logo)
    // <a href="https://github.com/ghiscoding/slickgrid-universal"><img src="https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social"></a>
    const decodedCookie = decodeURIComponent(document.cookie);
    if (decodedCookie !== 'serve-mode=cypress') {
      const ghStarLinkElm = document.createElement('a');
      ghStarLinkElm.href = 'https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/aurelia-slickgrid';

      const imgStarElm = document.createElement('img');
      imgStarElm.src = 'https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social';

      const ghButtonContainerElm = document.querySelector('.github-button-container');
      if (ghButtonContainerElm && !ghButtonContainerElm.querySelector('a')) {
        ghStarLinkElm.appendChild(imgStarElm);
        ghButtonContainerElm.appendChild(ghStarLinkElm);
      }
    }
  }
}
