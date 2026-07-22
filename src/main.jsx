import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import jQuery from 'jquery';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Root } from './App';
import { loadCustomVisualizations } from './izenda/vizCompat';

// izenda_visualizations.js externalizes jQuery the same way the core UI bundle
// externalizes react — it expects a global rather than bundling its own copy.
window.jQuery = jQuery;
window.$ = jQuery;

// Izenda's packagereact UMD build externalizes react/react-dom/react-dom-client.
// In browser global mode, the UMD wrapper looks for window["react"], window["react-dom"]
// and window["react-dom/client"] — all must resolve to this app's own copies so the
// Izenda bundle mounts onto the same React reconciler instance as the host (otherwise
// MobX's observer() schedules re-renders against a reconciler that isn't the one
// actually holding the mounted fiber tree, and UI updates silently stop applying).
window.react = React;
window['react-dom'] = ReactDOM;
window['react-dom/client'] = { createRoot, hydrateRoot };

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.body.appendChild(script);
  });
}

function loadStylesheet(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

async function bootstrap() {
  try {
    await loadScript('/izenda/izenda_vendors.js');
    await loadScript('/izenda/izenda_locales.js');
    await loadScript('/izenda/izenda_ui.js');
    // Loads the legacy viz bundle (3D Column, 3D Scatter, Column No Space,
    // Timeline) through a compatibility shim that swaps its Highcharts-6-era
    // 3D patches for the official module matching the live core — mirrors
    // MVC DM1 StarterKit's _Layout.cshtml, which always includes
    // izenda_visualizations.js right after izenda_ui.js. A failure here must
    // never take down the whole app.
    try {
      await loadCustomVisualizations({ loadScript, loadStylesheet });
    } catch (err) {
      console.error('Custom visualizations failed to load; continuing without them.', err);
    }

    const root = createRoot(document.getElementById('root'));
    root.render(<Root />);
  } catch (err) {
    document.getElementById('root').innerHTML =
      `<div class="d-flex align-items-center justify-content-center h-100 text-danger">${err.message}</div>`;
  }
}

bootstrap();
