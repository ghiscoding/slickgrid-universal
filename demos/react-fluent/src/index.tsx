// import 'bootstrap';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './examples/slickgrid/App.js';
import './styles.scss';

const root = createRoot(document.getElementById('main')!);
root.render(
  <FluentProvider theme={teamsLightTheme}>
    <HashRouter>
      <App />
    </HashRouter>
  </FluentProvider>
);
