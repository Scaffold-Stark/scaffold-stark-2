#!/usr/bin/env node
/**
 * stark-smoke-test-browser — Chrome DevTools Protocol toolkit.
 *
 * Zero dependencies: Node's native `WebSocket` global (Node >= 22) is the CDP
 * transport, `fetch` talks to the HTTP /json endpoints Chrome exposes next to
 * the debugging port. This is a public template repo — nothing here may be
 * added to any package.json.
 *
 * Pages are driven with Runtime.evaluate executing JS inside the page
 * (querySelector / .click() / textContent). No synthetic mouse coordinates —
 * that is the brittle part of browser automation and breaks on any layout
 * change; in-page JS does not.
 *
 * This module only knows how to launch/kill Chrome and speak CDP. It has no
 * opinion about the app under test — that lives in stark-smoke-test.mjs,
 * next to steps 1-7, so all 13 steps report through the same step()/ok()/
 * fail() convention.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

// ---------------------------------------------------------------- polling ---

/**
 * Poll `probe` until it returns a truthy value. Never polls forever — on
 * timeout the caller gets back how long it waited so it can report that.
 * The truthy return value itself is threaded through as `result`, so a
 * probe can double as both the wait condition and the read.
 */
export async function waitFor(probe, { timeoutMs, intervalMs = 500 }) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const result = await probe();
    if (result) return { ready: true, result, waitedMs: Date.now() - startedAt };
    await sleep(intervalMs);
  }
  return { ready: false, result: null, waitedMs: Date.now() - startedAt };
}

/** True when something already holds the port. Bind probe: no lsof, no deps. */
export function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => resolve(err.code === "EADDRINUSE"));
    server.once("listening", () => server.close(() => resolve(false)));
    server.listen(port, "127.0.0.1");
  });
}

// -------------------------------------------------------------- chrome ---

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

export function findChromeBinary() {
  for (const candidate of CHROME_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

async function cdpReady(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Launch Chrome headless (by default) on an isolated temp profile so this
 * never touches the operator's real browser data, with CDP on `port`.
 * Resolves once the CDP HTTP endpoint actually answers — which can be 1-3s+
 * after the process actually exists. A caller that needs to survive a crash
 * in that window (to record the pid before it's known to be healthy) must
 * hook `onSpawn(info)`, which fires synchronously right after spawn(), not
 * wait for this promise to resolve.
 */
export async function launchChrome({ port, headless = true, logFile, windowWidth = 1440, windowHeight = 900, onSpawn } = {}) {
  const binary = findChromeBinary();
  if (!binary) {
    throw new Error(
      "No Chrome/Chromium binary found. Set CHROME_PATH or install Google Chrome.\n" +
        `Looked in:\n${CHROME_CANDIDATES.map((c) => `  ${c}`).join("\n")}`
    );
  }

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), "stark-smoke-chrome-"));
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    // Headless Chrome's default window is small enough that this app's fixed
    // header buttons and avatar overlap the contract card content, which
    // ruins step 13's screenshots as evidence even though the page itself
    // renders correctly. A real desktop-sized window fixes that.
    `--window-size=${windowWidth},${windowHeight}`,
  ];
  if (headless) args.push("--headless=new");

  const fd = logFile ? fs.openSync(logFile, "a") : "ignore";
  const child = spawn(binary, args, { detached: true, stdio: ["ignore", fd, fd] });
  child.unref();
  if (logFile) fs.closeSync(fd);

  // The process exists from this point, not from whenever the CDP-ready wait
  // below finishes — fire onSpawn now so a caller's crash-safety record can't
  // lag behind the actual process.
  const spawned = { pid: child.pid, profileDir, port, windowWidth, windowHeight };
  if (onSpawn) onSpawn(spawned);

  const { ready } = await waitFor(() => cdpReady(port), { timeoutMs: 15_000, intervalMs: 300 });
  if (!ready) {
    await killChrome({ pid: child.pid, profileDir });
    throw new Error(`Chrome (pid ${child.pid}) never opened CDP on 127.0.0.1:${port} within 15s.`);
  }

  return spawned;
}

/**
 * Kill exactly the Chrome this module launched — the negative pid targets
 * the process group Chrome's helper processes belong to, so no orphaned
 * renderer/GPU helpers survive. Never pattern-matches on process name.
 */
export async function killChrome({ pid, profileDir } = {}) {
  if (pid) {
    try {
      process.kill(-pid, "SIGTERM");
    } catch {
      try {
        process.kill(pid, "SIGTERM");
      } catch {}
    }
    for (let i = 0; i < 20 && alive(pid); i++) await sleep(250);
    if (alive(pid)) {
      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
      }
      await sleep(300);
    }
  }
  if (profileDir) {
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}

// ----------------------------------------------------------------- tabs ---

export async function openTab(port, url = "about:blank") {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
  if (!res.ok) throw new Error(`Failed to open a CDP tab: HTTP ${res.status}`);
  return res.json();
}

export async function closeTab(port, id) {
  try {
    await fetch(`http://127.0.0.1:${port}/json/close/${id}`);
  } catch {}
}

// -------------------------------------------------------------- session ---

/** One CDP WebSocket connection to a single tab: request/response + events. */
class CdpSession {
  constructor(ws) {
    this.ws = ws;
    this._nextId = 0;
    this._pending = new Map();
    this._listeners = new Map();
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id !== undefined && this._pending.has(msg.id)) {
        const { resolve, reject } = this._pending.get(msg.id);
        this._pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method && this._listeners.has(msg.method)) {
        for (const handler of this._listeners.get(msg.method)) handler(msg.params);
      }
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this._nextId;
      this._pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, handler) {
    if (!this._listeners.has(method)) this._listeners.set(method, new Set());
    this._listeners.get(method).add(handler);
    return () => this._listeners.get(method)?.delete(handler);
  }

  /** Runs `expression` as JS inside the page. Throws if the page threw. */
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
      throw new Error(`page threw during Runtime.evaluate: ${detail}`);
    }
    return result.result.value;
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

export function connectSession(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => reject(new Error(`WebSocket connect to ${wsUrl} timed out after 10s`)), 10_000);
    ws.addEventListener("open", () => {
      clearTimeout(timer);
      resolve(new CdpSession(ws));
    });
    ws.addEventListener("error", () => {
      clearTimeout(timer);
      reject(new Error(`WebSocket error connecting to ${wsUrl}`));
    });
  });
}

export async function captureScreenshot(session, filePath) {
  const { data } = await session.send("Page.captureScreenshot", { format: "png" });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, Buffer.from(data, "base64"));
}
