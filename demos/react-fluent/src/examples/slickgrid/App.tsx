import { Hamburger, makeStyles, NavDrawer, NavDrawerBody, NavItem } from '@fluentui/react-components';
import { Settings20Color } from '@fluentui/react-icons';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes as BaseRoutes, Navigate, Route, useLocation, useNavigate } from 'react-router';
import { NavBar } from '../../NavBar.js';

const useStyles = makeStyles({
  root: {
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  container: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  nav: {
    minWidth: '260px',
  },
  content: {
    flex: '1',
    padding: '8px 16px',
    overflow: 'auto',
  },
});

const routes = [
  { path: 'example01', route: '/example01', element: lazy(() => import('./Example01.js')), title: '1- Basic Grid / 2 Grids' },
  { path: 'example02', route: '/example02', element: lazy(() => import('./Example02.js')), title: '2- Row Move Plugin' },
  { path: 'example03', route: '/example03', element: lazy(() => import('./Example03.js')), title: '3- Draggable Grouping' },
  { path: 'example04', route: '/example04', element: lazy(() => import('./Example04.js')), title: '4- Row Detail View' },
  { path: 'example05', route: '/example05', element: lazy(() => import('./Example05.js')), title: '5- Pinned Columns/Rows' },
  { path: 'example06', route: '/example06', element: lazy(() => import('./Example06.js')), title: '6- Tree Data (Parent/Child)' },
  { path: 'example07', route: '/example07', element: lazy(() => import('./Example07.js')), title: '7- Real-Time Trading Platform' },
  { path: 'example08', route: '/example08', element: lazy(() => import('./Example08.js')), title: '8- Excel Export Formulas' },
  { path: 'example09', route: '/example09', element: lazy(() => import('./Example09.js')), title: '9- Tree Data with Lazy Loading' },
  {
    path: 'fluent-icons',
    route: '/fluent-icons',
    element: lazy(() => import('./fluent-icons.js')),
    title: 'Fluent Icons',
    icon: 'fui fui-settings',
  },
];

export default function Routes() {
  const styles = useStyles();
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  // Find the current route's value
  const currentValue = routes.find((r) => r.route === pathname)?.path || '';

  useEffect(() => {
    const activeItem = document.querySelector('[aria-current="page"]');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest' });
    }
  }, [pathname]);

  const handleNavItemClick = (route: any) => {
    navigate(route);
    // Optionally close drawer on mobile/overlay mode
    // setIsOpen(false);
  };

  return (
    <div className={styles.root}>
      <NavBar />
      <div className={styles.container}>
        <NavDrawer open={isOpen} type="inline" defaultSelectedValue={currentValue} className={styles.nav}>
          <NavDrawerBody>
            <NavItem href="https://ghiscoding.gitbook.io/slickgrid-react/" target="_blank" value="docs">
              📘 Documentation
            </NavItem>

            {routes.map((row) => (
              <NavItem
                key={row.path}
                value={row.path}
                onClick={() => handleNavItemClick(row.route)}
                aria-current={pathname === row.route ? 'page' : undefined}
              >
                {row.icon ? <Settings20Color /> : ''}
                {row.title}
              </NavItem>
            ))}
          </NavDrawerBody>
        </NavDrawer>

        <section className={styles.content}>
          <div id="demo-container">
            <Hamburger onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen} />
            <Suspense fallback={<div>Loading...</div>}>
              <BaseRoutes>
                {routes.map((row) => (
                  <Route path={row.route} key={row.route}>
                    <Route index element={<row.element />} />
                  </Route>
                ))}
                <Route path="*" element={<Navigate to="/example01" replace />} />
              </BaseRoutes>
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  );
}
