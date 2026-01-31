
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

console.log("MPADCS Demo System: Loading Modules...");

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}
