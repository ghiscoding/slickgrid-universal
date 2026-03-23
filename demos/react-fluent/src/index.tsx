// import 'bootstrap';
import { FluentProvider, webLightTheme } from '@fluentui/react-components';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import App from './examples/slickgrid/App.js';
import './styles.scss';

const root = createRoot(document.getElementById('main')!);
root.render(
  <FluentProvider theme={webLightTheme}>
    <HashRouter>
      <App />
    </HashRouter>
  </FluentProvider>
);
