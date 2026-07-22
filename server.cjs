// This is required for the Izenda React SPA to work with the .NET starter kit's SQL Server database.
// This will be deployed on IIS as a Node.js app (or run locally with `node server.cjs`).
const crypto = require('crypto');
const path = require('path');
const sql = require('mssql');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// ============================================================
// Token + Auth Server (Express.js)
// Connects to the same SQL Server database as the .NET starter kit.
// Validates users against AspNetUsers + Tenants tables.
// ============================================================

//Change this key and iv to your own values. They must be 16 bytes (128 bits) for AES-128-CBC.
const AES_KEY = 'THISISKEY1234567';
const AES_IV = 'ALDAOQJkdak10314';

// SQL Server connection config (matches .NET app's appsettings.json)
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

let pool = null;

async function getPool() {
  if (!pool) {
    pool = await sql.connect(DB_CONFIG);
  }
  return pool;
}

async function findUser(tenant, email) {
  const db = await getPool();
  const request = db.request();
  request.input('username', sql.NVarChar, email);

  let query;
  if (tenant) {
    request.input('tenant', sql.NVarChar, tenant);
    query = `
      SELECT u.UserName, t.Name AS TenantName
      FROM AspNetUsers u
      LEFT JOIN Tenants t ON u.TenantId = t.Id
      WHERE u.UserName = @username AND t.Name = @tenant
    `;
  } else {
    query = `
      SELECT u.UserName, t.Name AS TenantName
      FROM AspNetUsers u
      LEFT JOIN Tenants t ON u.TenantId = t.Id
      WHERE u.UserName = @username AND u.TenantId IS NULL
    `;
  }

  const result = await request.query(query);
  return result.recordset.length > 0 ? result.recordset[0] : null;
}

// Simple session store (maps sessionId → userInfo)
const sessions = new Map();

function encrypt(plainText) {
  const cipher = crypto.createCipheriv(
    'aes-128-cbc',
    Buffer.from(AES_KEY, 'ascii'),
    Buffer.from(AES_IV, 'ascii')
  );
  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function generateToken(userInfo) {
  const payload = { ...userInfo };
  if (payload.TenantUniqueName === 'System') {
    payload.TenantUniqueName = null;
  }
  return encrypt(JSON.stringify(payload));
}

function getSessionUser(req) {
  const sessionId = req.cookies['izenda_session'];
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

// ============================================================
// Express App
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve the built SPA (Vite output in ./dist).
// index:false + redirect:false so a request to a directory (e.g. /izenda/)
// does NOT auto-serve dist/izenda/index.html (Izenda's standalone shell, which
// references broken //izenda_*.js protocol-relative URLs). Real asset files
// (/izenda/izenda_ui.js, /assets/*, etc.) are still served; directory/route
// requests fall through to the React SPA fallback below.
const DIST_DIR = path.join(__dirname, 'dist');
app.use(express.static(DIST_DIR, { index: false, redirect: false }));

// POST /user/Login
app.post('/user/Login', async (req, res) => {
  const { tenant, email, password } = req.body;

  try {
    const user = await findUser(tenant || null, email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid login attempt.' });
    }

    const sessionId = crypto.randomUUID();
    sessions.set(sessionId, {
      UserName: user.UserName,
      TenantUniqueName: user.TenantName || null
    });

    res.cookie('izenda_session', sessionId, { path: '/', httpOnly: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

// POST /user/Logout
app.post('/user/Logout', (req, res) => {
  const sessionId = req.cookies['izenda_session'];
  if (sessionId) {
    sessions.delete(sessionId);
  }

  res.clearCookie('izenda_session', { path: '/', httpOnly: true });
  res.json({ success: true });
});

// GET /user/GenerateToken
app.get('/user/GenerateToken', (req, res) => {
  const userInfo = getSessionUser(req);
  if (!userInfo) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const token = generateToken(userInfo);
  res.json({ token });
});

// SPA fallback: any GET not matched above returns index.html so
// client-side routing works on refresh / deep links.
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Izenda auth server running on http://localhost:${PORT}`);
});
