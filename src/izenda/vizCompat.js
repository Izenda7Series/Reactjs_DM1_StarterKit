// Loader for the izenda_visualizations.js bundle (built from the
// IzendaCustomVisualizations project's src/visualization.js).
//
// The bundle patches 3D support directly onto the live Highcharts core used
// by izenda_ui.js (via IzendaSynergy.getClass('HighchartVizEngine').VisualizationLibrary)
// as a side effect of module execution, and registers its own chart-type
// engines through IzendaSynergy.registerVisualizationEngine. No snapshot/
// restore of the Highcharts core is needed here — that was only required by
// an older, incompatible build that patched Highcharts prototypes directly
// and broke other chart types when left in place.
//
// The bundle's GoogleMap engine registration is skipped so DM1's native
// GoogleMap engine is not overwritten by the legacy one (which carries an
// unresolved GOOGLE_API_KEY placeholder anyway).

// Temporarily filter registerVisualizationEngine so the bundle cannot
// overwrite DM1's native GoogleMap engine. Returns a restore function (no-op
// if the IzendaSynergy export object is not patchable).
function guardGoogleMapEngine(Iz) {
  try {
    const descriptor = Object.getOwnPropertyDescriptor(Iz, 'registerVisualizationEngine');
    const original = Iz.registerVisualizationEngine;
    if (typeof original !== 'function' || !descriptor || !descriptor.configurable) return () => {};
    Object.defineProperty(Iz, 'registerVisualizationEngine', {
      configurable: true,
      enumerable: descriptor.enumerable,
      writable: true,
      value(name, engine) {
        if (name === 'GoogleMap') return undefined;
        return original.call(this, name, engine);
      },
    });
    return () => Object.defineProperty(Iz, 'registerVisualizationEngine', descriptor);
  } catch {
    return () => {};
  }
}

export async function loadCustomVisualizations({ loadScript, loadStylesheet }) {
  const Iz = window.IzendaSynergy;
  if (!Iz?.getClass?.('HighchartVizEngine')) {
    throw new Error('IzendaSynergy Highcharts core not found; cannot load custom visualizations.');
  }

  const unguard = guardGoogleMapEngine(Iz);
  try {
    await loadScript('/izenda/izenda_visualizations.js');
  } finally {
    unguard();
  }
  loadStylesheet('/izenda/izenda_visualizations.css');
}
