// ============================================================
// Deployment packaging script
//
// Usage (args are passed after `--`):
//   npm run packageVite -- --server=HOST --database=DB --user=U --password=P --apiurl=http://host:71/api/
//   npm run packageIIS  -- --server=HOST --database=DB --user=U --password=P --apiurl=http://host:71/api/
//
// Optional flags:
//   --keep-source       (alias --no-restore)     Do not restore src/izenda/config.js
//                       after the build; leave the edited WebApiUrl in the source.
//   --skip-copy-izenda  (alias --no-copy-izenda)  Skip the `npm run copy-izenda` step.
//
// Steps performed:
//   1. npm run copy-izenda        (copy Izenda React assets into public/izenda)
//   2. Replace WebApiUrl in src/izenda/config.js  (must happen BEFORE build,
//      because config.js is bundled into dist)
//   3. npm run build
//   4. Create the output folder (Vite/ or IIS/)
//   5. Copy dist + the target-specific files into the output folder
//   6. Replace DB connection settings (server/database/user/password) in the
//      copied server file and vite-plugin-izenda-token.js, and (IIS only) the
//      API URL inside the copied web.config
//   7. Restore the original src/izenda/config.js
// ============================================================

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------- arg parsing ----------
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    let token = argv[i];
    if (!token.startsWith('--')) continue;
    token = token.slice(2);
    let key, value;
    const eq = token.indexOf('=');
    if (eq !== -1) {
      key = token.slice(0, eq);
      value = token.slice(eq + 1);
    } else {
      key = token;
      // support `--key value`
      if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
        value = argv[++i];
      } else {
        value = true;
      }
    }
    args[key.toLowerCase()] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const target = String(args.target || '').toLowerCase();

if (target !== 'vite' && target !== 'iis') {
  console.error('[ERROR] Missing or invalid --target. Expected "vite" or "iis".');
  console.error('        Run via `npm run packageVite` or `npm run packageIIS`.');
  process.exit(1);
}

const required = ['server', 'database', 'user', 'password', 'apiurl'];
const missing = required.filter((k) => !args[k] || args[k] === true);
if (missing.length) {
  console.error(`[ERROR] Missing required parameter(s): ${missing.join(', ')}`);
  console.error('        Example:');
  console.error(`        npm run package${target === 'vite' ? 'Vite' : 'IIS'} -- \\`);
  console.error('          --server=<hostname> --database=<database> --user=<user> \\');
  console.error('          --password=<password> --apiurl=http://host:71/api/');
  process.exit(1);
}

const { server, database, user, password, apiurl } = args;

// When set, the edited src/izenda/config.js is NOT restored after build
// (accepts --keep-source or --no-restore).
const keepSource = args['keep-source'] === true || args['keep-source'] === 'true'
  || args['no-restore'] === true || args['no-restore'] === 'true';

// When set, the `npm run copy-izenda` step is skipped
// (accepts --skip-copy-izenda or --no-copy-izenda).
const skipCopyIzenda = args['skip-copy-izenda'] === true || args['skip-copy-izenda'] === 'true'
  || args['no-copy-izenda'] === true || args['no-copy-izenda'] === 'true';

// ---------- helpers ----------
// Replace a single-quoted JS object property value: e.g.  server: 'old'  ->  server: 'NEW'
function replaceJsField(content, field, value) {
  const re = new RegExp(`(${field}\\s*:\\s*')[^']*(')`);
  if (!re.test(content)) {
    console.warn(`[WARN] Could not find field "${field}" to replace.`);
    return content;
  }
  return content.replace(re, `$1${value}$2`);
}

function replaceDbConfig(content) {
  content = replaceJsField(content, 'server', server);
  content = replaceJsField(content, 'database', database);
  content = replaceJsField(content, 'user', user);
  content = replaceJsField(content, 'password', password);
  return content;
}

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: __dirname });
}

function copyFile(src, destDir) {
  const dest = path.join(destDir, path.basename(src));
  fs.copyFileSync(src, dest);
  console.log(`  copied ${path.basename(src)}`);
  return dest;
}

// ---------- paths ----------
const outDirName = target === 'vite' ? 'Vite' : 'IIS';
const outDir = path.join(__dirname, 'deploy', outDirName);
const configPath = path.join(__dirname, 'src', 'izenda', 'config.js');

let originalConfig = null;

try {
  // 1. Copy Izenda assets
  console.log('\n=== Step 1: Copy Izenda assets ===');
  if (skipCopyIzenda) {
    console.log('  --skip-copy-izenda set: skipping `npm run copy-izenda`.');
  } else {
    run('npm run copy-izenda');
  }

  // 2. Replace WebApiUrl in config.js (before build, since it is bundled)
  console.log('\n=== Step 2: Set WebApiUrl in src/izenda/config.js ===');
  originalConfig = fs.readFileSync(configPath, 'utf8');
  const newConfig = replaceJsField(originalConfig, 'WebApiUrl', apiurl);
  fs.writeFileSync(configPath, newConfig);
  console.log(`  WebApiUrl -> ${apiurl}`);

  // 3. Build
  console.log('\n=== Step 3: Build ===');
  run('npm run build');

  // 4. Create output folder (fresh)
  console.log(`\n=== Step 4: Create output folder "deploy/${outDirName}" ===`);
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  // 5. Copy dist + target-specific files
  console.log('\n=== Step 5: Copy artifacts ===');
  fs.cpSync(path.join(__dirname, 'dist'), path.join(outDir, 'dist'), { recursive: true });
  console.log('  copied dist/');

  // package.json (so `npm install` can restore dependencies in the deploy folder)
  copyFile(path.join(__dirname, 'package.json'), outDir);

  let copiedServer;
  let copiedPlugin = null;
  if (target === 'vite') {
    copiedServer = copyFile(path.join(__dirname, 'server.js'), outDir);
    copyFile(path.join(__dirname, 'vite.config.js'), outDir);
    // vite-plugin-izenda-token.js is only used by the Vite dev/preview server.
    copiedPlugin = copyFile(path.join(__dirname, 'vite-plugin-izenda-token.js'), outDir);
  } else {
    copiedServer = copyFile(path.join(__dirname, 'server.cjs'), outDir);
    copyFile(path.join(__dirname, 'web.config'), outDir);
  }

  // 6. Patch DB config in copied files + API URL in web.config (IIS)
  console.log('\n=== Step 6: Apply parameters ===');
  fs.writeFileSync(copiedServer, replaceDbConfig(fs.readFileSync(copiedServer, 'utf8')));
  console.log(`  DB config -> ${path.basename(copiedServer)}`);
  if (copiedPlugin) {
    fs.writeFileSync(copiedPlugin, replaceDbConfig(fs.readFileSync(copiedPlugin, 'utf8')));
    console.log('  DB config -> vite-plugin-izenda-token.js');
  }

  if (target === 'iis') {
    const webConfigPath = path.join(outDir, 'web.config');
    let web = fs.readFileSync(webConfigPath, 'utf8');
    const apiBase = apiurl.endsWith('/') ? apiurl : apiurl + '/';
    const apiOrigin = new URL(apiurl).origin;

    // /api rewrite proxy: url="http://.../api/{R:1}"
    web = web.replace(/(url=")[^"]*(\{R:1\}")/, `$1${apiBase}$2`);
    // CSP connect-src 'self' <origin>;
    web = web.replace(/(connect-src 'self' )[^;]*(;)/, `$1${apiOrigin}$2`);

    fs.writeFileSync(webConfigPath, web);
    console.log(`  API proxy -> ${apiBase}{R:1}`);
    console.log(`  CSP connect-src -> ${apiOrigin}`);
  }

  console.log(`\n=== Done. Package created in "deploy/${outDirName}/" ===`);
} finally {
  // 7. Restore original config.js (unless --keep-source / --no-restore was passed)
  if (originalConfig !== null) {
    if (keepSource) {
      console.log('\n--keep-source set: leaving edited src/izenda/config.js in place.');
    } else {
      fs.writeFileSync(configPath, originalConfig);
      console.log('\nRestored original src/izenda/config.js');
    }
  }
}
