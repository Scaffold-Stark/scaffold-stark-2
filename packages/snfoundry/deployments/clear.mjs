import fs from 'fs';
import path from 'path';

const k = ["devnet", "sepolia", "mainnet"];
const args = process.argv.slice(2);

const match = k.some((x) => args[0]?.includes(x) ?? false);

// Deletes every temporary file found.
fs.readdir(".", (e, f) => {
  if (e) console.error("Error reading directory:", e);

  let mf;
  if (!match) mf = f.filter((x) => k.some((w) => x.startsWith(w)));
  else mf = f.filter((x) => x.startsWith(args[0].substring(2)));

  for (let i = 0; i < mf.length; i++) {
    const f = path.join(".", mf[i]);

    fs.unlink(f, (e) => {});
  }

  console.log("\x1b[32m", "temporary files deleted.");
});
