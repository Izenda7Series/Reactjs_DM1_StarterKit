import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createHistory } from 'history';

// Singleton browser history instance
export const history = createHistory();

// Router context
const RouterContext = createContext(null);

export function useRouter() {
  return useContext(RouterContext);
}

export function useParams() {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.params : {};
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  return ctx ? ctx.location : {};
}

// Router component
export function Router({ children }) {
  const [location, setLocation] = useState(history.getCurrentLocation());

  useEffect(() => {
    const unlisten = history.listen((loc) => {
      setLocation(loc);
    });
    return unlisten;
  }, []);

  const push = useCallback((path) => history.push(path), []);
  const replace = useCallback((path) => history.replace(path), []);

  return (
    <RouterContext.Provider value={{ location, push, replace, params: {} }}>
      {children}
    </RouterContext.Provider>
  );
}

// Route matching utility
function matchPath(pattern, pathname) {
  // Handle wildcard catch-all
  if (pattern === '*') return { matched: true, params: {} };
  if (pattern.endsWith('/**')) {
    const base = pattern.slice(0, -3);
    if (pathname === base || pathname.startsWith(base + '/')) {
      return { matched: true, params: {} };
    }
    return { matched: false, params: {} };
  }

  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return { matched: false, params: {} };

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return { matched: false, params: {} };
    }
  }
  return { matched: true, params };
}

// Switch renders only the first matching Route
export function Switch({ children }) {
  const { location } = useRouter();
  const routes = React.Children.toArray(children);

  for (const route of routes) {
    if (!route.props.path) continue;
    const { matched, params } = matchPath(route.props.path, location.pathname);
    if (matched) {
      return (
        <RouterContext.Provider value={{ location, push: history.push, replace: history.replace, params }}>
          {route.props.component
            ? React.createElement(route.props.component, { params, location })
            : route.props.render
              ? route.props.render({ params, location })
              : null}
        </RouterContext.Provider>
      );
    }
  }
  return null;
}

// Route (used inside Switch, rendering is handled by Switch)
export function Route() {
  return null;
}

// Link component
export function Link({ to, className, activeClassName, children, onClick }) {
  const { location } = useRouter();
  const isActive = location.pathname === to;
  const cls = [className, isActive && activeClassName].filter(Boolean).join(' ');

  function handleClick(e) {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    if (e.button !== 0) return;
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    history.push(to);
  }

  return (
    <a href={to} className={cls} onClick={handleClick}>
      {children}
    </a>
  );
}

// Redirect component
export function Redirect({ to }) {
  const { replace } = useRouter();
  useEffect(() => {
    replace(to);
  }, [to, replace]);
  return null;
}
