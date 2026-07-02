import React from 'react';
import { createRoot } from 'react-dom/client';
import './lib/amplify';
import App from './App';
import { registerServiceWorker } from './lib/registerServiceWorker';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Make the app installable as a PWA.
registerServiceWorker();
