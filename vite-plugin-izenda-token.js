import crypto from 'crypto';
import sql from 'mssql';

// ============================================================
// Token + Auth Plugin for Vite Dev Server
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

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(part => {
    const [key, ...rest] = part.trim().split('=');
    cookies[key] = rest.join('=');
  });
  return cookies;
}

function getSessionUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies['izenda_session'];
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default function izendaTokenPlugin() {
  return {
    name: 'izenda-auth-plugin',
    configureServer(server) {
      // POST /user/Login
      server.middlewares.use('/user/Login', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const body = await readBody(req);
        const { tenant, email, password } = JSON.parse(body);

        try {
          const user = await findUser(tenant || null, email);

          if (!user) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Invalid login attempt.' }));
            return;
          }

          const sessionId = crypto.randomUUID();
          sessions.set(sessionId, {
            UserName: user.UserName,
            TenantUniqueName: user.TenantName || null
          });

          res.setHeader('Set-Cookie', `izenda_session=${sessionId}; Path=/; HttpOnly`);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Database connection failed: ' + err.message }));
        }
      });

      // POST /user/Logout
      server.middlewares.use('/user/Logout', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const cookies = parseCookies(req.headers.cookie);
        const sessionId = cookies['izenda_session'];
        if (sessionId) {
          sessions.delete(sessionId);
        }

        res.setHeader('Set-Cookie', 'izenda_session=; Path=/; HttpOnly; Max-Age=0');
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true }));
      });

      // GET /user/GenerateToken
      server.middlewares.use('/user/GenerateToken', (req, res, next) => {
        if (req.method !== 'GET') return next();

        const userInfo = getSessionUser(req);
        if (!userInfo) {
          res.statusCode = 401;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Not authenticated' }));
          return;
        }

        const token = generateToken(userInfo);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ token }));
      });
    }
  };
}
