
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

console.log("System Diagnostics: Booting React " + React.version);

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  // تعطيل StrictMode مؤقتاً لضمان عدم تكرار طلبات الكاميرا أو الرندر الأولي
  root.render(React.createElement(App));
}
