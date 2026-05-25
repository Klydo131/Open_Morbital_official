// SPDX-License-Identifier: AGPL-3.0-or-later
import './styles/tokens.css';
import './styles/base.css';
import './styles/sonata.css';
import './styles/responsive.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
