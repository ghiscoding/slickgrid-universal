import { lazy, Suspense, useEffect } from 'react';
import { Routes as BaseRoutes, Link, Navigate, Route, useLocation } from 'react-router';
import { NavBar } from '../../NavBar.js';

const routes = [
  { path: 'example01', route: '/example01', element: lazy(() => import('./Example01.js')), title: '1- Basic Grid / 2 Grids' },
  { path: 'example02', route: '/example02', element: lazy(() => import('./Example02.js')), title: '2- Formatters' },
  { path: 'example03', route: '/example03', element: lazy(() => import('./Example03.js')), title: '3- Editors / Delete' },
  { path: 'example04', route: '/example04', element: lazy(() => import('./Example04.js')), title: '4- Client Side Sort/Filter' },
  { path: 'example05', route: '/example05', element: lazy(() => import('./Example05.js')), title: '5- Backend OData Service' },
  { path: 'example06', route: '/example06', element: lazy(() => import('./Example06.js')), title: '6- Backend GraphQL Service' },
  { path: 'example07', route: '/example07', element: lazy(() => import('./Example07.js')), title: '7- Header Button Plugin' },
  { path: 'example08', route: '/example08', element: lazy(() => import('./Example08.js')), title: '8- Header Menu Plugin' },
  { path: 'example09', route: '/example09', element: lazy(() => import('./Example09.js')), title: '9- Grid Menu Control' },
  { path: 'example10', route: '/example10', element: lazy(() => import('./Example10.js')), title: '10- Row Selection / 2 Grids' },
  { path: 'example11', route: '/example11', element: lazy(() => import('./Example11.js')), title: '11- Add/Update Grid Item' },
  { path: 'example12', route: '/example12', element: lazy(() => import('./Example12.js')), title: '12- Localization (i18n)' },
  { path: 'example13', route: '/example13', element: lazy(() => import('./Example13.js')), title: '13- Grouping & Aggregators' },
  { path: 'example14', route: '/example14', element: lazy(() => import('./Example14.js')), title: '14- Column Span & Header Grouping' },
  { path: 'example15', route: '/example15', element: lazy(() => import('./Example15.js')), title: '15- Grid State & Local Storage' },
  { path: 'example16', route: '/example16', element: lazy(() => import('./Example16.js')), title: '16- Row Move Plugin' },
  { path: 'example17', route: '/example17', element: lazy(() => import('./Example17.js')), title: '17- Create Grid from CSV' },
  { path: 'example18', route: '/example18', element: lazy(() => import('./Example18.js')), title: '18- Draggable Grouping' },
  { path: 'example19', route: '/example19', element: lazy(() => import('./Example19.js')), title: '19- Row Detail View' },
  { path: 'example20', route: '/example20', element: lazy(() => import('./Example20.js')), title: '20- Pinned Columns/Rows' },
  { path: 'example21', route: '/example21', element: lazy(() => import('./Example21.js')), title: '21- Grid AutoHeight (full height)' },
  { path: 'example22', route: '/example22', element: lazy(() => import('./Example22.js')), title: '22- with Bootstrap Tabs' },
  { path: 'example23', route: '/example23', element: lazy(() => import('./Example23.js')), title: '23- Filter by Range of Values' },
  { path: 'example24', route: '/example24', element: lazy(() => import('./Example24.js')), title: '24- Cell & Context Menu' },
  { path: 'example25', route: '/example25', element: lazy(() => import('./Example25.js')), title: '25- GraphQL without Pagination' },
  { path: 'example27', route: '/example27', element: lazy(() => import('./Example27.js')), title: '27- Tree Data (Parent/Child)' },
  { path: 'example28', route: '/example28', element: lazy(() => import('./Example28.js')), title: '28- Tree Data (Hierarchical set)' },
  { path: 'example29', route: '/example29', element: lazy(() => import('./Example29.js')), title: '29- Grid with header and footer slots' },
  { path: 'example30', route: '/example30', element: lazy(() => import('./Example30.js')), title: '30- Composite Editor Modal' },
  { path: 'example31', route: '/example31', element: lazy(() => import('./Example31.js')), title: '31- Backend OData with RxJS' },
  { path: 'example32', route: '/example32', element: lazy(() => import('./Example32.js')), title: '32- Columns Resize by Content' },
  { path: 'example33', route: '/example33', element: lazy(() => import('./Example33.js')), title: '33- Regular & Custom Tooltip' },
  { path: 'example34', route: '/example34', element: lazy(() => import('./Example34.js')), title: '34- Real-Time Trading Platform' },
  { path: 'example35', route: '/example35', element: lazy(() => import('./Example35.js')), title: '35- Row Based Editing' },
  { path: 'example36', route: '/example36', element: lazy(() => import('./Example36.js')), title: '36- Excel Export Formulas' },
  { path: 'example37', route: '/example37', element: lazy(() => import('./Example37.js')), title: '37- Footer Totals Row' },
  { path: 'example38', route: '/example38', element: lazy(() => import('./Example38.js')), title: '38- Infinite Scroll with OData' },
  { path: 'example39', route: '/example39', element: lazy(() => import('./Example39.js')), title: '39- Infinite Scroll with GraphQL' },
  { path: 'example40', route: '/example40', element: lazy(() => import('./Example40.js')), title: '40- Infinite Scroll from JSON data' },
  { path: 'example41', route: '/example41', element: lazy(() => import('./Example41.js')), title: '41- Drag & Drop' },
  { path: 'example42', route: '/example42', element: lazy(() => import('./Example42.js')), title: '42- Custom Pagination' },
  { path: 'example43', route: '/example43', element: lazy(() => import('./Example43.js')), title: '43- Colspan/Rowspan (timesheets)' },
  { path: 'example44', route: '/example44', element: lazy(() => import('./Example44.js')), title: '44- Colspan/Rowspan (large data)' },
  { path: 'example45', route: '/example45', element: lazy(() => import('./Example45.js')), title: '45- Row Detail with inner Grid' },
  { path: 'example46', route: '/example46', element: lazy(() => import('./Example46.js')), title: '46- Tree Data with Lazy Loading' },
  { path: 'example47', route: '/example47', element: lazy(() => import('./Example47.js')), title: '47- Row Detail + Grouping' },
  { path: 'example48', route: '/example48', element: lazy(() => import('./Example48.js')), title: '48- Hybrid Selection Model' },
  { path: 'example49', route: '/example49', element: lazy(() => import('./Example49.js')), title: '49- Spreadsheet Drag-Fill' },
  { path: 'example50', route: '/example50', element: lazy(() => import('./Example50.js')), title: '50- Master/Detail Grids' },
  { path: 'example51', route: '/example51', element: lazy(() => import('./Example51.js')), title: '51- Menus with Slots' },
];

export default function Routes() {
  const pathname = useLocation().pathname;

  useEffect(() => {
    const linkElm = document.querySelector('.nav-link.active');
    if (linkElm) {
      linkElm.scrollIntoView({ block: 'nearest' });
    }
  }, [pathname]);

  return (
    <div>
      <NavBar></NavBar>
      <div>
        <div className="panel-wm">
          <section id="panel-left" className="panel-wm-left au-animate">
            <ul className="well nav nav-pills nav-stacked">
              <li className="nav-item fw-bold nav-docs">
                <a className="nav-link" href="https://ghiscoding.gitbook.io/slickgrid-react/" target="_blank">
                  📘 Documentation
                </a>
              </li>
              {routes.map((row) => (
                <li className="nav-item" key={row.route}>
                  <Link className={`nav-link ${pathname === row.route ? 'active' : ''}`} to={row.route}>
                    {row.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section className="panel-wm-content">
            <div id="demo-container">
              <Suspense fallback={<div>Loading...</div>}>
                <BaseRoutes>
                  {routes.map((row) => (
                    <Route path={row.route} key={row.route}>
                      <Route index element={<row.element />} />
                    </Route>
                  ))}
                  <Route path="*" element={<Navigate to="/example34" replace />} />
                </BaseRoutes>
              </Suspense>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
