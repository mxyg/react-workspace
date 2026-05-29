import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import 'antd/dist/reset.css';
import '../src/styles/theme.css';
import '../src/styles/workspace.css';
import '../src/styles/workspace-sidebar.css';
import '../src/styles/window-tabs.css';
import '../src/styles/window-manager.css';
import '../src/styles/window-container.css';
import '../src/styles/floating-window.css';
import '../src/styles/ui.css';
import './demo.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
