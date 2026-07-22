// ============================================================
// Izenda Integration Configuration
// Mirrors the pattern from MVCCore_DM1_StarterKit's izenda.integrate.js
// ============================================================

const IZENDA_CONFIG = {
  WebApiUrl: 'http://host:71/api/',
  BaseUrl: '/izenda',
  RootPath: '/izenda',
  CssFile: 'izenda-ui.css',
  Routes: {
    Settings: 'settings',
    New: 'new',
    Dashboard: 'dashboard',
    Report: 'report',
    ReportViewer: 'reportviewer',
    ReportViewerPopup: 'reportviewerpopup',
    Viewer: 'viewer'
  },
  Timeout: 3600,
  OnReceiveUnauthorizedResponse: () => {
    localStorage.removeItem('izenda_user');
    window.location.href = '/login';
  }
};

// --------------------------------------------------------------------------
// Token Configuration
// Set TOKEN_ENDPOINT to your backend's token generation URL.
// When using a .NET host: '/user/GenerateToken'
// When no backend is available: set to null (Izenda shows its own login page)
// --------------------------------------------------------------------------
const TOKEN_ENDPOINT = '/user/GenerateToken';

let configured = false;

export function doIzendaConfig() {
  if (configured) return;
  window.IzendaSynergy.config(IZENDA_CONFIG);
  configured = true;
}

export async function doRender(renderCallback) {
  if (TOKEN_ENDPOINT) {
    const response = await fetch(TOKEN_ENDPOINT);
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }
    if (!response.ok) {
      throw new Error('Token generation failed. Check that your backend is running.');
    }
    const data = await response.json();
    window.IzendaSynergy.setCurrentUserContext({ token: data.token });
  }
  renderCallback();
}
