import { cpSync } from 'fs';
import { join } from 'path';

const src = '<path_to_packagereact>';
const dest = 'public/izenda';

cpSync(src, dest, { recursive: true, force: true });

console.log('Izenda files copied to', dest);
