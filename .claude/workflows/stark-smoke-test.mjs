#!/usr/bin/env node
/**
 * stark-smoke-test — e2e gate between Phase 1 and Phase 2.
 *
 * Design: docs/superpowers/specs/2026-07-21-stark-smoke-test-design.md
 *
 * This script owns the deterministic half of the gate: preflight checks,
 * bringing devnet + deploy + dev server up, recording PIDs, and teardown.
 * Steps 8-13 (the Chrome verification) belong to the agent, see
 * .claude/skills/stark-smoke-test/SKILL.md
 *
 *   node .claude/workflows/stark-smoke-test.mjs up     # steps 1-7, leaves stack RUNNING
 *   node .claude/workflows/stark-smoke-test.mjs down   # kills what `up` recorded
 *   node .claude/workflows/stark-smoke-test.mjs verify # steps 8-13, against an already-running stack
 *   node .claude/workflows/stark-smoke-test.mjs run    # up -> verify -> down, CI entry point
 *
 * A separate, opt-in `sepolia` command (S1-S5) proves a real declare+deploy
 * against live Sepolia. It is not part of the 13-step devnet gate above, has
 * no up/down lifecycle of its own, and spends real STRK on every run:
 *
 *   node .claude/workflows/stark-smoke-test.mjs sepolia
 *
 * Design: docs/superpowers/specs/2026-07-22-sepolia-deploy-gate-design.md
 *
 * Plain Node ESM, builtins only. This is a template repo: every dependency
 * added here is inherited by every fork and by create-stark.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import {
  captureScreenshot,
  closeTab,
  connectSession,
  killChrome,
  launchChrome,
  openTab,
  waitFor,
} from "./stark-smoke-test-browser.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const STATE_FILE = path.join(ROOT, ".smoke-test-state.json");
const LOG_DIR = path.join(ROOT, ".smoke-test-logs");
const ENV_FILE = path.join(ROOT, "packages", "snfoundry", ".env");
const ENV_EXAMPLE = path.join(ROOT, "packages", "snfoundry", ".env.example");
const DEPLOYED_CONTRACTS = path.join(ROOT, "packages", "nextjs", "contracts", "deployedContracts.ts");
const TOOL_VERSIONS = path.join(ROOT, ".tool-versions");

const DEVNET_PORT = 5050;
const NEXT_PORT = 3000;
const DEVNET_READY_TIMEOUT_MS = 60_000;
const NEXT_READY_TIMEOUT_MS = 180_000;
const DEPLOY_TIMEOUT_MS = 300_000;
const PORT_RELEASE_TIMEOUT_MS = 20_000;

// CDP debugging port for the Chrome instance steps 8-13 launch and own.
// Deliberately not a "well-known" port so it never collides with a browser
// someone already has open.
const CDP_PORT = 9333;
const APP_URL = `http://127.0.0.1:${NEXT_PORT}`;
const PAGE_LOAD_TIMEOUT_MS = 30_000;
const WALLET_CONNECT_TIMEOUT_MS = 15_000;
const TX_CONFIRM_TIMEOUT_MS = 90_000;
const SELF_PATH = fileURLToPath(import.meta.url);

const REQUIRED_DEVNET_VARS = ["PRIVATE_KEY_DEVNET", "RPC_URL_DEVNET", "ACCOUNT_ADDRESS_DEVNET"];

/** .tool-versions name -> how to ask the installed binary for its version. */
const TOOLCHAIN = {
  scarb: { bin: "scarb", args: ["--version"] },
  "starknet-foundry": { bin: "snforge", args: ["--version"] },
  "starknet-devnet": { bin: "starknet-devnet", args: ["--version"] },
};

// -------------------------------------------------------------- sepolia ---

const REQUIRED_SEPOLIA_VARS = ["PRIVATE_KEY_SEPOLIA", "ACCOUNT_ADDRESS_SEPOLIA", "RPC_URL_SEPOLIA"];
// ascii "SN_SEPOLIA" packed as a felt — the chain id starknet_chainId must answer with.
const SN_SEPOLIA_CHAIN_ID = "0x534e5f5345504f4c4941";
// Same STRK ERC20 address on every network (see packages/snfoundry/scripts-ts/helpers/networks.ts).
const STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
// keccak-based entrypoint selector for "balanceOf", computed with this repo's
// own starknet.js: hash.getSelectorFromName("balanceOf").
const BALANCE_OF_SELECTOR = "0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e";
// Not a fee estimate — just a floor high enough to catch a plainly unfunded
// account before spending a real declare+deploy attempt against it.
const MIN_SEPOLIA_STRK_WEI = 10n ** 16n; // 0.01 STRK
const SEPOLIA_RPC_TIMEOUT_MS = 15_000;
// Sepolia block times are far slower than devnet's, hence the longer budget than DEPLOY_TIMEOUT_MS.
const SEPOLIA_DEPLOY_TIMEOUT_MS = 900_000;

// ---------------------------------------------------------------- output ---

const step = (n, title) => console.log(`\n[${n}/13] ${title}`);
const ok = (msg) => console.log(`  OK    ${msg}`);
const info = (msg) => console.log(`  ...   ${msg}`);

/**
 * Hard failure. The spec forbids collapsing this to a generic "deploy failed":
 * name the step and print the captured output verbatim.
 */
function fail(n, title, message, verbatim) {
  console.error(`\n=========================================================`);
  console.error(`SMOKE TEST FAILED AT STEP ${n}/13 — ${title}`);
  console.error(`=========================================================`);
  console.error(message);
  if (verbatim && verbatim.trim()) {
    console.error(`\n--- verbatim output ---`);
    console.error(verbatim.trimEnd());
    console.error(`--- end verbatim output ---`);
  }
  reportRunningStack();
  console.error(`\nRED GATE: Phase 2 is blocked until this passes.`);
  process.exit(1);
}

/**
 * On failure the stack is deliberately left ALIVE for debugging, so the
 * operator needs the PIDs, the logs and the exact teardown command.
 */
function reportRunningStack() {
  const state = readState();
  if (!state || (!state.processes?.length && !state.chrome)) {
    console.error(`\nNothing was left running.`);
    return;
  }
  console.error(`\nThe stack was left RUNNING on purpose so you can debug it:`);
  for (const p of state.processes ?? []) {
    console.error(`  ${p.name.padEnd(7)} pid ${p.pid}  log: ${p.log}`);
  }
  if (state.chrome) {
    console.error(`  ${"chrome".padEnd(7)} pid ${state.chrome.pid}  profile: ${state.chrome.profileDir}  CDP port: ${state.chrome.port}`);
  }
  console.error(`\nTear down with:`);
  console.error(`  node .claude/workflows/stark-smoke-test.mjs down`);
}

/**
 * Steps 8-13 throw this instead of calling fail() directly, so the caller can
 * kill Chrome (which fail()'s process.exit would otherwise skip) before
 * formatting and exiting through the same fail() as steps 1-7.
 */
class StepFailure extends Error {
  constructor(step, title, message, detail) {
    super(message);
    this.step = step;
    this.title = title;
    this.detail = detail;
  }
}

function stepFail(n, title, message, detail) {
  throw new StepFailure(n, title, message, detail);
}

// ----------------------------------------------------------------- utils ---

/** Starknet felts are printed with inconsistent zero-padding; compare canonically. */
const normalizeHex = (value) => {
  const stripped = String(value).trim().toLowerCase().replace(/^0x/, "").replace(/^0+/, "");
  return stripped === "" ? "0" : stripped;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

/**
 * Chrome is the script's own resource (devnet/next are intentionally left for
 * the operator to debug), so it gets its own state slot. Called from
 * launchChrome()'s onSpawn — i.e. the instant the process exists, NOT once
 * launchChrome resolves (that also waits on CDP, which can lag spawn by
 * seconds). A crash any time after the process exists still leaves a trail
 * `down` and the next `up`'s guard can find.
 */
function recordChrome(chrome) {
  const state = readState() ?? { processes: [] };
  state.chrome = { pid: chrome.pid, profileDir: chrome.profileDir, port: chrome.port };
  writeState(state);
}

function clearChromeState() {
  const state = readState();
  if (state?.chrome) {
    delete state.chrome;
    writeState(state);
  }
}

/**
 * Set while verifyBrowser() has a live Chrome, so a Ctrl-C/SIGTERM mid-verify
 * can kill exactly that Chrome. devnet/next are deliberately NOT touched here:
 * they're detached, unref()'d processes that survive this script by design
 * (left for the operator to debug), same as an ordinary step failure — only
 * Chrome is this process's own resource to clean up on the way out.
 */
let activeChrome = null;

async function handleTerminationSignal(signal) {
  if (activeChrome) {
    console.error(`\nReceived ${signal} — killing Chrome (pid ${activeChrome.pid}) before exit...`);
    const chrome = activeChrome;
    activeChrome = null;
    await killChrome(chrome);
    clearChromeState();
    console.error(`  chrome killed, temp profile removed`);
  }
  process.exit(1);
}

process.on("SIGINT", () => {
  handleTerminationSignal("SIGINT");
});
process.on("SIGTERM", () => {
  handleTerminationSignal("SIGTERM");
});

/** Run a command to completion, capturing stdout+stderr together. */
function run(cmd, args, { cwd = ROOT, timeoutMs, logFile } = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    } catch (err) {
      resolve({ code: null, output: String(err?.message ?? err), spawnError: true });
      return;
    }

    let output = "";
    const stream = logFile ? fs.createWriteStream(logFile, { flags: "a" }) : null;
    const collect = (chunk) => {
      output += chunk;
      if (stream) stream.write(chunk);
    };
    child.stdout.on("data", collect);
    child.stderr.on("data", collect);

    let timedOut = false;
    const timer = timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          try {
            child.kill("SIGKILL");
          } catch {}
        }, timeoutMs)
      : null;

    child.on("error", (err) => {
      if (timer) clearTimeout(timer);
      if (stream) stream.end();
      resolve({ code: null, output: output + String(err?.message ?? err), spawnError: true });
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (stream) stream.end();
      resolve({ code, output, timedOut });
    });
  });
}

/** True when something already holds the port. Uses a bind probe: no lsof, no deps. */
function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err) => resolve(err.code === "EADDRINUSE"));
    server.once("listening", () => server.close(() => resolve(false)));
    server.listen(port, "127.0.0.1");
  });
}

/** GET a URL; resolve true when the server answers at all (any status < 500). */
function httpReady(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode < 500);
    });
    req.setTimeout(3000, () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

/**
 * Poll until `probe` is true. Never polls forever — on timeout the caller is
 * told what was being waited for and for how long.
 */
async function pollUntil(probe, { timeoutMs, intervalMs = 1000 }) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await probe()) return { ready: true, waitedMs: Date.now() - startedAt };
    await sleep(intervalMs);
  }
  return { ready: false, waitedMs: Date.now() - startedAt };
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

/**
 * Signal the whole process group. `yarn chain` is a wrapper around
 * starknet-devnet, so killing only the yarn pid would orphan the real server.
 */
function killGroup(pid, signal) {
  try {
    process.kill(-pid, signal);
    return true;
  } catch {
    try {
      process.kill(pid, signal);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Spawn a long-lived process that OUTLIVES this script: `up` must exit 0 while
 * devnet and the dev server keep running. detached + unref is what makes the
 * later `down` (rather than process exit) the thing that stops them.
 */
function spawnDetached(name, cmd, args, logFile) {
  const fd = fs.openSync(logFile, "a");
  const child = spawn(cmd, args, {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", fd, fd],
  });
  child.unref();
  fs.closeSync(fd);
  return { name, pid: child.pid, log: logFile, cmd: `${cmd} ${args.join(" ")}` };
}

function askYesNo(question) {
  if (!process.stdin.isTTY) return Promise.resolve(false);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

/** Uncommented KEY=VALUE pairs only — a commented var is a missing var. */
function parseEnvFile(text) {
  const vars = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) vars[match[1]] = match[2].trim();
  }
  return vars;
}

/** Recover the devnet block from .env.example so we can show the exact paste. */
function devnetBlockFromExample() {
  let text;
  try {
    text = fs.readFileSync(ENV_EXAMPLE, "utf8");
  } catch {
    return null;
  }
  const lines = [];
  for (const line of text.split("\n")) {
    const match = line.match(/^\s*#\s*(([A-Z0-9_]+)\s*=\s*.*)$/);
    if (match && REQUIRED_DEVNET_VARS.includes(match[2])) lines.push(match[1].trim());
  }
  return lines.length === REQUIRED_DEVNET_VARS.length ? lines.join("\n") : null;
}

// ------------------------------------------------------------------- up ----

async function stepToolVersions() {
  step(1, "Verify .tool-versions matches installed binaries");
  let declared;
  try {
    declared = fs.readFileSync(TOOL_VERSIONS, "utf8");
  } catch (err) {
    fail(1, "toolchain check", `Could not read ${TOOL_VERSIONS}`, String(err?.message ?? err));
  }

  const mismatches = [];
  for (const line of declared.split("\n")) {
    const [name, wanted] = line.trim().split(/\s+/);
    if (!name || !wanted || !TOOLCHAIN[name]) continue;

    const { bin, args } = TOOLCHAIN[name];
    const result = await run(bin, args, { timeoutMs: 20_000 });
    if (result.spawnError || result.code !== 0) {
      mismatches.push(`${name}: declared ${wanted}, but \`${bin} ${args.join(" ")}\` failed — is ${bin} installed and on PATH?\n${result.output.trim()}`);
      continue;
    }
    const found = result.output.match(/\d+\.\d+\.\d+(-[\w.]+)?/)?.[0];
    if (found !== wanted) {
      mismatches.push(`${name}: .tool-versions declares ${wanted}, installed ${bin} reports ${found ?? "unparseable"}\n  raw: ${result.output.trim().split("\n")[0]}`);
    } else {
      ok(`${name} ${found}`);
    }
  }

  if (mismatches.length) {
    fail(
      1,
      "toolchain check",
      "Installed toolchain does not match .tool-versions. This is reported first because the\n" +
        "toolchain is exactly what Phase 1 bumps — fix the mismatch before trusting any later step.",
      mismatches.join("\n\n")
    );
  }
}

async function stepPortsFree() {
  step(2, `Verify ports ${DEVNET_PORT} and ${NEXT_PORT} are free`);
  const busy = [];
  for (const port of [DEVNET_PORT, NEXT_PORT]) {
    if (await portInUse(port)) busy.push(port);
    else ok(`port ${port} free`);
  }
  if (busy.length) {
    fail(
      2,
      "port check",
      `Port(s) already in use: ${busy.join(", ")}.\n` +
        `A previous smoke test may still be up. Tear it down first:\n` +
        `  node .claude/workflows/stark-smoke-test.mjs down`
    );
  }
}

async function stepDevnetEnv(writeEnvFlag) {
  step(3, "Verify packages/snfoundry/.env has the devnet variables uncommented");

  let envText;
  try {
    envText = fs.readFileSync(ENV_FILE, "utf8");
  } catch {
    envText = "";
  }
  const vars = parseEnvFile(envText);
  const missing = REQUIRED_DEVNET_VARS.filter((name) => !vars[name]);

  if (!missing.length) {
    for (const name of REQUIRED_DEVNET_VARS) ok(`${name} set`);
    return vars;
  }

  // In .env.example the whole devnet block ships commented out, so this is the
  // expected first-run failure rather than an exotic one. Show the exact paste.
  const block = devnetBlockFromExample();
  console.error(`\n  MISSING (or still commented out): ${missing.join(", ")}`);
  console.error(`  in ${ENV_FILE}`);
  console.error(`\n  The devnet block ships commented out in .env.example, so this is expected on a`);
  console.error(`  fresh checkout. Paste this block into packages/snfoundry/.env:\n`);
  console.error(block ? block.split("\n").map((l) => `      ${l}`).join("\n") : REQUIRED_DEVNET_VARS.map((v) => `      ${v}=`).join("\n"));

  if (!block) {
    fail(3, "devnet .env check", "\n  Could not recover the devnet block from .env.example — fill the variables by hand.");
  }

  const consented = writeEnvFlag || (await askYesNo("\n  Append this block to packages/snfoundry/.env now? [y/N] "));
  if (!consented) {
    fail(
      3,
      "devnet .env check",
      "\n  Not writing to your .env without confirmation.\n" +
        "  Paste the block above, or re-run with:\n" +
        "    node .claude/workflows/stark-smoke-test.mjs up --write-env"
    );
  }

  const prefix = envText.length && !envText.endsWith("\n") ? "\n" : "";
  fs.appendFileSync(ENV_FILE, `${prefix}\n# added by stark-smoke-test\n${block}\n`);
  ok(`wrote devnet block to ${ENV_FILE}`);
  return parseEnvFile(fs.readFileSync(ENV_FILE, "utf8"));
}

async function stepStartDevnet() {
  step(4, "Start devnet (yarn chain) and wait for /is_alive");
  const log = path.join(LOG_DIR, "devnet.log");
  fs.writeFileSync(log, "");

  const proc = spawnDetached("devnet", "yarn", ["chain"], log);
  writeState({ startedAt: new Date().toISOString(), processes: [proc] });
  info(`devnet pid ${proc.pid}, log ${log}`);

  const { ready, waitedMs } = await pollUntil(() => httpReady(`http://127.0.0.1:${DEVNET_PORT}/is_alive`), {
    timeoutMs: DEVNET_READY_TIMEOUT_MS,
  });
  if (!ready) {
    fail(
      4,
      "devnet startup",
      `Waited ${Math.round(waitedMs / 1000)}s for http://127.0.0.1:${DEVNET_PORT}/is_alive and it never answered.`,
      fs.readFileSync(log, "utf8")
    );
  }
  ok(`devnet alive after ${Math.round(waitedMs / 1000)}s`);
  return log;
}

async function stepCheckPredeployedAccount(devnetLog, envVars) {
  step(5, "Cross-check ACCOUNT_ADDRESS_DEVNET against devnet's predeployed accounts");

  const output = fs.readFileSync(devnetLog, "utf8");
  const accounts = [...output.matchAll(/\|\s*Account address\s*\|\s*(0x[0-9a-fA-F]+)/g)].map((m) => m[1]);
  if (!accounts.length) {
    fail(5, "predeployed account check", "Could not find any predeployed account addresses in devnet output.", output);
  }
  info(`devnet advertises ${accounts.length} predeployed accounts`);

  const configured = envVars.ACCOUNT_ADDRESS_DEVNET;
  const match = accounts.findIndex((a) => normalizeHex(a) === normalizeHex(configured));
  if (match === -1) {
    fail(
      5,
      "predeployed account check",
      `ACCOUNT_ADDRESS_DEVNET in packages/snfoundry/.env is not one of devnet's predeployed accounts.\n\n` +
        `  .env has:        ${configured}\n` +
        `  devnet offers:   ${accounts.join("\n                   ")}\n\n` +
        `  A devnet bump can change the default account class, which makes the seed-0 address\n` +
        `  drift from .env.example. That is exactly the breakage this gate exists to catch —\n` +
        `  without this check it would resurface later as a confusing "deploy failed".`,
      output.split("\n").slice(0, 40).join("\n")
    );
  }
  ok(`ACCOUNT_ADDRESS_DEVNET matches predeployed account #${match} (${accounts[match]})`);
}

async function stepDeploy() {
  step(6, "Deploy (yarn deploy) and confirm deployedContracts.ts was regenerated");
  const log = path.join(LOG_DIR, "deploy.log");
  fs.writeFileSync(log, "");

  let mtimeBefore = 0;
  try {
    mtimeBefore = fs.statSync(DEPLOYED_CONTRACTS).mtimeMs;
  } catch {}

  const result = await run("yarn", ["deploy"], { timeoutMs: DEPLOY_TIMEOUT_MS, logFile: log });
  if (result.timedOut) {
    fail(6, "deploy", `\`yarn deploy\` did not finish within ${DEPLOY_TIMEOUT_MS / 1000}s and was killed.`, result.output);
  }
  if (result.code !== 0) {
    fail(6, "deploy", `\`yarn deploy\` exited with code ${result.code}.`, result.output);
  }
  info(`yarn deploy exited 0, log ${log}`);

  // Exit code 0 is not proof: verify the artifact really moved and has content.
  let stat;
  try {
    stat = fs.statSync(DEPLOYED_CONTRACTS);
  } catch (err) {
    fail(6, "deploy artifact", `${DEPLOYED_CONTRACTS} does not exist after deploy.`, String(err?.message ?? err));
  }
  if (stat.mtimeMs <= mtimeBefore) {
    fail(
      6,
      "deploy artifact",
      `yarn deploy exited 0 but ${path.relative(ROOT, DEPLOYED_CONTRACTS)} was not rewritten\n` +
        `  (mtime unchanged: ${new Date(stat.mtimeMs).toISOString()}).`,
      result.output
    );
  }

  const contents = fs.readFileSync(DEPLOYED_CONTRACTS, "utf8");
  const classHash = contents.match(/classHash:\s*"(0x[0-9a-fA-F]+)"/);
  if (!classHash) {
    fail(
      6,
      "deploy artifact",
      `${path.relative(ROOT, DEPLOYED_CONTRACTS)} was rewritten but contains no class hash —\n` +
        `  the deploy produced no contracts.`,
      contents.slice(0, 2000)
    );
  }
  ok(`deployedContracts.ts regenerated, class hash present (${classHash[1].slice(0, 18)}…)`);
}

async function stepStartNext() {
  step(7, "Start the dev server (yarn start) and wait for :3000");
  const log = path.join(LOG_DIR, "next.log");
  fs.writeFileSync(log, "");

  const proc = spawnDetached("next", "yarn", ["start"], log);
  const state = readState() ?? { processes: [] };
  state.processes.push(proc);
  writeState(state);
  info(`next pid ${proc.pid}, log ${log}`);

  const { ready, waitedMs } = await pollUntil(() => httpReady(`http://127.0.0.1:${NEXT_PORT}/`), {
    timeoutMs: NEXT_READY_TIMEOUT_MS,
    intervalMs: 2000,
  });
  if (!ready) {
    fail(
      7,
      "dev server startup",
      `Waited ${Math.round(waitedMs / 1000)}s for http://127.0.0.1:${NEXT_PORT}/ and it never answered.`,
      fs.readFileSync(log, "utf8")
    );
  }
  ok(`dev server answering after ${Math.round(waitedMs / 1000)}s`);
}

// ------------------------------------------------- verify (steps 8-13) ----
//
// Drives Chrome over the CDP toolkit in stark-smoke-test-browser.mjs.
// Selectors below were read off the real rendered DOM (ConnectModal.tsx,
// DisplayVariable.tsx, WriteOnlyFunctionForm.tsx render exactly this
// structure) — not guessed.

async function step8LoadApp(session) {
  step(8, "Load the app — no console errors, no failed devnet requests");

  const consoleErrors = [];
  const consoleWarnings = [];
  const failedDevnetRequests = [];
  const urlByRequestId = new Map();

  session.on("Runtime.consoleAPICalled", (p) => {
    const text = (p.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
    if (p.type === "error") consoleErrors.push(text);
    else if (p.type === "warning") consoleWarnings.push(text);
  });
  session.on("Runtime.exceptionThrown", (p) => {
    consoleErrors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || "uncaught exception");
  });
  session.on("Network.requestWillBeSent", (p) => urlByRequestId.set(p.requestId, p.request.url));
  session.on("Network.responseReceived", (p) => {
    const { url, status } = p.response;
    if (status >= 400 && (url.includes(`127.0.0.1:${DEVNET_PORT}`) || url.includes(`localhost:${DEVNET_PORT}`))) {
      failedDevnetRequests.push(`HTTP ${status} ${url}`);
    }
  });
  session.on("Network.loadingFailed", (p) => {
    const url = urlByRequestId.get(p.requestId) || "";
    if (url.includes(`127.0.0.1:${DEVNET_PORT}`) || url.includes(`localhost:${DEVNET_PORT}`)) {
      failedDevnetRequests.push(`FAILED ${p.errorText} ${url}`);
    }
  });

  await session.send("Runtime.enable");
  await session.send("Network.enable");
  await session.send("Page.enable");

  let loaded = false;
  const offLoad = session.on("Page.loadEventFired", () => {
    loaded = true;
  });
  await session.send("Page.navigate", { url: APP_URL });

  const { ready, waitedMs } = await waitFor(() => loaded, { timeoutMs: PAGE_LOAD_TIMEOUT_MS, intervalMs: 300 });
  offLoad();
  if (!ready) {
    stepFail(8, "app load", `Waited ${Math.round(PAGE_LOAD_TIMEOUT_MS / 1000)}s for ${APP_URL} to fire the page load event and it never did.`, "");
  }

  await sleep(2000); // let hydration / async console noise settle before judging it

  const finalUrl = await session.evaluate(`location.href`);
  if (!finalUrl.startsWith(APP_URL)) {
    const bodyText = await session.evaluate(`document.body ? document.body.innerText.slice(0, 500) : ''`);
    stepFail(
      8,
      "app load",
      `Expected to land on ${APP_URL} but ended up at ${finalUrl}. The dev server is likely not running.`,
      bodyText
    );
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  await captureScreenshot(session, path.join(LOG_DIR, "08-app-loaded.png"));

  const rpcWarnings = consoleWarnings.filter((w) => /\brpc\b|provider|contract/i.test(w));
  if (consoleErrors.length || rpcWarnings.length) {
    stepFail(
      8,
      "console errors",
      "App load produced console error(s) or a warning mentioning the RPC, the provider, or a contract.",
      [
        consoleErrors.length ? `console errors:\n${consoleErrors.join("\n")}` : "",
        rpcWarnings.length ? `warnings mentioning rpc/provider/contract:\n${rpcWarnings.join("\n")}` : "",
      ]
        .filter(Boolean)
        .join("\n\n")
    );
  }
  if (failedDevnetRequests.length) {
    stepFail(8, "devnet network requests", `Failed network request(s) to 127.0.0.1:${DEVNET_PORT}.`, failedDevnetRequests.join("\n"));
  }

  ok(`app loaded after ${Math.round(waitedMs / 1000)}s, 0 console errors, 0 failed devnet requests`);
  if (consoleWarnings.length) info(`${consoleWarnings.length} non-fatal console warning(s) (none mention rpc/provider/contract)`);
}

async function step9ConnectWallet(session) {
  step(9, "Go to /debug and connect the burner wallet");

  let loaded = false;
  const offLoad = session.on("Page.loadEventFired", () => {
    loaded = true;
  });
  await session.send("Page.navigate", { url: `${APP_URL}/debug` });
  const nav = await waitFor(() => loaded, { timeoutMs: PAGE_LOAD_TIMEOUT_MS, intervalMs: 300 });
  offLoad();
  if (!nav.ready) {
    stepFail(9, "debug page load", `Waited ${Math.round(PAGE_LOAD_TIMEOUT_MS / 1000)}s for ${APP_URL}/debug to load and it never did.`, "");
  }
  await sleep(1500);

  const openedModal = await session.evaluate(`
    (() => {
      const label = document.querySelector('label[for="connect-modal"]');
      if (!label) return 'NO_CONNECT_LABEL';
      label.click();
      return 'clicked';
    })()
  `);
  if (openedModal !== "clicked") {
    stepFail(9, "connect modal", `Could not find the Connect button (label[for="connect-modal"]) on ${APP_URL}/debug.`, `evaluate returned: ${openedModal}`);
  }

  const modalOpen = await waitFor(() => session.evaluate(`document.getElementById('connect-modal')?.checked === true`), {
    timeoutMs: 5000,
    intervalMs: 200,
  });
  if (!modalOpen.ready) {
    stepFail(9, "connect modal", `Clicked Connect but the modal never opened within ${modalOpen.waitedMs}ms.`, "");
  }

  const clickedBurner = await session.evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Burner Wallet');
      if (!btn) return 'NO_BURNER_BUTTON';
      btn.click();
      return 'clicked';
    })()
  `);
  if (clickedBurner !== "clicked") {
    stepFail(9, "burner wallet", 'Could not find the "Burner Wallet" button in the connect modal.', `evaluate returned: ${clickedBurner}`);
  }

  const ACCOUNT_TEXT_RE = "/^0x[0-9a-fA-F]{2,}\\.\\.\\.[0-9a-fA-F]{2,}$/";
  const accountsReady = await waitFor(
    () => session.evaluate(`[...document.querySelectorAll('button')].filter(b => ${ACCOUNT_TEXT_RE}.test(b.textContent.trim())).length > 0`),
    { timeoutMs: 5000, intervalMs: 200 }
  );
  if (!accountsReady.ready) {
    stepFail(9, "burner accounts", `Burner Wallet account list never appeared within ${accountsReady.waitedMs}ms.`, "");
  }

  const clickedAccount = await session.evaluate(`
    (() => {
      const btn = [...document.querySelectorAll('button')].find(b => ${ACCOUNT_TEXT_RE}.test(b.textContent.trim()));
      if (!btn) return 'NO_ACCOUNT_BUTTON';
      btn.click();
      return btn.textContent.trim();
    })()
  `);
  if (clickedAccount === "NO_ACCOUNT_BUTTON") {
    stepFail(9, "burner account select", "Could not click a burner account button.", "");
  }

  const connected = await waitFor(
    async () => {
      const text = await session.evaluate(`document.querySelector('details summary')?.textContent.trim() ?? ''`);
      return /^0x[0-9a-fA-F]{2,}\.\.\.[0-9a-fA-F]{2,}$/.test(text) ? text : false;
    },
    { timeoutMs: WALLET_CONNECT_TIMEOUT_MS, intervalMs: 300 }
  );
  if (!connected.ready) {
    stepFail(
      9,
      "wallet connection",
      `Selected burner account "${clickedAccount}" but the UI never showed a connected address within ${Math.round(connected.waitedMs / 1000)}s.`,
      ""
    );
  }

  await captureScreenshot(session, path.join(LOG_DIR, "09-wallet-connected.png"));
  ok(`burner wallet connected: ${connected.result}`);
}

/** Reads .space-y-1 container's value div for the read function named `name` (DisplayVariable.tsx layout). */
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

async function step10ReadValue(session) {
  step(10, "Read a contract read function (greeting) and record its value");

  await session.evaluate(`[...document.querySelectorAll('a')].find(a => a.textContent.trim() === 'Read')?.click()`);
  await sleep(800);

  const found = await waitFor(() => session.evaluate(`!!([...document.querySelectorAll('h3')].find(h => h.textContent.trim() === 'greeting'))`), {
    timeoutMs: 10_000,
    intervalMs: 300,
  });
  if (!found.ready) {
    stepFail(10, "read greeting", `The "greeting" read function never appeared on the Debug Contracts page within ${Math.round(found.waitedMs / 1000)}s.`, "");
  }

  const value = await session.evaluate(readDisplayVariableExpr("greeting"));
  if (!value) {
    stepFail(10, "read greeting", "Found the greeting label but its value element was empty or missing.", "");
  }

  await captureScreenshot(session, path.join(LOG_DIR, "10-read-before.png"));
  ok(`greeting = ${JSON.stringify(value)}`);
  return value;
}

async function step11WriteValue(session) {
  step(11, "Call set_greeting (write) and wait for the transaction to confirm");
  const newValue = `smoke-test-${Date.now()}`;

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
    stepFail(11, "set_greeting form", "Could not fill the set_greeting new_greeting input.", `evaluate returned: ${filled}`);
  }

  const clickedSend = await session.evaluate(`
    (() => {
      const label = [...document.querySelectorAll('p.text-function')].find(p => p.textContent.trim() === 'set_greeting');
      if (!label) return 'NO_LABEL';
      const container = label.closest('.flex.gap-3.flex-col');
      const btn = container ? [...container.querySelectorAll('button')].find(b => b.textContent.trim() === 'Send 💸') : null;
      if (!btn) return 'NO_SEND_BUTTON';
      if (btn.disabled) return 'SEND_DISABLED';
      btn.click();
      return 'clicked';
    })()
  `);
  if (clickedSend !== "clicked") {
    stepFail(11, "set_greeting send", "Could not click Send for set_greeting.", `evaluate returned: ${clickedSend}`);
  }

  const confirmed = await waitFor(async () => (await session.evaluate(`document.body.innerText`)).includes("Transaction completed successfully"), {
    timeoutMs: TX_CONFIRM_TIMEOUT_MS,
    intervalMs: 500,
  });
  if (!confirmed.ready) {
    const lastText = await session.evaluate(`document.body.innerText`).catch(() => "");
    stepFail(
      11,
      "transaction confirmation",
      `Sent set_greeting("${newValue}") but never saw the "Transaction completed successfully!" confirmation within ${Math.round(
        TX_CONFIRM_TIMEOUT_MS / 1000
      )}s.`,
      lastText.slice(0, 2000)
    );
  }

  await captureScreenshot(session, path.join(LOG_DIR, "11-tx-confirmed.png"));
  ok(`set_greeting("${newValue}") confirmed after ${Math.round(confirmed.waitedMs / 1000)}s`);
  return newValue;
}

async function step12ReadAgain(session, valueBefore) {
  step(12, "Read the value again — it must differ from step 10");

  await session.evaluate(`[...document.querySelectorAll('a')].find(a => a.textContent.trim() === 'Read')?.click()`);
  await sleep(800);
  await session.evaluate(`
    (() => {
      const h3 = [...document.querySelectorAll('h3')].find(h => h.textContent.trim() === 'greeting');
      const refreshBtn = h3 ? h3.closest('.flex.items-center')?.querySelector('button.btn-ghost') : null;
      if (refreshBtn) refreshBtn.click();
    })()
  `);

  const changed = await waitFor(
    async () => {
      const value = await session.evaluate(readDisplayVariableExpr("greeting"));
      return value && value !== valueBefore ? value : false;
    },
    { timeoutMs: 15_000, intervalMs: 500 }
  );
  if (!changed.ready) {
    stepFail(
      12,
      "read greeting after write",
      `greeting is still "${valueBefore}" after waiting ${Math.round(changed.waitedMs / 1000)}s — the write did not take effect. ` +
        `Unchanged is a FAIL even if the transaction reported success.`,
      ""
    );
  }

  await captureScreenshot(session, path.join(LOG_DIR, "12-read-after.png"));
  ok(`greeting changed: "${valueBefore}" -> "${changed.result}"`);
}

async function step13Screenshots(session) {
  step(13, "Confirm screenshots of the key moments were captured");

  await captureScreenshot(session, path.join(LOG_DIR, "13-final.png"));
  const expected = [
    "08-app-loaded.png",
    "09-wallet-connected.png",
    "10-read-before.png",
    "11-tx-confirmed.png",
    "12-read-after.png",
    "13-final.png",
  ];
  const missing = expected.filter((f) => !fs.existsSync(path.join(LOG_DIR, f)));
  if (missing.length) {
    stepFail(13, "screenshots", `Missing screenshot(s): ${missing.join(", ")}`, `expected all of: ${expected.join(", ")} in ${path.relative(ROOT, LOG_DIR)}/`);
  }

  ok(`${expected.length} screenshots saved to ${path.relative(ROOT, LOG_DIR)}/`);
}

async function runBrowserSteps(chrome) {
  const tab = await openTab(chrome.port);
  const session = await connectSession(tab.webSocketDebuggerUrl);
  try {
    // --window-size on the Chrome command line is not always honored for the
    // first paint in headless mode; force the viewport explicitly so fixed
    // header buttons and the avatar don't overlap the contract card in the
    // step 13 screenshots.
    await session.send("Emulation.setDeviceMetricsOverride", {
      width: chrome.windowWidth,
      height: chrome.windowHeight,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await step8LoadApp(session);
    await step9ConnectWallet(session);
    const before = await step10ReadValue(session);
    await step11WriteValue(session);
    await step12ReadAgain(session, before);
    await step13Screenshots(session);
  } finally {
    session.close();
    await closeTab(chrome.port, tab.id);
  }
}

/**
 * Steps 8-13: launch Chrome, drive the already-running stack, always kill
 * Chrome (it's ours, unlike devnet/next which stay alive for debugging on
 * failure), then report through the same fail() as steps 1-7.
 */
async function verifyBrowser(flags) {
  console.log(`stark-smoke-test: browser verification (steps 8-13 of 13)`);

  if (await portInUse(CDP_PORT)) {
    fail(8, "Chrome CDP launch", `Port ${CDP_PORT} (reserved for the Chrome DevTools Protocol) is already in use.\nFree it, or something from a previous run did not clean up.`);
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });
  const chromeLog = path.join(LOG_DIR, "chrome.log");
  fs.writeFileSync(chromeLog, "");

  let chrome;
  try {
    chrome = await launchChrome({
      port: CDP_PORT,
      headless: !flags.headed,
      logFile: chromeLog,
      // Fires the instant the process is spawned — seconds before this whole
      // call resolves (it also waits on CDP). Recording here, not after
      // launchChrome returns, is what closes the window: if this script dies
      // (Ctrl-C, closed terminal, crash, SIGKILL) anywhere from here on,
      // `down` and the next `up`'s guard already know this Chrome exists.
      onSpawn: (spawned) => {
        activeChrome = spawned;
        recordChrome(spawned);
      },
    });
  } catch (err) {
    // launchChrome already made its own best-effort kill of what it spawned
    // before throwing, but "best-effort" is not "guaranteed" — the state
    // record from onSpawn is deliberately left in place (not cleared here) so
    // `down`, which is idempotent against an already-dead pid and an
    // already-removed profile dir, remains the actual safety net.
    fail(8, "Chrome launch", "Could not launch Chrome for CDP verification.", String(err?.message ?? err));
    return;
  }
  info(`chrome pid ${chrome.pid}, profile ${chrome.profileDir}, CDP on ${CDP_PORT}`);

  try {
    await runBrowserSteps(chrome);
  } catch (err) {
    await killChrome(chrome);
    activeChrome = null;
    clearChromeState();
    if (err instanceof StepFailure) {
      fail(err.step, err.title, err.message, err.detail);
    } else {
      fail(8, "browser verification", "Unexpected error during Chrome verification.", String(err?.stack || err));
    }
    return;
  }
  await killChrome(chrome);
  activeChrome = null;
  clearChromeState();
  ok("chrome killed, temp profile removed");
}

async function up(flags) {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const existing = readState();
  const stackAlive = existing?.processes?.some((p) => alive(p.pid));
  const chromeAlive = existing?.chrome && alive(existing.chrome.pid);
  if (stackAlive || chromeAlive) {
    console.error(`A previous smoke-test stack still looks alive (see ${path.relative(ROOT, STATE_FILE)}).`);
    reportRunningStack();
    console.error(`\nRun \`down\` first.`);
    process.exit(1);
  }

  console.log(`stark-smoke-test: bring-up (steps 1-7 of 13)`);
  console.log(`repo: ${ROOT}`);

  await stepToolVersions();
  await stepPortsFree();
  const envVars = await stepDevnetEnv(flags.writeEnv);
  const devnetLog = await stepStartDevnet();
  await stepCheckPredeployedAccount(devnetLog, envVars);
  await stepDeploy();
  await stepStartNext();

  const state = readState();
  console.log(`\n=========================================================`);
  console.log(`STEPS 1-7 PASSED — stack is UP and left running`);
  console.log(`=========================================================`);
  for (const p of state.processes) {
    console.log(`  ${p.name.padEnd(7)} pid ${p.pid}  log: ${path.relative(ROOT, p.log)}`);
  }
  console.log(`\n  devnet:  http://127.0.0.1:${DEVNET_PORT}`);
  console.log(`  app:     http://127.0.0.1:${NEXT_PORT}`);
  console.log(`\nSteps 8-13 are the agent's Chrome verification — see`);
  console.log(`  .claude/skills/stark-smoke-test/SKILL.md`);
  console.log(`\nWhen finished (or to clean up after a failure):`);
  console.log(`  node .claude/workflows/stark-smoke-test.mjs down`);
  process.exit(0);
}

// ----------------------------------------------------------------- down ----

async function down() {
  console.log(`stark-smoke-test: teardown`);
  const state = readState();

  if (!state || !state.processes?.length) {
    console.log(`  no ${path.relative(ROOT, STATE_FILE)} — nothing recorded to tear down`);
  } else {
    for (const p of state.processes) {
      if (!alive(p.pid)) {
        console.log(`  ${p.name.padEnd(7)} pid ${p.pid} already gone`);
        continue;
      }
      killGroup(p.pid, "SIGTERM");
      let stopped = false;
      for (let i = 0; i < 20; i++) {
        await sleep(250);
        if (!alive(p.pid)) {
          stopped = true;
          break;
        }
      }
      if (!stopped) {
        killGroup(p.pid, "SIGKILL");
        await sleep(500);
        stopped = !alive(p.pid);
      }
      console.log(`  ${p.name.padEnd(7)} pid ${p.pid} ${stopped ? "stopped" : "WOULD NOT DIE"}`);
    }
  }

  if (state?.chrome) {
    const { pid, profileDir } = state.chrome;
    console.log(`  chrome  pid ${pid} ${alive(pid) ? "killing (orphaned CDP process)" : "already gone"}`);
    await killChrome({ pid, profileDir });
    console.log(`  chrome  profile dir removed (was ${profileDir})`);
  }

  // Killing a pid is not the same as the port being free again.
  const stillBusy = [];
  for (const port of [DEVNET_PORT, NEXT_PORT, CDP_PORT]) {
    const { ready, waitedMs } = await pollUntil(async () => !(await portInUse(port)), {
      timeoutMs: PORT_RELEASE_TIMEOUT_MS,
      intervalMs: 500,
    });
    if (ready) console.log(`  port ${port} released`);
    else {
      stillBusy.push(port);
      console.error(`  port ${port} STILL IN USE after waiting ${Math.round(waitedMs / 1000)}s`);
    }
  }

  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
    console.log(`  removed ${path.relative(ROOT, STATE_FILE)}`);
  }

  if (stillBusy.length) {
    console.error(`\nTeardown incomplete: port(s) ${stillBusy.join(", ")} still held by something this script did not start.`);
    process.exit(1);
  }
  console.log(`\nTeardown complete. Logs kept in ${path.relative(ROOT, LOG_DIR)}/`);
  process.exit(0);
}

// ------------------------------------------------------------------- run ---

/** Re-invokes this same script as a child so `up`'s/`down`'s own process.exit and leave-alive-on-failure behavior stay untouched. */
function spawnStreamed(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SELF_PATH, ...args], { cwd: ROOT, stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

/**
 * CI entry point: up -> verify -> down, exit non-zero if any of the 13 steps
 * are red. verifyBrowser() exits the process itself on failure (via fail()),
 * so `down` only runs — and only needs to run — after a full pass.
 */
async function runFull(flags) {
  console.log(`stark-smoke-test: run (up -> verify -> down)`);

  const upArgs = ["up", ...(flags.writeEnv ? ["--write-env"] : [])];
  const upCode = await spawnStreamed(upArgs);
  if (upCode !== 0) {
    console.error(`\nrun: \`up\` exited ${upCode}; stopping before verify. The stack was left running for debugging — see above.`);
    process.exit(upCode);
  }

  await verifyBrowser(flags);

  console.log(`\nrun: steps 8-13 passed. Tearing down...`);
  const downCode = await spawnStreamed(["down"]);
  if (downCode !== 0) {
    console.error(`\nrun: verify PASSED but \`down\` exited ${downCode} — stack may not be fully cleaned up.`);
    process.exit(downCode);
  }

  console.log(`\n=========================================================`);
  console.log(`RUN COMPLETE — ALL 13 STEPS PASSED, stack torn down`);
  console.log(`=========================================================`);
  process.exit(0);
}

// --------------------------------------------------------------- sepolia ---
//
// Opt-in live-network deploy gate (S1-S5). Spawns no long-lived processes —
// no up/down lifecycle, no orphaned-process risk. Runs, reports, exits with a
// three-way code: 0 GREEN, 2 INFRA (yellow, does not block Phase 2), 1 RED
// (blocks Phase 2). Reuses fail()/run()/log-file conventions from the devnet
// path above but does not call fail() itself — that function's "13 steps"
// framing and reportRunningStack() do not apply to a gate with no stack.
//
// Design: docs/superpowers/specs/2026-07-22-sepolia-deploy-gate-design.md

const stepS = (n, title) => console.log(`\n[S${n}/5] ${title}`);

/** Set once S1 reads RPC_URL_SEPOLIA, so every later message can be scrubbed of it. */
let sepoliaRpcUrl = null;

/** RPC_URL_SEPOLIA carries an API key; never let it reach stdout, even inside an error message. */
function redactRpcUrl(text) {
  if (!text || !sepoliaRpcUrl) return text;
  return text.split(sepoliaRpcUrl).join("[RPC_URL_SEPOLIA redacted]");
}

function sepoliaExit(kind, n, title, message, verbatim) {
  const label = kind === "red" ? "RED" : "INFRA";
  console.error(`\n=========================================================`);
  console.error(`SEPOLIA GATE ${label} AT STEP S${n}/5 — ${title}`);
  console.error(`=========================================================`);
  console.error(redactRpcUrl(message));
  if (verbatim && verbatim.trim()) {
    console.error(`\n--- verbatim output ---`);
    console.error(redactRpcUrl(verbatim.trimEnd()));
    console.error(`--- end verbatim output ---`);
  }
  console.error(
    kind === "red"
      ? `\nRED GATE: this blocks Phase 2 — a real rejection or a missing on-chain class, not infrastructure.`
      : `\nINFRA (yellow): this does NOT block Phase 2. It is retryable once the underlying issue (config, funding, connectivity) is fixed.`
  );
  process.exit(kind === "red" ? 1 : 2);
}
const sepoliaRed = (n, title, message, verbatim) => sepoliaExit("red", n, title, message, verbatim);
const sepoliaInfra = (n, title, message, verbatim) => sepoliaExit("infra", n, title, message, verbatim);

/** POST a JSON-RPC request. Separates transport failures from RPC-level error objects, since S5 needs to tell them apart. */
async function rpcJson(url, method, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEPOLIA_RPC_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
    });
  } catch (err) {
    return { ok: false, transportError: true, message: `request failed: ${String(err?.message ?? err)}` };
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 429 || res.status >= 500) {
    return { ok: false, transportError: true, message: `HTTP ${res.status} from RPC` };
  }
  let body;
  try {
    body = await res.json();
  } catch {
    return { ok: false, transportError: true, message: `HTTP ${res.status}, non-JSON response` };
  }
  if (body.error) {
    return { ok: false, rpcError: body.error, message: `RPC error ${body.error.code}: ${body.error.message}` };
  }
  return { ok: true, result: body.result };
}

function formatStrk(wei) {
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 6);
  return `${whole}.${frac}`;
}

async function sepoliaStepPreflight() {
  stepS(1, "Preflight: toolchain + Sepolia env vars");
  await stepToolVersions(); // reused as-is; exits 1 through fail() on a toolchain mismatch

  let envText;
  try {
    envText = fs.readFileSync(ENV_FILE, "utf8");
  } catch {
    envText = "";
  }
  const vars = parseEnvFile(envText);
  const missing = REQUIRED_SEPOLIA_VARS.filter((name) => !vars[name]);
  if (missing.length) {
    sepoliaInfra(
      1,
      "Sepolia env check",
      `Missing (or empty) in ${path.relative(ROOT, ENV_FILE)}: ${missing.join(", ")}\n\n` +
        `This gate never writes to your .env — fill in the missing value(s) yourself:\n\n` +
        missing.map((v) => `  ${v}=`).join("\n") +
        `\n\nThis is a "not configured" state, not a code failure.`
    );
  }
  for (const name of REQUIRED_SEPOLIA_VARS) ok(`${name} set`);
  sepoliaRpcUrl = vars.RPC_URL_SEPOLIA;
  return vars;
}

async function sepoliaStepRpcIdentity() {
  stepS(2, "RPC identity check (starknet_chainId)");
  const result = await rpcJson(sepoliaRpcUrl, "starknet_chainId", []);
  if (!result.ok) {
    sepoliaInfra(2, "RPC identity", `starknet_chainId against RPC_URL_SEPOLIA failed: ${result.message}`);
  }
  if (normalizeHex(result.result) !== normalizeHex(SN_SEPOLIA_CHAIN_ID)) {
    sepoliaRed(
      2,
      "RPC identity",
      `RPC_URL_SEPOLIA answered starknet_chainId with ${result.result}, not SN_SEPOLIA (${SN_SEPOLIA_CHAIN_ID}).\n` +
        `RPC_URL_SEPOLIA is pointed at the wrong network — deploying now would be actively wrong.`
    );
  }
  ok(`chain id confirmed SN_SEPOLIA`);
}

async function sepoliaStepBalance(accountAddress) {
  stepS(3, "Fee balance check (STRK balanceOf)");
  const result = await rpcJson(sepoliaRpcUrl, "starknet_call", [
    { contract_address: STRK_TOKEN_ADDRESS, entry_point_selector: BALANCE_OF_SELECTOR, calldata: [accountAddress] },
    "latest",
  ]);
  if (!result.ok) {
    sepoliaInfra(3, "fee balance check", `starknet_call balanceOf against RPC_URL_SEPOLIA failed: ${result.message}`);
  }
  const [lowHex, highHex] = Array.isArray(result.result) ? result.result : [];
  if (lowHex === undefined) {
    sepoliaInfra(3, "fee balance check", `starknet_call balanceOf returned an unexpected shape: ${JSON.stringify(result.result)}`);
  }
  const balance = BigInt(lowHex) + (BigInt(highHex ?? "0x0") << 128n);
  if (balance < MIN_SEPOLIA_STRK_WEI) {
    sepoliaInfra(
      3,
      "fee balance check",
      `ACCOUNT_ADDRESS_SEPOLIA (${accountAddress}) has ${formatStrk(balance)} STRK, below the ${formatStrk(MIN_SEPOLIA_STRK_WEI)} STRK minimum this gate requires.\n` +
        `Fund this account on Sepolia and re-run.`
    );
  }
  ok(`fee balance ${formatStrk(balance)} STRK (>= ${formatStrk(MIN_SEPOLIA_STRK_WEI)} minimum)`);
}

async function sepoliaStepDeploy() {
  stepS(4, "Deploy (yarn deploy --network sepolia)");
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const log = path.join(LOG_DIR, "deploy-sepolia.log");
  fs.writeFileSync(log, "");

  const result = await run("yarn", ["deploy", "--network", "sepolia"], { timeoutMs: SEPOLIA_DEPLOY_TIMEOUT_MS, logFile: log });

  if (result.spawnError) {
    sepoliaInfra(4, "deploy", `Could not run \`yarn deploy --network sepolia\`.`, result.output);
  }
  if (result.timedOut) {
    sepoliaInfra(
      4,
      "deploy",
      `\`yarn deploy --network sepolia\` did not finish within ${Math.round(SEPOLIA_DEPLOY_TIMEOUT_MS / 1000)}s and was killed.\n` +
        `Sepolia block times are far slower than devnet — this may not be a real failure. Check ${path.relative(ROOT, log)}.`,
      result.output
    );
  }
  if (result.code !== 0) {
    sepoliaRed(4, "deploy", `\`yarn deploy --network sepolia\` exited with code ${result.code} — the sequencer rejected the declare or deploy.`, result.output);
  }
  ok(`yarn deploy --network sepolia exited 0, log ${path.relative(ROOT, log)}`);
  console.log(`  NOTE: ${path.relative(ROOT, DEPLOYED_CONTRACTS)} was modified by this run.`);
  console.log(`        Commit or revert it yourself — this script will not touch it.`);

  return extractDeployedAddressFromLog(result.output);
}

/** Deploy prints `Contract Deployed at <addr>` (deploy-contract.ts) — ground truth for "this run deployed something", independent of whether deployedContracts.ts actually got rewritten. */
function extractDeployedAddressFromLog(output) {
  const match = output.match(/Contract Deployed at[^\n]*?(0x[0-9a-fA-F]+)/);
  return match ? match[1] : null;
}

/** Pulls the address of the first contract under the top-level "sepolia" key out of the regenerated deployedContracts.ts. */
function extractSepoliaAddress() {
  let contents;
  try {
    contents = fs.readFileSync(DEPLOYED_CONTRACTS, "utf8");
  } catch (err) {
    return { error: `Could not read ${path.relative(ROOT, DEPLOYED_CONTRACTS)}: ${String(err?.message ?? err)}` };
  }
  const sepoliaBlock = contents.match(/\bsepolia:\s*{/);
  if (!sepoliaBlock) {
    return { error: `No "sepolia" entry found in ${path.relative(ROOT, DEPLOYED_CONTRACTS)}.` };
  }
  const rest = contents.slice(sepoliaBlock.index + sepoliaBlock[0].length);
  const address = rest.match(/address:\s*"(0x[0-9a-fA-F]+)"/);
  if (!address) {
    return { error: `Found a "sepolia" entry in ${path.relative(ROOT, DEPLOYED_CONTRACTS)} but no address inside it.` };
  }
  return { address: address[1] };
}

async function sepoliaStepConfirm(deployLogAddress) {
  stepS(5, "On-chain confirmation (starknet_getClassHashAt)");
  const parsed = extractSepoliaAddress();
  if (parsed.error) {
    sepoliaRed(5, "on-chain confirmation", parsed.error);
  }

  // Freshness check: deployedContracts.ts could be a stale leftover from a
  // previous run if this run's `yarn deploy` somehow exited 0 without
  // rewriting it. Cross-check against the address S4's own deploy output
  // reported, not just the file, before trusting the file at all.
  if (!deployLogAddress) {
    sepoliaRed(
      5,
      "on-chain confirmation",
      `S4's deploy output had no parseable "Contract Deployed at <address>" line, so S5 cannot verify that\n` +
        `${path.relative(ROOT, DEPLOYED_CONTRACTS)}'s sepolia address (${parsed.address}) is from this run rather than a stale one.`
    );
  }
  if (normalizeHex(deployLogAddress) !== normalizeHex(parsed.address)) {
    sepoliaRed(
      5,
      "on-chain confirmation",
      `Freshness check failed: S4's deploy output reported ${deployLogAddress}, but\n` +
        `${path.relative(ROOT, DEPLOYED_CONTRACTS)}'s sepolia address is ${parsed.address}.\n` +
        `That file was not rewritten by this run — confirming it would validate a stale previous deploy, not this one.`
    );
  }
  info(`checking class hash at ${parsed.address}`);

  const result = await rpcJson(sepoliaRpcUrl, "starknet_getClassHashAt", ["latest", parsed.address]);
  if (result.transportError) {
    sepoliaInfra(
      5,
      "on-chain confirmation",
      `starknet_getClassHashAt against RPC_URL_SEPOLIA failed: ${result.message}\n` +
        `S4's deploy may well have succeeded but was not confirmed here — do not treat this as green. Re-run once the RPC is reachable.`
    );
  }
  if (result.rpcError) {
    sepoliaRed(5, "on-chain confirmation", `RPC reports no class at ${parsed.address} on Sepolia: ${result.message}.`);
  }
  if (!result.result || normalizeHex(result.result) === "0") {
    sepoliaRed(5, "on-chain confirmation", `starknet_getClassHashAt returned a zero class hash for ${parsed.address} on Sepolia.`);
  }
  ok(`class hash confirmed on-chain: ${result.result}`);
}

async function sepolia() {
  console.log(`stark-smoke-test: sepolia deploy gate (S1-S5)`);
  console.log(`repo: ${ROOT}`);
  console.log(`Opt-in, spends real STRK, separate from the 13-step devnet gate.`);

  const vars = await sepoliaStepPreflight();
  await sepoliaStepRpcIdentity();
  await sepoliaStepBalance(vars.ACCOUNT_ADDRESS_SEPOLIA);
  const deployLogAddress = await sepoliaStepDeploy();
  await sepoliaStepConfirm(deployLogAddress);

  console.log(`\n=========================================================`);
  console.log(`SEPOLIA GATE GREEN — S1-S5 all passed`);
  console.log(`=========================================================`);
  process.exit(0);
}

// ----------------------------------------------------------------- main ----

const argv = process.argv.slice(2);
const mode = argv.find((a) => !a.startsWith("-"));
const flags = { writeEnv: argv.includes("--write-env"), headed: argv.includes("--headed") };

if (mode === "up") await up(flags);
else if (mode === "down") await down();
else if (mode === "verify") {
  await verifyBrowser(flags);
  console.log(`\n=========================================================`);
  console.log(`STEPS 8-13 PASSED`);
  console.log(`=========================================================`);
  process.exit(0);
} else if (mode === "run") await runFull(flags);
else if (mode === "sepolia") await sepolia();
else {
  console.error(`stark-smoke-test — e2e devnet gate (13 steps: 1-7 process orchestration, 8-13 Chrome/CDP verification)

usage:
  node .claude/workflows/stark-smoke-test.mjs up [--write-env]
  node .claude/workflows/stark-smoke-test.mjs verify [--headed]
  node .claude/workflows/stark-smoke-test.mjs down
  node .claude/workflows/stark-smoke-test.mjs run [--write-env] [--headed]
  node .claude/workflows/stark-smoke-test.mjs sepolia

  up      preflight + bring devnet/deploy/dev-server up, then exit 0 leaving them RUNNING
          --write-env  consent up front to appending the devnet block to packages/snfoundry/.env
  verify  drive Chrome over CDP against an already-running stack (steps 8-13); exits non-zero on any failure
          --headed     launch Chrome visibly instead of headless, for debugging
  down    kill whatever \`up\` recorded and confirm ports ${DEVNET_PORT}/${NEXT_PORT} are released
  run     up -> verify -> down in one shot; the CI entry point. Exits non-zero if any of the 13 steps fail.
          On failure the stack is left running for debugging, same as \`up\`/\`verify\` alone.
  sepolia opt-in live-network deploy gate (S1-S5): declares/deploys against real Sepolia and confirms
          the class on-chain. Spends real STRK on every run. Exit 0 GREEN / 2 INFRA (yellow, does not
          block Phase 2, retryable) / 1 RED (blocks Phase 2). Separate from the 13-step devnet gate above.`);
  process.exit(2);
}
