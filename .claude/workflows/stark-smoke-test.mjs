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

const REQUIRED_DEVNET_VARS = ["PRIVATE_KEY_DEVNET", "RPC_URL_DEVNET", "ACCOUNT_ADDRESS_DEVNET"];

/** .tool-versions name -> how to ask the installed binary for its version. */
const TOOLCHAIN = {
  scarb: { bin: "scarb", args: ["--version"] },
  "starknet-foundry": { bin: "snforge", args: ["--version"] },
  "starknet-devnet": { bin: "starknet-devnet", args: ["--version"] },
};

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
  if (!state || !state.processes?.length) {
    console.error(`\nNothing was left running.`);
    return;
  }
  console.error(`\nThe stack was left RUNNING on purpose so you can debug it:`);
  for (const p of state.processes) {
    console.error(`  ${p.name.padEnd(7)} pid ${p.pid}  log: ${p.log}`);
  }
  console.error(`\nTear down with:`);
  console.error(`  node .claude/workflows/stark-smoke-test.mjs down`);
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

async function up(flags) {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const existing = readState();
  if (existing?.processes?.some((p) => alive(p.pid))) {
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

  // Killing a pid is not the same as the port being free again.
  const stillBusy = [];
  for (const port of [DEVNET_PORT, NEXT_PORT]) {
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

// ----------------------------------------------------------------- main ----

const argv = process.argv.slice(2);
const mode = argv.find((a) => !a.startsWith("-"));
const flags = { writeEnv: argv.includes("--write-env") };

if (mode === "up") await up(flags);
else if (mode === "down") await down();
else {
  console.error(`stark-smoke-test — e2e devnet gate (steps 1-7; steps 8-13 are agent-side)

usage:
  node .claude/workflows/stark-smoke-test.mjs up [--write-env]
  node .claude/workflows/stark-smoke-test.mjs down

  up     preflight + bring devnet/deploy/dev-server up, then exit 0 leaving them RUNNING
         --write-env  consent up front to appending the devnet block to packages/snfoundry/.env
  down   kill whatever \`up\` recorded and confirm ports ${DEVNET_PORT}/${NEXT_PORT} are released`);
  process.exit(2);
}
