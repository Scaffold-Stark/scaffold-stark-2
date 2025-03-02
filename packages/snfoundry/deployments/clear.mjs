import fs from 'fs';
import path from 'path';

const sufix = '_latest.json';
const files = [`devnet${sufix}`, `sepolia${sufix}`, `mainnet${sufix}`];

for (let i = 0; i < files.length; i++) {
  const f = path.join(files[i]);

  fs.unlink(f, (err) => {});
}

console.log('\x1b[32m', 'temporary files deleted');
