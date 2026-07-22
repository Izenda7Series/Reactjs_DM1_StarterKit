# IIS Deployment Steps

## Prerequisites

1. **Node.js** installed on the server (v18+ recommended) and available in system PATH
2. **iisnode** installed — download from https://github.com/azure/iisnode/releases
3. **IIS URL Rewrite Module** installed — https://www.iis.net/downloads/microsoft/url-rewrite
4. **IIS ARR Module** installed (for the `/api/*` proxy) — https://www.iis.net/downloads/microsoft/application-request-routing
   - After install: IIS Manager → Server node → Application Request Routing → Server Proxy Settings → ✓ Enable proxy

## Step 1 — Build the React app

```powershell
cd C:\Work\tree\Izenda\Reactjs_DM1_StarterKit
npm run build
```

## Step 2 — Deploy files to IIS folder

> **Note:** `dm1-reactjs-app` is an example name. You can use any folder name of your choice.

```powershell
$dest = "C:\inetpub\wwwroot\izenda\dm1-reactjs-app"

# Create destination if it doesn't exist
New-Item -ItemType Directory -Path $dest -Force

# Copy server.js
Copy-Item "server.cjs" -Destination $dest

# Copy web.config
Copy-Item "public\web.config" -Destination $dest

# Copy package.json (needed for node_modules resolution)
Copy-Item "package.json" -Destination $dest

# Copy the built React app
Copy-Item "dist" -Destination "$dest\dist" -Recurse -Force

# Copy node_modules (express, mssql, cookie-parser, etc.)
Copy-Item "node_modules" -Destination "$dest\node_modules" -Recurse -Force
```

## Step 3 — Create IIS Site or Application

**Option A — As a new site:**

1. Open IIS Manager (`inetmgr`)
2. Right-click **Sites** → **Add Website**
3. Site name: `dm1-reactjs-app`
4. Physical path: `C:\inetpub\wwwroot\izenda\dm1-reactjs-app`
5. Port: choose a port (e.g. `8080`)
6. Click OK

**Option B — As an application under an existing site:**

1. Right-click your site → **Add Application**
2. Alias: `dm1-reactjs`
3. Physical path: `C:\inetpub\wwwroot\izenda\dm1-reactjs-app`

## Step 4 — Set App Pool to "No Managed Code"

1. In IIS Manager → **Application Pools**
2. Select the app pool used by your site
3. Click **Basic Settings**
4. Set **.NET CLR version** to **No Managed Code**
5. Click OK

## Step 5 — Set folder permissions

```powershell
icacls "C:\inetpub\wwwroot\izenda\dm1-reactjs-app" /grant "IIS_IUSRS:(OI)(CI)RX" /T
```

## Step 6 — Restart IIS and test

```powershell
iisreset
```

Browse to `http://localhost:8080` (or your configured port/hostname).

## Final Folder Structure on IIS

```
C:\inetpub\wwwroot\izenda\dm1-reactjs-app\
├── server.js              ← Node.js Express server (auth + SPA)
├── web.config             ← IIS routing rules
├── package.json
├── node_modules\          ← express, mssql, cookie-parser, crypto
└── dist\                  ← Built React app
    ├── index.html
    ├── izenda\            ← Izenda UI assets
    └── assets\            ← Vite-bundled JS/CSS
```

## How It Works

| Component | Role |
|-----------|------|
| `web.config` | Routes `/api/*` to Izenda backend via ARR proxy; all other non-file requests to `server.js` via iisnode |
| `server.js` | Express server handling `/user/Login`, `/user/Logout`, `/user/GenerateToken` (SQL Server auth + token encryption) and SPA fallback |
| `dist/` | Static React app files served by Express |
| iisnode | Manages the Node.js process lifecycle (start, restart, recycle) |

## Troubleshooting

- **500 errors**: Check `C:\inetpub\wwwroot\izenda\dm1-reactjs-app\iisnode\` for log files
- **iisnode not found**: Verify iisnode is installed (`C:\Program Files\iisnode\iisnode.dll` should exist)
- **Node not found**: Run `node --version` in cmd to verify Node.js is in system PATH
- **502 on /api/**: Verify ARR proxy is enabled at the server level in IIS Manager
- **Login fails (DB error)**: Verify the SQL Server at `<host>` is accessible from the IIS server and the `<database>` database is reachable
