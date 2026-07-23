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
 * stark-smoke-test-browser.mjs (imported, not copied). This is a template
 * repo — nothing here may be added to any package.json.
 *
 *   node .claude/workflows/stark-demo-web.mjs preflight --branch=<name>
 *   node .claude/workflows/stark-demo-web.mjs run       --branch=<name>
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
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { waitFor, findChromeBinary, connectSession, openTab, closeTab, captureScreenshot } from "./stark-smoke-test-browser.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
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

export const CDP_PORT = Number(process.env.DEMO_CDP_PORT || 9444);
export const NEXT_PORT = Number(process.env.DEMO_NEXT_PORT || 3131);
export const PROFILE_DIR = process.env.CHROME_PROFILE_DIR || path.join(os.homedir(), ".chrome-debug-profile");
export const BRAAVOS_ID = "jnlgamecbpmbajjfhmmmlhejkemejdma";
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

/** CdpSession.send() has no built-in timeout — a target that goes
 * unresponsive (an MV3 service worker torn down mid-request, observed once
 * here) leaves the promise pending forever instead of rejecting. Race it
 * against a timer so that failure mode surfaces as a reported error. */
function withTimeout(promise, ms, label) {
  return Promise.race([promise, sleep(ms).then(() => Promise.reject(new Error(`Timed out after ${ms}ms: ${label}`)))]);
}
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

// ----------------------------------------------------------- keychain ---

const KEYCHAIN_SERVICE = "scaffold-stark-braavos";
const KEYCHAIN_HELP =
  `Không có Keychain entry "${KEYCHAIN_SERVICE}". Tạo bằng:\n` +
  `  security add-generic-password -s ${KEYCHAIN_SERVICE} -a braavos -w '<mật khẩu Braavos thật>'\n` +
  `Không đoán, không fallback sang env var.`;

/**
 * Reads the Braavos password from the macOS Keychain — never an env var,
 * never logged, never returned in any report() detail. Finding an entry only
 * means an entry exists; it says nothing about whether the password inside
 * it still matches the live wallet (see the module header comment) — callers
 * must always follow this with a real unlock attempt, never trust `found`
 * alone as "password confirmed".
 */
function readBraavosPasswordFromKeychain() {
  try {
    const out = execSync(`security find-generic-password -s ${KEYCHAIN_SERVICE} -w`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const password = out.replace(/\n$/, "");
    // The command can exit 0 with an empty value (e.g. the write half of a
    // `security add-generic-password` failed after the entry itself was
    // created — observed here after a disk-full error) — a real, distinct
    // state from "no entry at all", not the same failure.
    if (!password) return { found: true, empty: true };
    return { found: true, empty: false, password };
  } catch (err) {
    return { found: false, exitCode: err.status ?? null };
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

// -------------------------------------------------------------- chrome ---

export async function cdpReady(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function listTargets(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json`);
  if (!res.ok) throw new Error(`GET /json failed: HTTP ${res.status}`);
  return res.json();
}

/** ps-based holder lookup so a profile-lock timeout reports the PID holding
 * it instead of a generic network timeout that looks like a code bug. */
export function findProfileHolders() {
  try {
    const out = execSync("ps -eo pid,command", { encoding: "utf8" });
    return out.split("\n").filter((line) => line.includes(PROFILE_DIR) && /chrome/i.test(line));
  } catch {
    return [];
  }
}

let chromePid = null;

/** Launches against the persistent $HOME/.chrome-debug-profile (Braavos
 * already installed/set-up there) — never a temp profile, and never deletes
 * this directory on cleanup, unlike the temp-profile helper in the sibling
 * module. */
export async function launchPersistentChrome() {
  const binary = findChromeBinary();
  if (!binary) throw new Error("No Chrome/Chromium binary found (set CHROME_PATH).");
  const args = [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,900",
  ];
  const child = spawn(binary, args, { detached: true, stdio: "ignore" });
  child.unref();
  chromePid = child.pid;
  const { ready, waitedMs } = await waitFor(() => cdpReady(CDP_PORT), { timeoutMs: 15_000, intervalMs: 300 });
  return { ready, waitedMs, pid: child.pid };
}

export async function killPersistentChrome() {
  if (!chromePid) return;
  const pid = chromePid;
  chromePid = null;
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

function readBraavosPopupUrl() {
  const extBase = path.join(PROFILE_DIR, "Default", "Extensions", BRAAVOS_ID);
  const versions = fs.readdirSync(extBase).filter((v) => fs.statSync(path.join(extBase, v)).isDirectory());
  if (!versions.length) throw new Error(`Braavos not found under ${extBase}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(extBase, versions[0], "manifest.json"), "utf8"));
  const popupFile = manifest.action?.default_popup ?? manifest.browser_action?.default_popup ?? "index.html";
  return `chrome-extension://${BRAAVOS_ID}/${popupFile}`;
}

/**
 * Prefers the real "service_worker" target (bg-loader.js) strictly over any
 * "background_page" target — measured that Braavos also exposes a
 * background_page-typed offscreen.html target, and matching either type
 * loosely let `.find()` sometimes grab that one instead, whose execution
 * context does not have chrome.storage bound (real symptom hit: "Cannot read
 * properties of undefined (reading 'local')" even after retries/wake).
 */
async function findServiceWorkerTarget() {
  const targets = await listTargets(CDP_PORT);
  const prefix = `chrome-extension://${BRAAVOS_ID}/`;
  const serviceWorker = targets.find((t) => t.type === "service_worker" && t.url.startsWith(prefix));
  if (serviceWorker) return serviceWorker;
  return targets.find((t) => t.type === "background_page" && t.url.startsWith(prefix) && !t.url.includes("offscreen"));
}

// ------------------------------------------------------- wallet unlock ---

/** Distinguishes "not set up" from "locked"/"unlocked" via real storage
 * evidence (walletVault/defiVault-style keys), not inference from the popup
 * alone — the popup's password-field signal cannot tell setup-vs-unlocked
 * apart on its own (both show no password field). */
export async function checkWalletSetupState() {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    // A CDP target listing for a service_worker can exist before that
    // worker's own global scope has finished bootstrapping the chrome.*
    // namespace (observed: chrome.storage undefined right after attaching).
    // Force a fresh wake via the popup every attempt (not just when no
    // target is found at all) rather than trusting a possibly-still-starting
    // worker reference.
    let popupTab;
    try {
      popupTab = await openTab(CDP_PORT, readBraavosPopupUrl());
      await sleep(1500);
    } finally {
      if (popupTab) await closeTab(CDP_PORT, popupTab.id);
    }
    const target = await findServiceWorkerTarget();
    if (!target) {
      const all = await listTargets(CDP_PORT);
      const braavosTargets = all.filter((t) => t.url.startsWith(`chrome-extension://${BRAAVOS_ID}/`)).map((t) => ({ type: t.type, url: t.url }));
      lastError = new Error(`no service_worker/background_page target found. Braavos-related targets present: ${JSON.stringify(braavosTargets)}`);
      await sleep(1000);
      continue;
    }

    const session = await connectSession(target.webSocketDebuggerUrl);
    try {
      await sleep(500); // let the worker's own init finish before evaluating
      const summary = await withTimeout(
        session.evaluate(`
          (async () => {
            const all = await chrome.storage.local.get(null);
            const keys = Object.keys(all);
            const hintWords = ["vault", "keyring", "keystore", "account", "wallet"];
            const keyHints = keys.filter((k) => hintWords.some((h) => k.toLowerCase().includes(h)));
            return { totalKeys: keys.length, keyHints };
          })()
        `),
        10_000,
        "chrome.storage.local.get against Braavos service worker"
      );
      return { vaultPresent: summary.keyHints.length > 0, summary };
    } catch (err) {
      lastError = err;
      await sleep(1000);
    } finally {
      session.close();
    }
  }
  return { vaultPresent: null, error: `chrome.storage.local.get failed after 3 attempts: ${String(lastError?.message ?? lastError)}` };
}

/** Unconditional CDP Input.insertText — never HTMLInputElement's value
 * setter. insertText never touches page globals, so it works whether or not
 * Braavos scuttles globals; the value-setter trick only works when it
 * doesn't. One approach dominates in both worlds — measuring which world
 * we're in was never necessary (see spike/braavos-cdp-headless M5/M4). */
async function attemptUnlock(password) {
  let tab;
  try {
    tab = await openTab(CDP_PORT, readBraavosPopupUrl());
    const session = await connectSession(tab.webSocketDebuggerUrl);
    try {
      await sleep(1200);
      const hasPasswordField = await session.evaluate(`!!document.querySelector('input[type="password"]')`);
      if (!hasPasswordField) return { state: "NO_PASSWORD_FIELD" };

      await session.evaluate(`document.querySelector('input[type="password"]').focus()`);
      await session.send("Input.insertText", { text: password });
      const len = await session.evaluate(`document.querySelector('input[type="password"]').value.length`);
      if (len === 0) return { state: "INSERT_FAILED", detail: "Input.insertText left the password field empty." };

      await session.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await session.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await sleep(2000);

      const after = await session.evaluate(`
        (() => {
          const pw = document.querySelector('input[type="password"]');
          return { stillPresent: !!pw, ariaInvalid: pw ? pw.getAttribute('aria-invalid') : null, hasAlert: !!document.querySelector('[role="alert"]') };
        })()
      `);
      if (!after.stillPresent) return { state: "UNLOCKED" };
      if (after.ariaInvalid === "true" || after.hasAlert) return { state: "REJECTED", detail: after };
      return { state: "UNKNOWN", detail: after };
    } finally {
      session.close();
    }
  } finally {
    if (tab) await closeTab(CDP_PORT, tab.id);
  }
}

// ------------------------------------------------- Braavos request UI ---

// Dapp-request paths that appear in the side panel's URL when it has a
// pending request to show — same list as the proven reference at
// /Users/q3labsadmin/Q3/Brove/brove/packages/nextjs/e2e/helpers/context.ts.
const DAPP_REQUEST_PATHS = ["dapp-request", "transaction", "sign-message", "sign-transaction"];

/**
 * Braavos's side panel is a SINGLETON target reused across requests — it is
 * NOT a fresh popup per request. Measured directly: the same target's URL
 * went from `side-panel.html?nav={"path":"/dapp-request",...}` to bare
 * `side-panel.html` after an in-panel unlock lost the pending request state.
 * Matching "any new target ID" (the original approach) misses this reuse
 * entirely — match on URL path content instead, exactly like the proven
 * Brove reference implementation.
 */
async function waitForBraavosRequestTarget(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const targets = await listTargets(CDP_PORT);
    const candidate = targets.find(
      (t) => t.type === "page" && t.url.startsWith(`chrome-extension://${BRAAVOS_ID}/`) && DAPP_REQUEST_PATHS.some((p) => t.url.includes(p))
    );
    if (candidate) return candidate;
    await sleep(400);
  }
  return null;
}

/**
 * Approves whatever Braavos request popup/side-panel is currently open
 * (connect or transaction confirm). Tries structural queries first
 * (button / role="button" / tabindex) since that's locale-proof; only falls
 * back to searching for known English action words (Connect/Approve/
 * Confirm/Accept/Sign) once structural search is measured to find nothing —
 * this build (4.19.6) renders its UI with React Native Web, plain <div>s
 * with synthetic pointer handlers and no semantic roles at all, confirmed via
 * a live DOM dump, not assumed. Braavos's own UI text is confirmed English
 * regardless of profile locale (title="Braavos"), unlike the localization
 * risk that applies to this app's own frontend, so the text fallback here is
 * measured-safe, not the same class of guess the brief warns against. The
 * primary action is assumed to be the last candidate found (Cancel/Reject
 * first, Confirm/Approve last) — unverified against a live approval screen,
 * so a wrong click surfaces as a THẤT BẠI on the next step, not silently.
 */
/**
 * A DOM.performSearch text-query match lands on a #text node — walk up to
 * its parent element (the actual clickable React Native Web div) and
 * resolve its box model + a short text/tag description. Returns null if the
 * node has no visible box (hidden/zero-size).
 */
async function resolveTextNodeToClickable(session, nodeId) {
  const resolved = await session.send("DOM.resolveNode", { nodeId }).catch(() => null);
  if (!resolved?.object?.objectId) return null;
  const parentResult = await session
    .send("Runtime.callFunctionOn", {
      objectId: resolved.object.objectId,
      functionDeclaration: "function() { const n = this.nodeType === 3 ? this.parentElement : this; return n; }",
      returnByValue: false,
    })
    .catch(() => null);
  if (!parentResult?.result?.objectId) return null;
  const box = await session.send("DOM.getBoxModel", { objectId: parentResult.result.objectId }).catch(() => null);
  if (!box?.model?.content) return null;
  const c = box.model.content;
  const info = await session
    .send("Runtime.callFunctionOn", {
      objectId: parentResult.result.objectId,
      functionDeclaration: "function() { return { tag: this.tagName, text: (this.innerText||this.textContent||'').slice(0,40) }; }",
      returnByValue: true,
    })
    .catch(() => null);
  return {
    cx: (c[0] + c[2] + c[4] + c[6]) / 4,
    cy: (c[1] + c[3] + c[5] + c[7]) / 4,
    tag: info?.result?.value?.tag ?? null,
    text: info?.result?.value?.text ?? null,
  };
}

async function clickPoint(session, cx, cy) {
  await session.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx, y: cy });
  await session.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
  await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx, y: cy, button: "left", clickCount: 1 });
}

async function approveBraavosRequest(target, password) {
  const session = await connectSession(target.webSocketDebuggerUrl);
  try {
    // The invoke-transaction RPC call is very likely made by Braavos's own
    // extension context, not observable from the dapp tab's Network domain —
    // capture it here too, since the tab-side capture came back empty on a
    // real run that otherwise showed a successful-looking approval click.
    await session.send("Network.enable");
    const getTxHashFromThisTarget = attachTxHashCapture(session);
    // The side panel shows a logo/spinner splash for a variable amount of
    // time (measured 2-6s+) before settling into either a lock screen or the
    // real request content — a trivial body shell ("just the splash") or a
    // not-yet-mounted #root both look like "content present" to a shallow
    // check, so poll for one of the two real end states specifically.
    const settled = await waitFor(
      () =>
        session.evaluate(`
          (() => {
            if (!document.body) return null;
            if (document.querySelector('input[type="password"]')) return 'locked';
            const text = (document.body.innerText || '').trim();
            return text.length > 20 && text !== 'Braavos' ? 'content' : null;
          })()
        `),
      { timeoutMs: 15_000, intervalMs: 400 }
    );
    if (!settled.ready) throw new Error(`Braavos request UI never got past its loading splash within ${Math.round(settled.waitedMs / 1000)}s.`);

    if (settled.result === "locked") {
      if (!password) throw new Error("Braavos request popup is locked and no password was supplied (Keychain entry missing).");
      await session.evaluate(`document.querySelector('input[type="password"]').focus()`);
      await session.send("Input.insertText", { text: password });

      // Login is itself a React Native Web div, not a real <button> — find
      // it via the same structural-then-text approach as the approve action.
      await session.send("DOM.enable");
      await session.send("DOM.getDocument", { depth: -1, pierce: true });
      const loginSearch = await session.send("DOM.performSearch", { query: "Login", includeUserAgentShadowDOM: true });
      if (loginSearch.resultCount) {
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: loginSearch.searchId, fromIndex: 0, toIndex: loginSearch.resultCount });
        for (const nodeId of nodeIds) {
          const point = await resolveTextNodeToClickable(session, nodeId);
          if (point) {
            await clickPoint(session, point.cx, point.cy);
            break;
          }
        }
      } else {
        // Fall back to Enter, in case there's no separate Login button.
        await session.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
        await session.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      }
      await sleep(3000);

      // Measured: unlocking THROUGH the side panel's own lock screen can
      // reset it to the wallet's home dashboard, dropping the pending
      // request's URL state (`?nav={"path":"/dapp-request",...}` -> bare
      // `side-panel.html`) — Braavos does not resume the request on its own.
      // Report this distinctly so the caller can retry the whole
      // click-connect/click-send step, which re-triggers a fresh request
      // against the now-unlocked wallet instead of failing silently.
      const stillOnRequest = await session
        .evaluate(`${JSON.stringify(DAPP_REQUEST_PATHS)}.some((p) => location.href.includes(p))`)
        .catch(() => false);
      if (!stillOnRequest) {
        return { lostContext: true, reason: "unlock reset the side panel away from the pending request" };
      }
    }

    await session.send("DOM.enable");
    // Measured: this Braavos build (4.19.6) renders its request UI with
    // React Native Web (`css-... r-...` atomic classes observed directly) —
    // clickable areas are plain <div>s with React's synthetic pointer
    // handlers, no <button>, no role="button", no shadow DOM at all. Three
    // structural query attempts all returned 0 real results (not a timing
    // issue — identical diagnostic across independent runs). Braavos's own
    // UI is confirmed English regardless of profile locale (title="Braavos"),
    // unlike this app's own frontend concern about localization, so falling
    // back to text search here is measured, not guessed — the same
    // technique already proven against this exact wallet in
    // /Users/q3labsadmin/Q3/Brove/brove/packages/nextjs/e2e/helpers/braavos.ts.
    const STRUCTURAL_QUERIES = ['button', '[role="button"]', 'button, [role="button"], a[role="button"], [tabindex="0"]'];
    const TEXT_CANDIDATES = ["Connect", "Approve", "Confirm", "Accept", "Sign"];
    // Words identifying the PRIMARY action vs. the reject action — Braavos's
    // own UI is confirmed English regardless of profile locale (see above).
    const ACTION_RE = /\b(confirm|approve|connect|accept|sign|login)\b/i;
    const REJECT_RE = /\b(reject|cancel|decline|close)\b/i;

    /** Resolve one search hit to a clickable description: center point plus
     * the text/tag/disabled evidence needed to pick by identity, not order —
     * a blind last-candidate click at (180,696) left a tx request pending
     * forever (neither confirmed nor rejected), so order-picking is banned. */
    const describeNode = async (nodeId) => {
      const box = await session.send("DOM.getBoxModel", { nodeId }).catch(() => null);
      if (!box?.model?.content) return null;
      const c = box.model.content;
      const resolved = await session.send("DOM.resolveNode", { nodeId }).catch(() => null);
      let tag = null, text = null, disabled = false;
      if (resolved?.object?.objectId) {
        const info = await session
          .send("Runtime.callFunctionOn", {
            objectId: resolved.object.objectId,
            functionDeclaration:
              "function() { return { tag: this.tagName, text: (this.innerText || this.textContent || '').trim().slice(0, 60), disabled: !!this.disabled || this.getAttribute('aria-disabled') === 'true' }; }",
            returnByValue: true,
          })
          .catch(() => null);
        tag = info?.result?.value?.tag ?? null;
        text = info?.result?.value?.text ?? null;
        disabled = info?.result?.value?.disabled ?? false;
      }
      return { cx: (c[0] + c[2] + c[4] + c[6]) / 4, cy: (c[1] + c[3] + c[5] + c[7]) / 4, tag, text, disabled };
    };

    const collectCandidates = async () => {
      for (const query of STRUCTURAL_QUERIES) {
        await session.send("DOM.getDocument", { depth: -1, pierce: true });
        const search = await session.send("DOM.performSearch", { query, includeUserAgentShadowDOM: true });
        if (!search.resultCount) continue;
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: search.searchId, fromIndex: 0, toIndex: search.resultCount });
        const out = [];
        for (const nodeId of nodeIds) {
          const d = await describeNode(nodeId);
          if (d) out.push(d);
        }
        if (out.length) return { usedQuery: query, candidates: out };
      }
      return await collectTextCandidates();
    };

    // Text-leaf search for the action words themselves. Needed both when no
    // structural hit exists (connect screen) AND when structural hits are
    // only wrapper containers — measured: the tx screen's sole bottom hit is
    // one DIV whose text is "Decline\nSign" (both buttons in one box), so
    // identity-picking on structural results alone can never resolve it.
    // Prefer elements whose own text is EXACTLY the word ("Sign"), otherwise
    // a header like "Sign Transaction" would win the text search.
    const collectTextCandidates = async () => {
      for (const word of TEXT_CANDIDATES) {
        await session.send("DOM.getDocument", { depth: -1, pierce: true });
        const textSearch = await session.send("DOM.performSearch", { query: word, includeUserAgentShadowDOM: true });
        if (!textSearch.resultCount) continue;
        const out = [];
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: textSearch.searchId, fromIndex: 0, toIndex: textSearch.resultCount });
        for (const nodeId of nodeIds) {
          const point = await resolveTextNodeToClickable(session, nodeId);
          if (point) out.push({ ...point, disabled: false, word });
        }
        const exact = out.filter((c) => (c.text || "").trim() === word);
        if (exact.length) return { usedQuery: `text:"${word}" (exact)`, candidates: exact };
        if (out.length) return { usedQuery: `text:"${word}"`, candidates: out };
      }
      return { usedQuery: null, candidates: [] };
    };

    const pickAction = (list) =>
      [...list].reverse().find((c) => c.text && ACTION_RE.test(c.text) && !REJECT_RE.test(c.text) && !c.disabled) ?? null;

    // The tx-confirm screen's primary button can appear/enable only after fee
    // estimation finishes — re-poll until an enabled action-word candidate
    // shows up instead of clicking whatever is there first.
    // On the tx-confirm screen the Sign button stays disabled until fee
    // estimation completes ("Network Fee" shows "-" while estimating, and a
    // disabled RNW div is indistinguishable from an enabled one in DOM).
    // Wait for the fee value to materialize before picking a button.
    // A loading shimmer leaves the fee line EMPTY (innerText jumps straight
    // to "Decline") — measured: treating "no dash" as done clicked a still-
    // disabled Sign. Only a fee line containing a digit counts as settled,
    // and an estimation error fails fast instead of waiting out the clock.
    const feeSettled = await waitFor(
      () =>
        session.evaluate(`
          (() => {
            const t = document.body ? (document.body.innerText || '') : '';
            if (/Transaction execution error/i.test(t)) return 'estimation_error';
            if (!/Network Fee/i.test(t)) return 'no_fee_row';
            const m = t.match(/Network Fee\\s*\\n\\s*([^\\n]*)/);
            const line = m ? m[1].trim() : '';
            return /[0-9]/.test(line) && line !== '-' ? 'fee_shown' : null;
          })()
        `),
      { timeoutMs: 45_000, intervalMs: 800 }
    );
    if (feeSettled.ready && feeSettled.result === "estimation_error") {
      const t = await session.evaluate(`document.body ? (document.body.innerText || '').slice(0, 400) : ''`).catch(() => "");
      const errShot = path.join(LOG_DIR, `demo-web-panel-esterror-${Date.now()}.png`);
      await captureScreenshot(session, errShot).catch(() => {});
      throw new Error(`Braavos fee estimation FAILED (Transaction execution error shown). Panel text: ${JSON.stringify(t)}. Screenshot: ${errShot}`);
    }
    if (!feeSettled.ready) {
      const t = await session.evaluate(`document.body ? (document.body.innerText || '').slice(0, 400) : ''`).catch(() => "");
      // Do not click anything — an unestimatable tx means Sign never enables.
      const feeShot = path.join(LOG_DIR, `demo-web-panel-feestuck-${Date.now()}.png`);
      await captureScreenshot(session, feeShot).catch(() => {});
      throw new Error(`Braavos fee estimation never completed within 30s (Network Fee still "-"). Panel text: ${JSON.stringify(t)}. Screenshot: ${feeShot}`);
    }

    let usedQuery = null;
    let candidates = [];
    let primary = null;
    const pollDeadline = Date.now() + 25_000;
    while (Date.now() < pollDeadline) {
      ({ usedQuery, candidates } = await collectCandidates());
      primary = pickAction(candidates);
      if (primary) break;
      // Structural hits can be container-only (see collectTextCandidates) —
      // fall through to a text-leaf pass before waiting another round.
      const textOnly = await collectTextCandidates();
      const textPick = pickAction(textOnly.candidates);
      if (textPick) {
        ({ usedQuery, candidates } = textOnly);
        primary = textPick;
        break;
      }
      await sleep(1200);
    }

    const shot = path.join(LOG_DIR, `demo-web-panel-${Date.now()}.png`);
    await captureScreenshot(session, shot).catch(() => {});

    if (!primary) {
      // Measured on a real run: the panel showed "41: Transaction execution
      // error" with a disabled Sign button — the blocker is the wallet's own
      // fee-estimation/simulation failing, not the click. If a "See Error"
      // link is present, open it and screenshot the detail as evidence.
      let errorShot = null;
      await session.send("DOM.getDocument", { depth: -1, pierce: true });
      const errSearch = await session.send("DOM.performSearch", { query: "See Error", includeUserAgentShadowDOM: true }).catch(() => null);
      if (errSearch?.resultCount) {
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: errSearch.searchId, fromIndex: 0, toIndex: errSearch.resultCount });
        for (const nodeId of nodeIds) {
          const point = await resolveTextNodeToClickable(session, nodeId);
          if (point) {
            await clickPoint(session, point.cx, point.cy);
            await sleep(2000);
            errorShot = path.join(LOG_DIR, `demo-web-panel-error-${Date.now()}.png`);
            await captureScreenshot(session, errorShot).catch(() => {});
            break;
          }
        }
      }
      const panelText = await session.evaluate(`document.body ? (document.body.innerText || '').slice(0, 1500) : ''`).catch(() => "");
      throw new Error(
        `No enabled action button (${String(ACTION_RE)}) appeared in the Braavos request UI within 25s. ` +
          `Refusing to blind-click by position. Candidates seen: ${JSON.stringify(
            candidates.map((c) => ({ tag: c.tag, text: c.text, disabled: c.disabled, x: Math.round(c.cx), y: Math.round(c.cy) }))
          )}. Screenshot: ${shot}${errorShot ? ` — error detail screenshot: ${errorShot}` : ""}. Panel text: ${JSON.stringify(panelText)}`
      );
    }

    // Click-and-verify: a click on a still-disabled RNW div is a silent
    // no-op (DOM can't tell the two apart), so after each click check that
    // the request screen actually went away; if not, re-resolve and click
    // again until the deadline.
    let clickAttempts = 0;
    const clickDeadline = Date.now() + 40_000;
    let panelChanged = false;
    while (Date.now() < clickDeadline) {
      await clickPoint(session, primary.cx, primary.cy);
      clickAttempts++;
      await sleep(2500);
      const still = await session
        .evaluate(`document.body ? /Decline/.test(document.body.innerText || '') && ${JSON.stringify(DAPP_REQUEST_PATHS)}.some((p) => location.href.includes(p)) : false`)
        .catch(() => false); // an evaluate failure usually means the panel target closed = accepted
      if (!still) {
        panelChanged = true;
        break;
      }
      const again = await collectTextCandidates();
      const p2 = pickAction(again.candidates);
      if (p2) primary = p2;
    }
    const afterShot = path.join(LOG_DIR, `demo-web-panel-after-${Date.now()}.png`);
    await captureScreenshot(session, afterShot).catch(() => {});
    return {
      query: usedQuery,
      candidates: candidates.map((c) => ({ tag: c.tag, text: c.text, disabled: c.disabled, word: c.word, x: Math.round(c.cx), y: Math.round(c.cy) })),
      clicked: { tag: primary.tag, text: primary.text, x: Math.round(primary.cx), y: Math.round(primary.cy) },
      clickAttempts,
      panelChanged,
      screenshot: shot,
      afterScreenshot: afterShot,
    };
  } finally {
    session.close();
  }
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
      const approveConnect = await approveBraavosRequest(connectRequest, password);
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
        approveTx = await approveBraavosRequest(txRequest, password);
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
