#!/usr/bin/env node
/**
 * stark-cdp-with-wallet/launch.mjs — Chrome launch + profile management for
 * driving a real Braavos wallet over raw CDP.
 *
 * Extracted from stark-demo-web.mjs (formerly .claude/workflows/), which
 * used to embed this alongside the demo-recording orchestration. Braavos
 * needs the PERSISTENT `$HOME/.chrome-debug-profile` (the extension is
 * already installed/set-up there) — never the throwaway temp profile
 * stark-smoke-test-browser.mjs's `launchChrome()` creates for the devnode
 * gate, which is a plain unauthenticated browser with no wallet.
 *
 * Zero deps: same style as stark-smoke-test-browser.mjs.
 */

import { spawn, execSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { waitFor, findChromeBinary } from "../stark-smoke-test/stark-smoke-test-browser.mjs";

export const CDP_PORT = Number(process.env.DEMO_CDP_PORT || 9444);
export const PROFILE_DIR = process.env.CHROME_PROFILE_DIR || path.join(os.homedir(), ".chrome-debug-profile");
export const BRAAVOS_ID = "jnlgamecbpmbajjfhmmmlhejkemejdma";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const isAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

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
