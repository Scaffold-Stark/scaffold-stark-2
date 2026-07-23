#!/usr/bin/env node
/**
 * stark-demo-web — records a real Sepolia + Braavos demo (load app -> connect
 * wallet -> read -> write tx -> approve in Braavos -> confirm -> read again)
 * and exports an MP4 plus a text proof block. The MP4 is the throwaway part;
 * the proof block (contract address, tx hash + Starkscan link, on-chain
 * read before/after, branch + commit) is the actual deliverable — a video
 * cannot be independently verified, a tx hash can.
 *
 * Zero deps: raw CDP over Node's built-in fetch()/WebSocket, same style as
 * stark-smoke-test-browser.mjs and stark-cdp-with-wallet (both imported, not
 * copied). This is a template repo — nothing here may be added to any
 * package.json.
 *
 *   node .claude/skills/stark-demo-video/stark-demo-web.mjs preflight --branch=<name>
 *   node .claude/skills/stark-demo-video/stark-demo-web.mjs run       --branch=<name>
 *
 * `run` refuses to start without an explicit --branch matching the checked
 * out HEAD (scaffold-stylus once recorded a demo on `main` that looked
 * completely valid because nothing in the artifact said which branch it
 * came from — this makes that impossible by construction).
 *
 * `run` will NOT submit the write transaction unless DEMO_SEND_TX=1 is set
 * in the environment. Without it, the script stops cleanly right before the
 * Send click, finalizes the partial recording, and reports a checkpoint —
 * this is the mechanism, not a promise, for "stop and ask before sending".
 *
 * The Braavos password is read from the macOS Keychain (service name
 * "scaffold-stark-braavos"), never from an env var — an env var means typing
 * the password into some terminal, where it lands in scrollback/transcript
 * history. If the Keychain entry doesn't exist, this script says so with
 * creation instructions and stops — it never falls back, never guesses.
 *
 * Finding a Keychain entry is NOT the same as the password being correct —
 * the entry can hold a stale value from before the wallet's password last
 * changed. This script never treats "entry exists" as "password confirmed
 * working"; only a real unlock attempt against the live wallet does that,
 * and its three distinct outcomes (no entry / entry rejected / unlocked) are
 * always reported separately.
 */

import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { waitFor, connectSession, openTab, closeTab, captureScreenshot } from "../stark-smoke-test/stark-smoke-test-browser.mjs";
import { CDP_PORT, PROFILE_DIR, launchPersistentChrome, killPersistentChrome, cdpReady, listTargets, findProfileHolders } from "../stark-cdp-with-wallet/launch.mjs";
import {
  KEYCHAIN_SERVICE,
  KEYCHAIN_HELP,
  readBraavosPasswordFromKeychain,
  checkWalletSetupState,
  attemptUnlock,
  waitForBraavosRequestTarget,
  approveBraavosRequest,
  findServiceWorkerTarget,
} from "../stark-cdp-with-wallet/braavos.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const LOG_DIR = path.join(ROOT, ".smoke-test-logs");
const FRAME_DIR = path.join(LOG_DIR, "demo-web-frames");
const MP4_OUT = path.join(LOG_DIR, "demo-web-sepolia.mp4");
const PROOF_OUT = path.join(LOG_DIR, "demo-web-sepolia-proof.txt");
const CONCAT_LIST = path.join(LOG_DIR, "demo-web-concat-list.txt");
export const INTRO_HTML = path.join(LOG_DIR, "demo-web-intro.html");
const NEXTJS_ENV = path.join(ROOT, "packages", "nextjs", ".env");
const SNFOUNDRY_ENV = path.join(ROOT, "packages", "snfoundry", ".env");
const DEPLOYED_CONTRACTS = path.join(ROOT, "packages", "nextjs", "contracts", "deployedContracts.ts");
const SCAFFOLD_CONFIG = path.join(ROOT, "packages", "nextjs", "scaffold.config.ts");

export const NEXT_PORT = Number(process.env.DEMO_NEXT_PORT || 3131);
// Must be "localhost", not "127.0.0.1": Braavos's manifest.json declares
// static/js/inpage.js (the script that actually exposes window.starknet_braavos
// in the page's MAIN world) under web_accessible_resources matching only
// ["http://localhost/*", "https://*/*"] — 127.0.0.1 is absent from that list
// even though it IS present in the content_scripts matches, so the isolated
// content script runs fine on 127.0.0.1 but its inpage-script injection is
// silently blocked there. Verified directly: window.starknet_braavos and the
// modal's "Braavos" button both appear on localhost, neither appears on
// 127.0.0.1, on this exact Braavos build (4.19.6).
export const APP_URL = `http://localhost:${NEXT_PORT}`;

const NEXT_READY_TIMEOUT_MS = 180_000;
const PAGE_LOAD_TIMEOUT_MS = 30_000;
const WALLET_CONNECT_TIMEOUT_MS = 20_000;
const POPUP_TARGET_TIMEOUT_MS = 8_000; // known trap: the popup target can lag ~1s+ after the CDP-triggering click
const TX_CONFIRM_TIMEOUT_MS = 120_000;
const DURATION_TOLERANCE = 0.10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

// ------------------------------------------------------------ secrets ---

/** Every *_URL/*RPC* value found in the two .env files this repo actually
 * uses for Sepolia — collected once so every console line and every DOM
 * text-content check can be scrubbed against the same list. */
function loadSecrets() {
  const secrets = new Set();
  for (const file of [NEXTJS_ENV, SNFOUNDRY_ENV]) {
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
      if (!m) continue;
      const [, key, value] = m;
      const v = value.trim();
      if (/URL|RPC/.test(key) && v.startsWith("http")) secrets.add(v);
    }
  }
  return [...secrets];
}
const SECRETS = loadSecrets();

function redact(text) {
  if (typeof text !== "string") return text;
  let out = text;
  for (const s of SECRETS) out = out.split(s).join("[REDACTED_RPC_URL]");
  return out;
}

/** "Không che được thì DỪNG" — actively check rendered page text for a leak
 * instead of assuming redact() covers everything, since a leak in a video
 * FRAME can't be redacted after the fact the way a log line can. */
async function assertNoSecretLeak(session, label) {
  if (!SECRETS.length) return;
  const text = await session.evaluate(`document.body ? document.body.innerText : ''`).catch(() => "");
  for (const s of SECRETS) {
    if (text.includes(s)) {
      throw new Error(
        `SECRET LEAK DETECTED at "${label}": a redacted RPC URL appeared in rendered page text. ` +
          `Stopping immediately per hard rule — not recording/publishing this.`
      );
    }
  }
}

// ------------------------------------------------------------ reporting ---

const results = [];
function report(stepName, status, detail) {
  results.push({ step: stepName, status, detail });
  console.log(`\n=== ${stepName}: ${status} ===`);
  if (detail !== undefined) {
    const text = typeof detail === "string" ? detail : JSON.stringify(detail, null, 2);
    console.log(redact(text));
  }
}

// ------------------------------------------------------------ git / cli ---

function gitInfo() {
  const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  const commit = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  return { branch, commit };
}

function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const flags = {};
  for (const arg of rest) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) flags[m[1]] = m[2];
  }
  return { cmd, flags };
}

/** Refuses to run without an explicit, matching --branch — the whole point
 * being that "which branch was this recorded on" can never be left implicit. */
function requireBranchDeclaration(flags) {
  const { branch, commit } = gitInfo();
  if (!flags.branch) {
    console.error(
      `Refusing to run: pass --branch=<name> explicitly (checked-out HEAD is currently "${branch}" @ ${commit.slice(0, 10)}).\n` +
        `This is mandatory so a recording can never silently run against the wrong branch.`
    );
    process.exit(1);
  }
  if (flags.branch !== branch) {
    console.error(`Refusing to run: --branch=${flags.branch} does not match the checked-out branch "${branch}".`);
    process.exit(1);
  }
  return { branch, commit };
}

// --------------------------------------------------------- screencast ---

export async function startScreencastRecording(session) {
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  for (const f of fs.readdirSync(FRAME_DIR)) fs.unlinkSync(path.join(FRAME_DIR, f));

  const frames = [];
  let frameIndex = 0;
  const recordStartMs = Date.now();

  const off = session.on("Page.screencastFrame", (params) => {
    const idx = frameIndex++;
    const file = path.join(FRAME_DIR, `frame_${String(idx).padStart(6, "0")}.jpg`);
    fs.writeFileSync(file, Buffer.from(params.data, "base64"));
    frames.push({ file, tsMs: Date.now() });
    session.send("Page.screencastFrameAck", { sessionId: params.sessionId }).catch(() => {});
  });

  await session.send("Page.enable");
  await session.send("Page.startScreencast", { format: "jpeg", quality: 80, everyNthFrame: 1 });

  return {
    async stop() {
      await session.send("Page.stopScreencast").catch(() => {});
      off();
      return { frames, recordStartMs, recordEndMs: Date.now() };
    },
  };
}

/**
 * Page.startScreencast only emits a frame when the page actually changes, not
 * on a fixed clock — ffmpeg's default fixed-fps assembly would compress idle
 * stretches and stretch busy ones, describing a run that didn't happen. Each
 * captured frame's real receipt timestamp becomes its duration in the concat
 * demuxer list instead.
 */
export async function assembleMp4(frames, recordEndMs) {
  if (frames.length < 2) throw new Error(`Only ${frames.length} frame(s) captured — nothing to assemble into a video.`);

  const esc = (p) => p.replace(/'/g, "'\\''");
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const cur = frames[i];
    const next = frames[i + 1];
    const durationMs = next ? Math.max(next.tsMs - cur.tsMs, 1) : Math.max(recordEndMs - cur.tsMs, 50);
    lines.push(`file '${esc(cur.file)}'`);
    lines.push(`duration ${(durationMs / 1000).toFixed(3)}`);
  }
  // ffmpeg concat demuxer quirk: the last file's `duration` is not honored
  // unless the same file is repeated once more without one.
  lines.push(`file '${esc(frames[frames.length - 1].file)}'`);
  fs.writeFileSync(CONCAT_LIST, lines.join("\n") + "\n");

  // libx264 requires even width/height; Page.startScreencast's actual frame
  // size doesn't always match the requested window size (observed 1440x813
  // against a 1440x900 window), so force it rather than trust the capture.
  const args = [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    CONCAT_LIST,
    "-fps_mode",
    "vfr",
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-pix_fmt",
    "yuv420p",
    MP4_OUT,
  ];
  const result = await new Promise((resolve) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => resolve({ code, output }));
  });
  if (result.code !== 0) throw new Error(`ffmpeg exited ${result.code}:\n${result.output.slice(-2000)}`);
}

export async function probeDurationSeconds(filePath) {
  const args = ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath];
  const output = await new Promise((resolve) => {
    const child = spawn("ffprobe", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", () => resolve(out.trim()));
  });
  return Number(output);
}

// --------------------------------------------------------- app driving ---

export function writeIntroHtml(branch, commit) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin:0; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center;
           background:#0b1020; color:#e7ecff; font-family:ui-monospace,Menlo,Consolas,monospace; }
    h1 { font-size:28px; margin:0 0 24px; } p { font-size:20px; margin:4px 0; }
  </style></head><body>
    <h1>SCAFFOLD-STARK SEPOLIA DEMO</h1>
    <p>branch: ${branch}</p>
    <p>commit: ${commit}</p>
    <p>recorded: ${new Date().toISOString()}</p>
  </body></html>`;
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(INTRO_HTML, html);
}

export async function navigateAndWaitLoad(session, url, timeoutMs = PAGE_LOAD_TIMEOUT_MS) {
  let loaded = false;
  const off = session.on("Page.loadEventFired", () => {
    loaded = true;
  });
  await session.send("Page.navigate", { url });
  const { ready, waitedMs } = await waitFor(() => loaded, { timeoutMs, intervalMs: 300 });
  off();
  return { ready, waitedMs };
}

/**
 * Identifies Braavos via its injected provider object — the closest
 * Starknet analog to an EIP-6963 rdns (get-starknet's legacy discovery scans
 * `window.starknet_*` for exactly this shape; `injected.id` is the stable
 * machine identifier, `injected.name` is the wallet's own self-reported
 * display name). The modal's wallet-option button is then located by
 * matching against that *dynamically read* name — never a hardcoded guess,
 * never button position/order, which is unstable once more than one wallet
 * announces itself.
 */
/**
 * Clicks an element via real CDP Input.dispatchMouseEvent, not JS `.click()`.
 * Chrome's `chrome.sidePanel.open()` (which Braavos's manifest declares and
 * needs for its connect/approve UI) only works inside a *trusted* user
 * gesture — a synthetic `element.click()` from Runtime.evaluate does not
 * carry that trust, so Braavos's connect handler can silently no-op with no
 * error and no side panel ever opening. Measured directly: clicking the
 * connector button via `.click()` closed our app's modal (its own handler
 * ran) but never produced a Braavos target at all.
 */
async function clickElementViaInput(session, rectExpr) {
  const rect = await session.evaluate(rectExpr);
  if (!rect) return false;
  await session.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: rect.x, y: rect.y });
  await session.send("Input.dispatchMouseEvent", { type: "mousePressed", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: rect.x, y: rect.y, button: "left", clickCount: 1 });
  return true;
}

const CENTER_RECT_EXPR = (el) => `
  (() => {
    const el = ${el};
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()
`;

async function connectBraavosWallet(session) {
  const opened = await clickElementViaInput(session, CENTER_RECT_EXPR(`document.querySelector('label[for="connect-modal"]')`));
  if (!opened) throw new Error(`Connect trigger (label[for="connect-modal"]) not found.`);

  const modalOpen = await waitFor(() => session.evaluate(`document.getElementById('connect-modal')?.checked === true`), {
    timeoutMs: 5000,
    intervalMs: 200,
  });
  if (!modalOpen.ready) throw new Error("Connect modal never opened.");

  let injected = await session.evaluate(`
    (() => { const w = window.starknet_braavos; if (!w) return null; return { id: w.id ?? null, name: w.name ?? null, source: "legacy_window_injection" }; })()
  `);
  if (injected && injected.id && injected.id !== "braavos") {
    throw new Error(`window.starknet_braavos.id was "${injected.id}", expected "braavos" — refusing to guess which wallet this is.`);
  }
  if (!injected) {
    // Measured fact (not a guess): this installed Braavos build (4.19.6) does
    // not expose window.starknet_braavos at all — Object.getOwnPropertyNames(window)
    // only shows MetaMaskStarknetSnapWallet via that legacy pattern. Braavos
    // here registers through the newer Wallet Standard event protocol
    // instead, which isn't a plain enumerable window property. Falling back
    // to matching the connector's own self-reported name — still identity-
    // based (order-independent among however many wallets announce), just
    // sourced from the rendered connector list rather than a window global.
    injected = { id: null, name: "Braavos", source: "name_fallback_no_window_injection" };
  }

  // Wallet Standard discovery is async (the wallet registers after the app
  // dispatches its "ready" event) — the modal can legitimately be open for a
  // beat before Braavos's option renders. Poll instead of checking once.
  const findExpr = (targetName) => `
    (() => {
      const targetName = ${JSON.stringify(targetName)};
      const btn = [...document.querySelectorAll('button')].find((b) => {
        const span = b.querySelector('span');
        const img = b.querySelector('img');
        return (span && span.textContent.trim() === targetName) || (img && img.getAttribute('alt') === targetName);
      });
      return !!btn;
    })()
  `;
  const found = await waitFor(() => session.evaluate(findExpr(injected.name)), { timeoutMs: WALLET_CONNECT_TIMEOUT_MS, intervalMs: 300 });
  if (!found.ready) {
    const visible = await session.evaluate(`
      [...document.querySelectorAll('button')].map((b) => ({
        span: b.querySelector('span')?.textContent?.trim() ?? null,
        imgAlt: b.querySelector('img')?.getAttribute('alt') ?? null,
      })).filter((b) => b.span || b.imgAlt)
    `);
    throw new Error(
      `No connector button for wallet "${injected.name}" (source: ${injected.source}) appeared within ${Math.round(found.waitedMs / 1000)}s. ` +
        `Buttons actually present in the modal: ${JSON.stringify(visible)}`
    );
  }

  const findBtnExpr = `
    [...document.querySelectorAll('button')].find((b) => {
      const span = b.querySelector('span');
      const img = b.querySelector('img');
      return (span && span.textContent.trim() === ${JSON.stringify(injected.name)}) || (img && img.getAttribute('alt') === ${JSON.stringify(injected.name)});
    })
  `;
  const clicked = await clickElementViaInput(session, CENTER_RECT_EXPR(`(${findBtnExpr})`));
  if (!clicked) throw new Error(`Connector button for "${injected.name}" appeared then vanished before click.`);
  return injected;
}

function readDisplayVariableExpr(name) {
  return `
    (() => {
      const h3 = [...document.querySelectorAll('h3')].find(h => h.textContent.trim() === ${JSON.stringify(name)});
      const container = h3 ? h3.closest('.space-y-1') : null;
      const valueEl = container ? container.querySelector('.break-all.block.transition') : null;
      return valueEl ? valueEl.textContent.trim() : null;
    })()
  `;
}

/** Watches the Network domain for the JSON-RPC write that actually submits
 * the transaction, and pulls transaction_hash out of the real RPC response —
 * this is the proof-block source of truth, not scraped UI confirmation text. */
function attachTxHashCapture(session) {
  const pendingRequestIds = new Set();
  let capturedHash = null;
  session.on("Network.requestWillBeSent", (p) => {
    const body = p.request.postData || "";
    if (body.includes("addInvokeTransaction") || body.includes("addDeployAccountTransaction")) {
      pendingRequestIds.add(p.requestId);
    }
  });
  session.on("Network.loadingFinished", async (p) => {
    if (!pendingRequestIds.has(p.requestId)) return;
    try {
      const { body, base64Encoded } = await session.send("Network.getResponseBody", { requestId: p.requestId });
      const text = base64Encoded ? Buffer.from(body, "base64").toString("utf8") : body;
      const parsed = JSON.parse(text);
      const hash = parsed?.result?.transaction_hash;
      if (hash) capturedHash = hash;
    } catch {}
  });
  return () => capturedHash;
}

// -------------------------------------------------- scaffold.config.ts ---

export function patchScaffoldConfigForSepolia() {
  const original = fs.readFileSync(SCAFFOLD_CONFIG, "utf8");
  if (!/targetNetworks:\s*\[chains\.devnet\]/.test(original)) {
    throw new Error("scaffold.config.ts targetNetworks pattern not found as expected — refusing to patch blindly.");
  }
  fs.writeFileSync(SCAFFOLD_CONFIG, original.replace(/targetNetworks:\s*\[chains\.devnet\]/, "targetNetworks: [chains.sepolia]"));
  return original;
}

export function restoreScaffoldConfig(original) {
  if (original !== null) fs.writeFileSync(SCAFFOLD_CONFIG, original);
}

export function extractSepoliaAddress() {
  let contents;
  try {
    contents = fs.readFileSync(DEPLOYED_CONTRACTS, "utf8");
  } catch (err) {
    return { error: `Could not read ${path.relative(ROOT, DEPLOYED_CONTRACTS)}: ${String(err?.message ?? err)}` };
  }
  const sepoliaBlock = contents.match(/\bsepolia:\s*{/);
  if (!sepoliaBlock) return { error: `No "sepolia" entry in ${path.relative(ROOT, DEPLOYED_CONTRACTS)} yet.` };
  const rest = contents.slice(sepoliaBlock.index + sepoliaBlock[0].length);
  const address = rest.match(/address:\s*"(0x[0-9a-fA-F]+)"/);
  if (!address) return { error: `Found a "sepolia" entry but no address inside it.` };
  return { address: address[1] };
}

// --------------------------------------------------------- dev server ---

let devServerPid = null;

export async function startDevServer() {
  const log = path.join(LOG_DIR, "demo-web-next.log");
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const fd = fs.openSync(log, "a");
  const child = spawn("yarn", ["workspace", "@ss-2/nextjs", "dev", "-p", String(NEXT_PORT)], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  child.unref();
  fs.closeSync(fd);
  devServerPid = child.pid;

  const { ready, waitedMs } = await waitFor(
    async () => {
      try {
        const res = await fetch(APP_URL);
        return res.status < 500;
      } catch {
        return false;
      }
    },
    { timeoutMs: NEXT_READY_TIMEOUT_MS, intervalMs: 2000 }
  );
  return { ready, waitedMs, log };
}

export async function killDevServer() {
  if (!devServerPid) return;
  const pid = devServerPid;
  devServerPid = null;
  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    try {
      process.kill(pid, "SIGTERM");
    } catch {}
  }
  for (let i = 0; i < 20 && isAlive(pid); i++) await sleep(250);
  if (isAlive(pid)) {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {}
    }
  }
}

// -------------------------------------------------------------- preflight ---

async function runPreflight() {
  const keychain = readBraavosPasswordFromKeychain();
  if (!keychain.found) {
    report("preflight:keychain_entry", "THẤT BẠI", KEYCHAIN_HELP);
  } else if (keychain.empty) {
    report(
      "preflight:keychain_entry",
      "THẤT BẠI",
      `Entry "${KEYCHAIN_SERVICE}" tồn tại nhưng giá trị mật khẩu RỖNG (0 ký tự) — không phải "chưa có entry". ` +
        `Xoá và tạo lại bằng:\n  security delete-generic-password -s ${KEYCHAIN_SERVICE}\n` +
        `  security add-generic-password -s ${KEYCHAIN_SERVICE} -a braavos -w '<mật khẩu Braavos thật>'`
    );
  } else {
    report(
      "preflight:keychain_entry",
      "ĐO ĐƯỢC",
      "entry tồn tại, giá trị không rỗng (giá trị không in ra) — LƯU Ý: entry tồn tại không có nghĩa mật khẩu đúng, chỉ unlock thật bên dưới mới xác nhận được."
    );
  }
  const password = keychain.found && !keychain.empty ? keychain.password : null;

  for (const [name, file] of [
    ["RPC_URL_SEPOLIA", SNFOUNDRY_ENV],
    ["NEXT_PUBLIC_SEPOLIA_PROVIDER_URL", NEXTJS_ENV],
  ]) {
    let vars = {};
    try {
      const text = fs.readFileSync(file, "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/);
        if (m) vars[m[1]] = m[2].trim();
      }
    } catch {}
    report(`preflight:${name}`, vars[name] ? "ĐO ĐƯỢC" : "THẤT BẠI", vars[name] ? "set" : `Missing/empty in ${path.relative(ROOT, file)}`);
  }

  const sepoliaAddr = extractSepoliaAddress();
  if (sepoliaAddr.error) {
    report("preflight:sepolia_deployment", "KHÔNG CHẠY", sepoliaAddr.error);
  } else {
    report("preflight:sepolia_deployment", "ĐO ĐƯỢC", `address ${sepoliaAddr.address}`);
  }

  const holders = findProfileHolders();
  if (holders.length) {
    report("preflight:profile_conflict", "THẤT BẠI", `Tiến trình Chrome khác đang giữ ${PROFILE_DIR}:\n${holders.join("\n")}`);
    return { ok: false, password, sepoliaAddr };
  }
  report("preflight:profile_conflict", "ĐO ĐƯỢC", "Không có tiến trình nào giữ profile.");

  const launch = await launchPersistentChrome();
  if (!launch.ready) {
    const holdersAfter = findProfileHolders();
    report(
      "preflight:chrome_launch",
      "THẤT BẠI",
      holdersAfter.length
        ? `Timeout sau ${launch.waitedMs}ms. Tiến trình đang giữ profile:\n${holdersAfter.join("\n")}`
        : `Timeout sau ${launch.waitedMs}ms, không tìm thấy tiến trình nào giữ profile — không phải lỗi lock.`
    );
    return { ok: false, password, sepoliaAddr };
  }
  report("preflight:chrome_launch", "ĐO ĐƯỢC", `CDP sẵn sàng sau ${launch.waitedMs}ms, pid=${launch.pid}`);

  try {
    const setup = await checkWalletSetupState();
    if (setup.vaultPresent === null) {
      report("preflight:wallet_setup", "THẤT BẠI", setup.error);
      return { ok: false, password, sepoliaAddr };
    }
    if (!setup.vaultPresent) {
      report("preflight:wallet_setup", "ĐO ĐƯỢC — CHƯA SETUP", setup.summary);
      return { ok: false, password, sepoliaAddr, walletState: "NOT_SETUP" };
    }
    report("preflight:wallet_setup", "ĐO ĐƯỢC — ĐÃ SETUP", setup.summary);

    if (!password) {
      report("preflight:unlock", "KHÔNG CHẠY", "Không có mật khẩu dùng được từ Keychain (xem preflight:keychain_entry ở trên) — không thử unlock thật.");
      return { ok: false, password, sepoliaAddr, walletState: keychain.found ? "KEYCHAIN_ENTRY_EMPTY" : "NO_KEYCHAIN_ENTRY" };
    }

    const unlock = await attemptUnlock(password);
    if (unlock.state === "UNLOCKED" || unlock.state === "NO_PASSWORD_FIELD") {
      report("preflight:unlock", "ĐO ĐƯỢC — MỞ KHOÁ", unlock);
      return { ok: true, password, sepoliaAddr, walletState: "UNLOCKED" };
    }
    if (unlock.state === "REJECTED") {
      report("preflight:unlock", "THẤT BẠI — BỊ TỪ CHỐI (mật khẩu sai)", unlock);
      return { ok: false, password, sepoliaAddr, walletState: "REJECTED" };
    }
    report("preflight:unlock", "THẤT BẠI", unlock);
    return { ok: false, password, sepoliaAddr, walletState: "UNKNOWN" };
  } finally {
    await killPersistentChrome();
  }
}

// ------------------------------------------------------------------ run ---

async function runDemo(flags) {
  const { branch, commit } = requireBranchDeclaration(flags);
  report("run:branch_declared", "ĐO ĐƯỢC", `${branch} @ ${commit}`);

  const keychain = readBraavosPasswordFromKeychain();
  if (!keychain.found) {
    report("run:keychain_entry", "THẤT BẠI", KEYCHAIN_HELP);
    process.exitCode = 1;
    return;
  }
  if (keychain.empty) {
    report(
      "run:keychain_entry",
      "THẤT BẠI",
      `Entry "${KEYCHAIN_SERVICE}" tồn tại nhưng giá trị mật khẩu RỖNG (0 ký tự) — không phải "chưa có entry". ` +
        `Xoá và tạo lại bằng:\n  security delete-generic-password -s ${KEYCHAIN_SERVICE}\n` +
        `  security add-generic-password -s ${KEYCHAIN_SERVICE} -a braavos -w '<mật khẩu Braavos thật>'`
    );
    process.exitCode = 1;
    return;
  }
  report(
    "run:keychain_entry",
    "ĐO ĐƯỢC",
    "entry tồn tại, giá trị không rỗng (giá trị không in ra) — chưa xác nhận mật khẩu đúng, chỉ unlock thật ở bước run:unlock bên dưới mới xác nhận được."
  );
  const password = keychain.password;

  const sepoliaAddr = extractSepoliaAddress();
  if (sepoliaAddr.error) {
    report("run:sepolia_deployment", "KHÔNG CHẠY", `${sepoliaAddr.error} Chờ deploy gate hoàn tất trước khi chạy demo này.`);
    process.exitCode = 2;
    return;
  }
  report("run:sepolia_deployment", "ĐO ĐƯỢC", `address ${sepoliaAddr.address}`);

  const holders = findProfileHolders();
  if (holders.length) {
    report("run:profile_conflict", "THẤT BẠI", `Tiến trình Chrome khác đang giữ ${PROFILE_DIR}:\n${holders.join("\n")}`);
    process.exitCode = 1;
    return;
  }
  report("run:profile_conflict", "ĐO ĐƯỢC", "Không có tiến trình nào giữ profile.");

  let scaffoldConfigOriginal = null;
  let recording = null;
  let getTxHash = () => null;
  let capturedTxHash = null;
  let swSession = null;

  const cleanup = async () => {
    if (recording) {
      try {
        await recording.stop();
      } catch {}
    }
    if (swSession) {
      try {
        swSession.close();
      } catch {}
      swSession = null;
    }
    await killPersistentChrome();
    await killDevServer();
    restoreScaffoldConfig(scaffoldConfigOriginal);
    const stillUp = await cdpReady(CDP_PORT);
    report("run:cleanup", stillUp ? "THẤT BẠI" : "ĐO ĐƯỢC", `CDP port ${CDP_PORT} still answering = ${stillUp}`);
  };
  process.on("SIGINT", () => cleanup().finally(() => process.exit(1)));
  process.on("SIGTERM", () => cleanup().finally(() => process.exit(1)));

  try {
    const launch = await launchPersistentChrome();
    if (!launch.ready) {
      report("run:chrome_launch", "THẤT BẠI", `Timeout sau ${launch.waitedMs}ms.`);
      process.exitCode = 1;
      return;
    }
    report("run:chrome_launch", "ĐO ĐƯỢC", `pid=${launch.pid}, sẵn sàng sau ${launch.waitedMs}ms`);

    const setup = await checkWalletSetupState();
    if (!setup.vaultPresent) {
      report("run:wallet_setup", "THẤT BẠI", setup.error ?? "Ví chưa setup — không có evidence keyring/vault trong storage.");
      process.exitCode = 1;
      return;
    }
    const unlock = await attemptUnlock(password);
    if (unlock.state !== "UNLOCKED" && unlock.state !== "NO_PASSWORD_FIELD") {
      report("run:unlock", "THẤT BẠI", unlock);
      process.exitCode = 1;
      return;
    }
    report("run:unlock", "ĐO ĐƯỢC", unlock);

    scaffoldConfigOriginal = patchScaffoldConfigForSepolia();
    report("run:scaffold_config_patch", "ĐO ĐƯỢC", "targetNetworks -> [chains.sepolia] (runtime only, not committed)");

    const dev = await startDevServer();
    if (!dev.ready) {
      report("run:dev_server", "THẤT BẠI", `${APP_URL} chưa sẵn sàng sau ${Math.round(dev.waitedMs / 1000)}s. Log: ${dev.log}`);
      process.exitCode = 1;
      return;
    }
    report("run:dev_server", "ĐO ĐƯỢC", `sẵn sàng sau ${Math.round(dev.waitedMs / 1000)}s`);

    const tab = await openTab(CDP_PORT);
    const session = await connectSession(tab.webSocketDebuggerUrl);
    await session.send("Runtime.enable");
    await session.send("Network.enable");
    getTxHash = attachTxHashCapture(session);

    recording = await startScreencastRecording(session);
    report("run:screencast_started", "ĐO ĐƯỢC", "Page.startScreencast active");

    writeIntroHtml(branch, commit);
    await navigateAndWaitLoad(session, `file://${INTRO_HTML}`);
    await sleep(2500); // hold the branch/commit scene long enough to be legible in the assembled video

    const appLoad = await navigateAndWaitLoad(session, APP_URL);
    if (!appLoad.ready) {
      report("run:load_app", "THẤT BẠI", `${APP_URL} không load được sau ${Math.round(PAGE_LOAD_TIMEOUT_MS / 1000)}s.`);
      process.exitCode = 1;
      return;
    }
    await assertNoSecretLeak(session, "after app load");
    report("run:load_app", "ĐO ĐƯỢC", `sau ${Math.round(appLoad.waitedMs / 1000)}s`);

    // Local storage on this persistent profile can already hold a connected
    // session from an earlier run (autoConnect) — no "Connect" label renders
    // in that case at all. Check before assuming the trigger must exist.
    const alreadyConnectedOnLoad = await session.evaluate(`document.querySelector('details summary')?.textContent.trim() ?? ''`);
    let connectApproved = /^0x[0-9a-fA-F]{2,}\.\.\.[0-9a-fA-F]{2,}$/.test(alreadyConnectedOnLoad);
    if (connectApproved) {
      report("run:connect_approval", "ĐO ĐƯỢC — ĐÃ KẾT NỐI SẴN", `App đã hiện địa chỉ kết nối từ trước: ${alreadyConnectedOnLoad}`);
    } else {
      const injected = await connectBraavosWallet(session);
      report("run:connect_click", "ĐO ĐƯỢC", `id="${injected.id}", name="${injected.name}", source=${injected.source}`);
    }

    for (let attempt = 0; attempt < 2 && !connectApproved; attempt++) {
      const connectRequest = await waitForBraavosRequestTarget(POPUP_TARGET_TIMEOUT_MS);
      if (!connectRequest) {
        const alreadyConnected = await session.evaluate(`document.querySelector('details summary')?.textContent.trim() ?? ''`);
        if (/^0x[0-9a-fA-F]{2,}\.\.\.[0-9a-fA-F]{2,}$/.test(alreadyConnected)) {
          report("run:connect_approval", "ĐO ĐƯỢC — TỰ ĐỘNG (không cần popup)", `App đã hiện địa chỉ kết nối: ${alreadyConnected}`);
          connectApproved = true;
        }
        break;
      }
      const approveConnect = await approveBraavosRequest(connectRequest, password, LOG_DIR, attachTxHashCapture);
      if (approveConnect.lostContext) {
        report("run:connect_approval_retry", "ĐO ĐƯỢC", approveConnect.reason + " — thử lại click Connect.");
        await connectBraavosWallet(session);
        continue;
      }
      report("run:connect_approval", "ĐO ĐƯỢC", approveConnect);
      connectApproved = true;
    }
    if (!connectApproved) {
      const allTargets = await listTargets(CDP_PORT);
      report(
        "run:connect_approval_popup",
        "THẤT BẠI",
        `Không hoàn tất được connect approval. Toàn bộ targets hiện tại: ${JSON.stringify(allTargets.map((t) => ({ type: t.type, url: t.url })))}`
      );
      process.exitCode = 1;
      return;
    }

    const connected = await waitFor(
      async () => {
        const text = await session.evaluate(`document.querySelector('details summary')?.textContent.trim() ?? ''`);
        return /^0x[0-9a-fA-F]{2,}\.\.\.[0-9a-fA-F]{2,}$/.test(text) ? text : false;
      },
      { timeoutMs: WALLET_CONNECT_TIMEOUT_MS, intervalMs: 300 }
    );
    if (!connected.ready) {
      report("run:wallet_connected", "THẤT BẠI", `Không thấy địa chỉ kết nối sau ${Math.round(connected.waitedMs / 1000)}s.`);
      process.exitCode = 1;
      return;
    }
    report("run:wallet_connected", "ĐO ĐƯỢC", connected.result);

    await navigateAndWaitLoad(session, `${APP_URL}/debug`);
    await sleep(1200);
    await session.evaluate(`[...document.querySelectorAll('a')].find(a => a.textContent.trim() === 'Read')?.click()`);
    await sleep(800);
    const greetingFound = await waitFor(() => session.evaluate(`!!([...document.querySelectorAll('h3')].find(h => h.textContent.trim() === 'greeting'))`), {
      timeoutMs: 10_000,
      intervalMs: 300,
    });
    if (!greetingFound.ready) {
      report("run:read_before", "THẤT BẠI", `"greeting" không xuất hiện trên /debug sau ${Math.round(greetingFound.waitedMs / 1000)}s.`);
      process.exitCode = 1;
      return;
    }
    const valueBefore = await session.evaluate(readDisplayVariableExpr("greeting"));
    if (!valueBefore) {
      report("run:read_before", "THẤT BẠI", "Tìm thấy label greeting nhưng giá trị rỗng.");
      process.exitCode = 1;
      return;
    }
    await assertNoSecretLeak(session, "after read");
    report("run:read_before", "ĐO ĐƯỢC", `greeting = ${JSON.stringify(valueBefore)}`);

    if (process.env.DEMO_SEND_TX !== "1") {
      report(
        "run:write_tx",
        "KHÔNG CHẠY",
        "DEMO_SEND_TX không set — dừng theo yêu cầu captain (crew demo-gif đang dùng chung tài khoản Sepolia, tránh xung đột nonce). " +
          "Đây là checkpoint có chủ đích, không phải lỗi."
      );
      report("run:read_after", "KHÔNG CHẠY", "Bỏ qua vì chưa gửi tx.");
    } else {
      const newValue = `demo-mp4-${Date.now()}`;

      await session.evaluate(`[...document.querySelectorAll('a')].find(a => a.textContent.trim() === 'Write')?.click()`);
      await sleep(800);
      const filled = await session.evaluate(`
        (() => {
          const input = document.querySelector('input[name^="set_greeting_new_greeting"]');
          if (!input) return 'NO_INPUT';
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(input, ${JSON.stringify(newValue)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
          return input.value;
        })()
      `);
      if (filled !== newValue) {
        report("run:write_tx", "THẤT BẠI", `Không điền được input set_greeting: ${filled}`);
        process.exitCode = 1;
        return;
      }
      const findSendBtnExpr = `
        (() => {
          const label = [...document.querySelectorAll('p.text-function')].find(p => p.textContent.trim() === 'set_greeting');
          const container = label ? label.closest('.flex.gap-3.flex-col') : null;
          return container ? [...container.querySelectorAll('button')].find(b => b.textContent.trim() === 'Send 💸') : null;
        })()
      `;
      const sendBtnState = await session.evaluate(`
        (() => {
          const btn = ${findSendBtnExpr};
          if (!btn) return 'NO_SEND_BUTTON';
          if (btn.disabled) return 'SEND_DISABLED';
          return 'READY';
        })()
      `);
      // Network-domain capture on the app tab never saw the invoke RPC
      // (measured: 120s timeout despite an apparently-successful approval
      // click) — Braavos likely submits it from its own extension context,
      // not through the dapp page's network stack. Hook the wallet
      // provider's own `request` method instead: its return value IS the
      // transaction_hash, captured at the JS level regardless of transport.
      // Measured (probe on this exact profile/build): window.starknet_braavos
      // EXISTS on localhost pages with request() inherited from deep in its
      // prototype chain, and the app's tx path is
      // connector.features['starknet:walletApi'].request(...) — a get-starknet
      // wrapper that delegates to w.request dynamically, so an own-property
      // shadow intercepts it. Wrap account.execute too (legacy path) and
      // verify each assignment actually took instead of assuming.
      const hookInstalled = await session.evaluate(`
        (() => {
          const w = window.starknet_braavos;
          if (!w) return { ok: false, reason: "no window.starknet_braavos" };
          if (w.__demoHooked) return { ok: true, wrapped: ["already hooked"] };
          window.__DEMO_TX = null;
          window.__DEMO_TX_ERROR = null;
          const capture = (result) => {
            if (result && typeof result === 'object' && result.transaction_hash) window.__DEMO_TX = result.transaction_hash;
            return result;
          };
          const wrapped = [];
          if (typeof w.request === 'function') {
            const orig = w.request.bind(w);
            const shadow = async (...args) => {
              try { window.__DEMO_TX_REQ = JSON.stringify(args); } catch {}
              try {
                return capture(await orig(...args));
              } catch (err) {
                window.__DEMO_TX_ERROR = String((err && err.message) || err);
                throw err;
              }
            };
            try { w.request = shadow; } catch {}
            if (w.request === shadow) wrapped.push("request");
          }
          const acct = w.account;
          if (acct && typeof acct.execute === 'function') {
            const origExec = acct.execute.bind(acct);
            const shadowExec = async (...args) => {
              try {
                return capture(await origExec(...args));
              } catch (err) {
                window.__DEMO_TX_ERROR = String((err && err.message) || err);
                throw err;
              }
            };
            try { acct.execute = shadowExec; } catch {}
            if (acct.execute === shadowExec) wrapped.push("account.execute");
          }
          w.__demoHooked = true;
          return { ok: wrapped.length > 0, wrapped };
        })()
      `);
      report("run:tx_hash_hook", hookInstalled?.ok ? "ĐO ĐƯỢC" : "THẤT BẠI", hookInstalled);

      // Fallback per captain's brief: Braavos submits the invoke RPC from its
      // OWN service worker, invisible to the dapp tab's Network domain — so
      // also attach a Network capture directly to that service worker target.
      let getSwTxHash = () => null;
      const swTarget = await findServiceWorkerTarget();
      if (swTarget) {
        swSession = await connectSession(swTarget.webSocketDebuggerUrl);
        await swSession.send("Network.enable");
        getSwTxHash = attachTxHashCapture(swSession);
        report("run:sw_tx_capture", "ĐO ĐƯỢC", `Network capture attached to Braavos service worker: ${swTarget.url}`);
      } else {
        report("run:sw_tx_capture", "THẤT BẠI", "Không tìm thấy service worker target của Braavos để attach Network capture.");
      }

      if (!hookInstalled?.ok && !swTarget) {
        report("run:write_tx", "THẤT BẠI", "Cả provider hook lẫn service-worker Network capture đều không attach được — không có nguồn nào để bắt transaction_hash.");
        process.exitCode = 1;
        return;
      }

      // The Send click triggers Braavos's chrome.sidePanel.open() for tx
      // approval — same trusted-gesture requirement as the connect click, so
      // it must go through Input.dispatchMouseEvent, not element.click().
      const clickedSend = sendBtnState === "READY" && (await clickElementViaInput(session, CENTER_RECT_EXPR(`(${findSendBtnExpr})`))) ? "clicked" : sendBtnState;
      if (clickedSend !== "clicked") {
        report("run:write_tx", "THẤT BẠI", `Không click được Send: ${clickedSend}`);
        process.exitCode = 1;
        return;
      }

      let txApproved = false;
      let approveTx = null;
      for (let attempt = 0; attempt < 2 && !txApproved; attempt++) {
        const txRequest = await waitForBraavosRequestTarget(POPUP_TARGET_TIMEOUT_MS);
        if (!txRequest) {
          report("run:tx_approval_popup", "THẤT BẠI", `Không thấy target Braavos mới trong ${POPUP_TARGET_TIMEOUT_MS}ms.`);
          process.exitCode = 1;
          return;
        }
        const txReqPayload = await session.evaluate(`window.__DEMO_TX_REQ ?? null`).catch(() => null);
        report("run:tx_request_payload", txReqPayload ? "ĐO ĐƯỢC" : "KHÔNG CHẠY", txReqPayload ?? "hook chưa thấy request nào từ dapp");
        approveTx = await approveBraavosRequest(txRequest, password, LOG_DIR, attachTxHashCapture);
        if (approveTx.lostContext) {
          report("run:tx_approval_retry", "ĐO ĐƯỢC", approveTx.reason + " — thử lại click Send.");
          const reclick = sendBtnState === "READY" && (await clickElementViaInput(session, CENTER_RECT_EXPR(`(${findSendBtnExpr})`)));
          if (!reclick) {
            report("run:write_tx", "THẤT BẠI", "Không click lại được Send sau khi mất context.");
            process.exitCode = 1;
            return;
          }
          continue;
        }
        txApproved = true;
      }
      if (!txApproved) {
        report("run:tx_approval_popup", "THẤT BẠI", "Không hoàn tất được tx approval sau khi thử lại.");
        process.exitCode = 1;
        return;
      }
      report("run:tx_approval", "ĐO ĐƯỢC", approveTx);

      const hashCaptured = await waitFor(
        async () => {
          const v = await session.evaluate(`window.__DEMO_TX`).catch(() => null);
          if (v) return { hash: v, source: "provider_hook" };
          const sw = getSwTxHash();
          if (sw) return { hash: sw, source: "service_worker_network" };
          const tabHash = getTxHash();
          if (tabHash) return { hash: tabHash, source: "dapp_tab_network" };
          const err = await session.evaluate(`window.__DEMO_TX_ERROR`).catch(() => null);
          if (err) throw new Error(`provider.request rejected: ${err}`);
          return false;
        },
        { timeoutMs: TX_CONFIRM_TIMEOUT_MS, intervalMs: 500 }
      );
      if (!hashCaptured.ready) {
        report(
          "run:write_tx",
          "THẤT BẠI",
          `Không nguồn nào (provider hook / SW network / tab network) thấy transaction_hash trong ${Math.round(TX_CONFIRM_TIMEOUT_MS / 1000)}s — có thể đã click nhầm nút Reject.`
        );
        process.exitCode = 1;
        return;
      }
      report("run:write_tx", "ĐO ĐƯỢC", `set_greeting("${newValue}") tx_hash=${hashCaptured.result.hash} (source: ${hashCaptured.result.source})`);

      await navigateAndWaitLoad(session, `${APP_URL}/debug`);
      await sleep(1200);
      await session.evaluate(`[...document.querySelectorAll('a')].find(a => a.textContent.trim() === 'Read')?.click()`);
      await sleep(800);
      const changed = await waitFor(
        async () => {
          const v = await session.evaluate(readDisplayVariableExpr("greeting"));
          return v && v !== valueBefore ? v : false;
        },
        { timeoutMs: 20_000, intervalMs: 500 }
      );
      if (!changed.ready) {
        report("run:read_after", "THẤT BẠI", `greeting vẫn là "${valueBefore}" sau ${Math.round(changed.waitedMs / 1000)}s.`);
        process.exitCode = 1;
        return;
      }
      await assertNoSecretLeak(session, "after read-again");
      report("run:read_after", "ĐO ĐƯỢC", `"${valueBefore}" -> "${changed.result}"`);

      capturedTxHash = hashCaptured.result.hash;
    }

    const { frames, recordStartMs, recordEndMs } = await recording.stop();
    recording = null;
    report("run:frames_captured", frames.length > 0 ? "ĐO ĐƯỢC" : "THẤT BẠI", `${frames.length} frames`);

    await assembleMp4(frames, recordEndMs);
    const actualRunSeconds = (recordEndMs - recordStartMs) / 1000;
    const videoSeconds = await probeDurationSeconds(MP4_OUT);
    const diffRatio = Math.abs(videoSeconds - actualRunSeconds) / actualRunSeconds;
    report("run:mp4_assembled", "ĐO ĐƯỢC", `${MP4_OUT}`);
    report(
      "run:duration_match",
      diffRatio < DURATION_TOLERANCE ? "ĐO ĐƯỢC" : "THẤT BẠI",
      `video=${videoSeconds.toFixed(2)}s actual=${actualRunSeconds.toFixed(2)}s diff=${(diffRatio * 100).toFixed(1)}%`
    );

    writeProofBlock({
      branch,
      commit,
      contractAddress: sepoliaAddr.address,
      valueBefore,
      txHash: capturedTxHash,
      videoSeconds,
      actualRunSeconds,
      sentTx: process.env.DEMO_SEND_TX === "1",
    });
  } catch (err) {
    report("run:unhandled_error", "THẤT BẠI", String(err?.stack || err));
    process.exitCode = 1;
  } finally {
    await cleanup();
  }
}

function writeProofBlock({ branch, commit, contractAddress, valueBefore, txHash, videoSeconds, actualRunSeconds, sentTx }) {
  const readAfterEntry = results.find((r) => r.step === "run:read_after");
  const lines = [
    `SCAFFOLD-STARK SEPOLIA DEMO — PROOF BLOCK`,
    `branch: ${branch}`,
    `commit: ${commit}`,
    `contract (Sepolia): ${contractAddress}`,
    `  https://sepolia.starkscan.co/contract/${contractAddress}`,
    ``,
    txHash
      ? `tx hash: ${txHash}\n  https://sepolia.starkscan.co/tx/${txHash}`
      : sentTx
        ? `tx hash: NOT CAPTURED — write step failed, see run:write_tx above`
        : `tx hash: (none — DEMO_SEND_TX was not set; this run stopped before submitting a transaction, per explicit request)`,
    ``,
    `on-chain read before: ${JSON.stringify(valueBefore)}`,
    `on-chain read after:  ${readAfterEntry && readAfterEntry.status === "ĐO ĐƯỢC" ? redact(readAfterEntry.detail) : "(not run — write step was skipped or failed)"}`,
    ``,
    `video duration: ${videoSeconds ? videoSeconds.toFixed(2) + "s" : "n/a"}`,
    `actual run duration: ${actualRunSeconds ? actualRunSeconds.toFixed(2) + "s" : "n/a"}`,
  ];
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(PROOF_OUT, redact(lines.join("\n")) + "\n");
  console.log(`\nProof block written to ${PROOF_OUT}`);
}

// ---------------------------------------------------------------- main ---

async function main() {
  const { cmd, flags } = parseArgs(process.argv.slice(2));
  if (cmd === "preflight") {
    await runPreflight();
  } else if (cmd === "run") {
    await runDemo(flags);
  } else {
    console.error("Usage:\n  node stark-demo-web.mjs preflight --branch=<name>\n  node stark-demo-web.mjs run --branch=<name>");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Unhandled error:", err?.stack || err);
  process.exitCode = 1;
});
