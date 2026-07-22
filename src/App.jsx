import React from "react";
import { Router, Route, Switch, Link, Redirect, history, useRouter, useParams } from "./router";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage from "./auth/LoginPage";
import {
  IzendaFullApp,
  IzendaReports,
  IzendaReportDesigner,
  IzendaReportViewer,
  IzendaDashboards,
  IzendaDashboardViewer,
  IzendaNewDashboard,
  IzendaSettings,
  IzendaReportPart,
  IzendaReportParts,
  IzendaMigrationManager,
} from "./izenda/components";

function ReportViewerPage() {
  const { id } = useParams();
  return <IzendaReportViewer reportId={id} />;
}

function DashboardViewerPage() {
  const { id } = useParams();
  return <IzendaDashboardViewer dashboardId={id} />;
}

function ReportPartPage() {
  const { id } = useParams();
  return <IzendaReportPart partId={id} />;
}

function RequireAuth({ children }) {
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) {
      history.push("/login");
    }
  }, [user]);

  if (!user) return null;
  return children;
}

function Protected({ component: Component, ...props }) {
  return (
    <RequireAuth>
      <Component {...props} />
    </RequireAuth>
  );
}

function DropdownMenu({ label, children }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <li className={`nav-item dropdown${open ? " show" : ""}`} ref={ref}>
      <button
        type="button"
        className="nav-link dropdown-toggle bg-transparent border-0"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label}
      </button>
      <div
        className={`dropdown-menu${open ? " show" : ""}`}
        onClick={() => setOpen(false)}
      >
        {children}
      </div>
    </li>
  );
}

function Navigation() {
  const { user, logout } = useAuth();

  async function handleLogout() {
    await fetch("/user/Logout", { method: "POST" });
    logout();
    history.push("/login");
  }

  if (!user) return null;

  return (
    <header>
      <nav className="navbar navbar-dark bg-dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">My App</span>
          <ul className="navbar-nav flex-row gap-2">
            <li className="nav-item">
              <Link to="/izenda" className="nav-link" activeClassName="active">
                Izenda
              </Link>
            </li>
            <li className="nav-item">
              <Link to="/izenda/settings" className="nav-link" activeClassName="active">
                Settings
              </Link>
            </li>
            <DropdownMenu label="Reports">
              <Link to="/izenda/reportdesigner" className="dropdown-item">
                New Report
              </Link>
              <Link to="/izenda/report" className="dropdown-item">
                Report List
              </Link>
              <Link
                to="/izenda/report/view/ef19f8f6-f43f-448a-bea8-6cc482026629"
                className="dropdown-item"
              >
                Report Viewer
              </Link>
              <Link to="/izenda/reportparts" className="dropdown-item">
                Report Parts
              </Link>
            </DropdownMenu>
            <DropdownMenu label="Dashboards">
              <Link to="/izenda/dashboard/new" className="dropdown-item">
                New Dashboard
              </Link>
              <Link to="/izenda/dashboard" className="dropdown-item">
                Dashboard List
              </Link>
              <Link
                to="/izenda/dashboard/edit/e4cfe108-0b3c-4fed-9d5b-21a74ec17c80"
                className="dropdown-item"
              >
                Dashboard Viewer
              </Link>
            </DropdownMenu>
            <li className="nav-item">
              <Link to="/izenda/migration" className="nav-link" activeClassName="active">
                Migration Manager
              </Link>
            </li>
          </ul>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="navbar-text">Hello {user.UserName}!</span>
            <button
              onClick={handleLogout}
              className="btn btn-outline-light btn-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/izenda/report/view/:id" render={() => <Protected component={ReportViewerPage} />} />
      <Route path="/izenda/dashboard/edit/:id" render={() => <Protected component={DashboardViewerPage} />} />
      <Route path="/izenda/viewer/reportpart/:id" render={() => <Protected component={ReportPartPage} />} />
      <Route path="/izenda/reportdesigner" render={() => <Protected component={IzendaReportDesigner} />} />
      <Route path="/izenda/report" render={() => <Protected component={IzendaReports} />} />
      <Route path="/izenda/reportparts" render={() => <Protected component={IzendaReportParts} />} />
      <Route path="/izenda/dashboard/new" render={() => <Protected component={IzendaNewDashboard} />} />
      <Route path="/izenda/dashboard" render={() => <Protected component={IzendaDashboards} />} />
      <Route path="/izenda/settings" render={() => <Protected component={IzendaSettings} />} />
      <Route path="/izenda/migration" render={() => <Protected component={IzendaMigrationManager} />} />
      <Route path="/izenda/**" render={() => <Protected component={IzendaFullApp} />} />
      <Route path="/izenda" render={() => <Protected component={IzendaFullApp} />} />
      <Route path="*" render={() => <Redirect to="/izenda" />} />
    </Switch>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="d-flex flex-column h-100">
      <Navigation />
      <AppRoutes />
      {user && (
        <footer className="bg-dark text-light text-center py-2 mt-auto">
          <small>
            &copy; {new Date().getFullYear()} Izenda Integrated BI Platform
          </small>
        </footer>
      )}
    </div>
  );
}

// Wrap with providers
export function Root() {
  return (
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  );
}
