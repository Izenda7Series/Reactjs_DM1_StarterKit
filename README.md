# Izenda Embedded Vite Starter (ReactStarterKit)

## Overview
The ReactStarterKit illustrates the concepts of integrating Izenda into ReactStarterKit applications.

### Q. What is in this repository?

### A. This is a simple example using a project template with Izenda Embedded into it. This repository is only an example of integrating Izenda into another application. The project template used in this scenario is used as a substitute for your application. This repository shows examples of how you might embed Izenda into your application.

 :warning: **The ReactStarterKit is designed for demonstration purposes and should not be used as an “as-is” fully-integrated solution. You can use the kit for reference or a baseline but ensure that security and customization meet the standards of your company.**


## Configuration

### WebApiUrl (`src/izenda/config.js`)

Set `WebApiUrl` in `src/izenda/config.js` to point to your Izenda API backend:

```js
const IZENDA_CONFIG = {
  WebApiUrl: 'http://host:71/api/',
  // ...
};
```

Change this value to match the URL where your Izenda API is hosted.

> **Database Schema:** The required database scripts are available at https://github.com/Izenda7Series/MVCCore_DM1_StarterKit/tree/master/DBScript

---

### Database Configuration (`vite-plugin-izenda-token.js`, `server.js`, `server.cjs`)

The auth layer connects to SQL Server using a `DB_CONFIG` object. The same block
appears in three files — update **all** of them to match your environment:

- `vite-plugin-izenda-token.js` — used by the Vite dev/preview server
- `server.js` — standalone Node.js auth server (Vite deployment)
- `server.cjs` — standalone Node.js auth server (IIS deployment)

```js
const DB_CONFIG = {
  server: '<hostname>',
  database: '<database>',
  user: '<user>',
  password: '<password>',
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};
```

| Setting                  | Value                   |
|--------------------------|-------------------------|
| Server                   | `<hostname>`        |
| Database                 | `<database>`         |
| User                     | `<user>`               |
| Password                 | `<password>`          |
| Encrypt                  | `false`                |
| Trust Server Certificate | `true`                 |

Update these values to match your environment's SQL Server instance.

---

### Copy Izenda React Assets (`npm run copy-izenda`)

Download [ReactEmbeddedUI.zip](https://app.izenda.com/) from https://app.izenda.com/

Copies the Izenda embedded reactjs UI package (built from `IzendaCoreAppUI`) into the `public/izenda` folder so Vite can serve it at dev time:

```bash
npm run copy-izenda
```

This runs:

```
node copy-izenda.js
```

Update the ReactEmbeddedUI package path in `copy-izenda.js` if your local Izenda UI repo is in a different location.

---

### Packaging for Deployment (`npm run packageVite` / `npm run packageIIS`)

Build a self-contained deployment package. Arguments are passed after `--`.
`--server`, `--database`, `--user`, `--password`, and `--apiurl` are required.

```bash
npm run packageVite -- --server=HOST --database=DB --user=U --password=P --apiurl=http://host:71/api/ --keep-source

npm run packageVite -- --server=HOST --database=DB --user=U --password=P --apiurl=http://host:71/api/ --skip-copy-izenda

npm run packageIIS -- --server=HOST --database=DB --user=U --password=P --apiurl=http://host:71/api/ --skip-copy-izenda
```

| Flag                 | Description                                                                 |
|----------------------|-----------------------------------------------------------------------------|
| `--server`           | SQL Server host (required)                                                   |
| `--database`         | Database name (required)                                                     |
| `--user`             | SQL Server user (required)                                                   |
| `--password`         | SQL Server password (required)                                              |
| `--apiurl`           | Izenda API URL, e.g. `http://host:71/api/` (required)                       |
| `--keep-source`      | Leave the edited `WebApiUrl` in `src/izenda/config.js` (don't restore it)   |
| `--skip-copy-izenda` | Skip the `npm run copy-izenda` step (reuse the assets already in `public/izenda`) |

- `packageVite` outputs to `deploy/Vite/` (Node.js app run via Vite preview).
- `packageIIS` outputs to `deploy/IIS/` (Node.js app run under IIS; also patches `web.config`'s API proxy and CSP `connect-src`).
