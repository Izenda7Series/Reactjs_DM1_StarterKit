import { useEffect, useRef, useState } from "react";
import { doIzendaConfig, doRender } from "./config";

// Hook that handles the Izenda lifecycle: config → token → render → cleanup
function useIzendaRender(renderFn) {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const IzendaSynergy = window.IzendaSynergy;

    doIzendaConfig();

    doRender(() => {
      renderFn(IzendaSynergy, container);
    }).catch((err) => {
      setError(err.message);
    });

    return () => {
      IzendaSynergy.unmountComponent(container);
    };
  }, []);

  return { containerRef, error };
}

// Full Izenda Application (with built-in routing, login, etc.)
export function IzendaFullApp() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.render(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Report List Page
export function IzendaReports() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderReportPage(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Report Designer Page
export function IzendaReportDesigner() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderReportDesignerPage(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Report Viewer (by report ID)
export function IzendaReportViewer({ reportId, filters }) {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderReportViewerPage(container, reportId, filters);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Dashboard List Page
export function IzendaDashboards() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderDashboardPage(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Dashboard Viewer (by dashboard ID)
export function IzendaDashboardViewer({ dashboardId, filters }) {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderDashboardViewerPage(container, dashboardId, filters);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// New Dashboard Designer
export function IzendaNewDashboard() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderNewDashboardPage(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Settings Page
export function IzendaSettings() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderSettingPage(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Report Part (single chart/grid by part ID)
export function IzendaReportPart({ partId }) {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderReportPart(container, { id: partId });
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}

// Report Parts Demo Page (multiple report parts rendered individually)
export function IzendaReportParts() {
  const part1Ref = useRef(null);
  const part2Ref = useRef(null);
  const part3Ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const IzendaSynergy = window.IzendaSynergy;

    doIzendaConfig();

    doRender(() => {
      // Render individual report parts by ID
      // Update these IDs with report part IDs from your environment
      IzendaSynergy.renderReportPart(part1Ref.current, {
        id: "73cb2fd9-c0fd-457f-b5d7-7304f08f91f9",
      });
      IzendaSynergy.renderReportPart(part2Ref.current, {
        id: "b3e54979-375f-4dc8-9c05-d61850facd95",
      });
      IzendaSynergy.renderReportPart(part3Ref.current, {
        id: "b3e54979-375f-4dc8-9c05-d61850facd95",
      });
    }).catch((err) => {
      setError(err.message);
    });

    return () => {
      IzendaSynergy.unmountComponent(part1Ref.current);
      IzendaSynergy.unmountComponent(part2Ref.current);
      IzendaSynergy.unmountComponent(part3Ref.current);
    };
  }, []);

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return (
    <div className="d-flex flex-wrap p-3 h-100">
      <div ref={part1Ref} className="w-50 h-50 m-3 border bg-white" />
      <div ref={part2Ref} className="w-50 h-50 m-3 border bg-white" />
      <div ref={part3Ref} className="w-50 h-50 m-3 border bg-white" />
    </div>
  );
}

// Migration Manager Page
export function IzendaMigrationManager() {
  const { containerRef, error } = useIzendaRender(
    (IzendaSynergy, container) => {
      IzendaSynergy.renderMigrationManagerPage(container);
    },
  );

  if (error)
    return (
      <div className="d-flex align-items-center justify-content-center h-100 text-danger">
        {error}
      </div>
    );
  return <div ref={containerRef} className="flex-grow-1 overflow-hidden" />;
}
