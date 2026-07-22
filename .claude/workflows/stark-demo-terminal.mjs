#!/usr/bin/env node
/**
 * stark-demo-terminal — record a terminal GIF of the Sepolia deploy gate.
 *
 * Wraps `node .claude/workflows/stark-smoke-test.mjs sepolia` in an
 * asciinema recording, converts it to a GIF with agg, and writes a proof
 * block (contract address, on-chain class hash, Starkscan link, branch +
 * commit, GIF duration vs. real run time) alongside it.
 *
 *   node .claude/workflows/stark-demo-terminal.mjs --branch <branch-name>
 *
 * The GIF is not the proof — a screen recording can show anything and a
 * reviewer cannot verify it. The proof block is: it is built from what the
 * Sepolia gate itself printed on screen (the on-chain class-hash check in
 * S5), and it names the tx-independent facts a reviewer *can* check
 * (contract address, class hash, Starkscan link).
 *
 * `--branch` is mandatory and is cross-checked against the actual checked
 * out branch. A previous demo recording (scaffold-stylus) was made on the
 * wrong branch (main, older than the fix it claimed to show) and looked
 * completely legitimate on playback — nothing in the artifact identified
 * its origin. This script refuses to record until the operator states,
 * up front, which branch this is supposed to prove, and it will not record
 * a mismatch silently.
 *
 * Plain Node ESM, builtins only. This is a template repo: every dependency
 * added here is inherited by every fork and by create-stark.
 */

import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT_DIR = path.join(ROOT, ".smoke-test-logs", "demo-gif");
const SMOKE_TEST_SCRIPT = path.join(ROOT, ".claude", "workflows", "stark-smoke-test.mjs");
const ENV_FILE = path.join(ROOT, "packages", "snfoundry", ".env");

// Real Sepolia declare+deploy can take minutes; agg's default 5s idle-time-limit
// would compress that wait down and make the GIF's duration lie about how long
// the run actually took. Set it far above any plausible gate runtime instead.
const AGG_IDLE_TIME_LIMIT_SECS = 3600;

function usage() {
  console.error(`Usage: node .claude/workflows/stark-demo-terminal.mjs --branch <branch-name>

Records "node .claude/workflows/stark-smoke-test.mjs sepolia" with asciinema,
converts it to a GIF, and writes a proof block next to it in
.smoke-test-logs/demo-gif/. Spends real STRK — see the Sepolia gate's own
docs (.claude/skills/stark-smoke-test/SKILL.md) before running.

--branch is mandatory and must equal the branch currently checked out here.
This is a deliberate refusal, not a default: a demo recorded against the
wrong branch looks identical to one recorded against the right one.`);
}

function git(args) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

function parseArgs(argv) {
  let branch = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--branch") {
      branch = argv[i + 1] ?? null;
      i++;
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      usage();
      process.exit(0);
    }
  }
  return { branch };
}

function requireDeclaredBranch(declared) {
  if (!declared) {
    console.error("REFUSED: no --branch given — this script will not guess which branch it's proving.\n");
    usage();
    process.exit(1);
  }
  let actual;
  try {
    actual = git(["symbolic-ref", "--short", "-q", "HEAD"]);
  } catch {
    console.error(
      `REFUSED: HEAD is detached — there is no branch name to cross-check --branch ${declared} against.\n` +
        `Check out ${declared} by name before recording.`
    );
    process.exit(1);
  }
  if (actual !== declared) {
    console.error(
      `REFUSED: --branch ${declared} does not match the branch actually checked out here (${actual}).\n` +
        `This is the exact failure mode this check exists to catch — fix one or the other before recording.`
    );
    process.exit(1);
  }
  return actual;
}

function requireSepoliaVarsPresent() {
  // Belt-and-suspenders: the sepolia gate itself checks this too (and exits
  // INFRA if missing), but failing here means a wrapper-side error, not a
  // mid-recording gate exit, and it lets us skip the cast/agg pipeline
  // entirely when there's obviously nothing to prove.
  let envText;
  try {
    envText = fs.readFileSync(ENV_FILE, "utf8");
  } catch {
    envText = "";
  }
  for (const name of ["PRIVATE_KEY_SEPOLIA", "ACCOUNT_ADDRESS_SEPOLIA", "RPC_URL_SEPOLIA"]) {
    const m = envText.match(new RegExp(`^${name}=(.+)$`, "m"));
    if (!m || !m[1].trim()) {
      console.error(
        `REFUSED: ${name} is missing/empty in ${path.relative(ROOT, ENV_FILE)}.\n` +
          `The sepolia gate would exit INFRA immediately — nothing to record.`
      );
      process.exit(1);
    }
  }
}

function sh(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", ...opts });
  if (result.error) {
    throw new Error(`${cmd} ${args.join(" ")} failed to spawn: ${result.error.message}`);
  }
  return result;
}

function assertOnPath(bin, versionArgs = ["--version"]) {
  const result = sh(bin, versionArgs);
  if (result.status !== 0 && result.error) {
    console.error(`REFUSED: \`${bin}\` not found on PATH. Install it before recording.`);
    process.exit(1);
  }
}

/** Parses the RPC_URL_SEPOLIA value straight from .env for the post-hoc redaction grep. Never printed. */
function readSepoliaRpcUrl() {
  const envText = fs.readFileSync(ENV_FILE, "utf8");
  const m = envText.match(/^RPC_URL_SEPOLIA=(.+)$/m);
  return m ? m[1].trim() : null;
}

function main() {
  const { branch } = parseArgs(process.argv.slice(2));
  const actualBranch = requireDeclaredBranch(branch);
  requireSepoliaVarsPresent();
  assertOnPath("asciinema");
  assertOnPath("agg");
  assertOnPath("ffmpeg");

  const commitFull = git(["rev-parse", "HEAD"]);
  const commitShort = git(["rev-parse", "--short", "HEAD"]);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const slug = `sepolia-gate-${actualBranch.replace(/[^a-zA-Z0-9._-]+/g, "_")}-${commitShort}`;
  const castFile = path.join(OUT_DIR, `${slug}.cast`);
  const gifFile = path.join(OUT_DIR, `${slug}.gif`);
  const txtFile = path.join(OUT_DIR, `${slug}.txt`);
  const proofFile = path.join(OUT_DIR, `${slug}-proof.txt`);

  const banner =
    `printf '=== stark-demo-terminal ===\\nbranch: %s\\ncommit: %s\\nrecorded: this is a live run, real STRK will be spent\\n===========================\\n\\n' ` +
    `${shQuote(actualBranch)} ${shQuote(commitFull)}`;
  const recordedCommand =
    `${banner}; node ${shQuote(SMOKE_TEST_SCRIPT)} sepolia; printf '\\n[stark-demo-terminal] gate exited %s\\n' "$?"`;

  console.log(`stark-demo-terminal: recording node .claude/workflows/stark-smoke-test.mjs sepolia`);
  console.log(`branch: ${actualBranch}`);
  console.log(`commit: ${commitFull}`);
  console.log(`cast:   ${path.relative(ROOT, castFile)}`);
  console.log(`This spends real STRK and can take several minutes. Recording now...\n`);

  const startedAt = Date.now();
  const record = sh("asciinema", ["record", "--overwrite", "--command", recordedCommand, castFile]);
  const realDurationSecs = (Date.now() - startedAt) / 1000;

  if (record.status !== 0) {
    console.error(`REFUSED: asciinema record exited ${record.status}.`);
    console.error(record.stderr || record.stdout || "(no output captured)");
    process.exit(1);
  }
  console.log(`\nRecording complete (${realDurationSecs.toFixed(1)}s wall clock). Converting...`);

  // Plain-text transcript is the single source for both the redaction check
  // and the proof-block fields below — it's exactly what the GIF shows, so
  // there is no separate parse path that could drift from what's on screen.
  const convert = sh("asciinema", ["convert", "-f", "txt", "--overwrite", castFile, txtFile]);
  if (convert.status !== 0) {
    console.error(`REFUSED: asciinema convert to txt exited ${convert.status}.`);
    console.error(convert.stderr || convert.stdout || "(no output captured)");
    process.exit(1);
  }
  const transcript = fs.readFileSync(txtFile, "utf8");

  // --- redaction check: must run before the GIF is treated as publishable ---
  const rpcUrl = readSepoliaRpcUrl();
  if (rpcUrl && transcript.includes(rpcUrl)) {
    console.error(
      `STOP: RPC_URL_SEPOLIA leaked into the recorded transcript (${path.relative(ROOT, txtFile)}).\n` +
        `Not converting to GIF, not writing a proof block. Delete ${path.relative(ROOT, castFile)} and ` +
        `${path.relative(ROOT, txtFile)}, then find where the gate printed it before re-recording.`
    );
    process.exit(1);
  }

  // agg has no --overwrite flag (unlike asciinema) — it just refuses to write over nothing, so clear stale output first.
  fs.rmSync(gifFile, { force: true });
  const agg = sh("agg", ["--idle-time-limit", String(AGG_IDLE_TIME_LIMIT_SECS), castFile, gifFile]);
  if (agg.status !== 0) {
    console.error(`REFUSED: agg exited ${agg.status}.`);
    console.error(agg.stderr || agg.stdout || "(no output captured)");
    process.exit(1);
  }

  // Second redaction pass on the actual artifact being handed off, per the
  // brief: grep the GIF too, don't just trust the transcript it was built from.
  const gifBytes = fs.readFileSync(gifFile);
  if (rpcUrl && gifBytes.includes(Buffer.from(rpcUrl))) {
    console.error(`STOP: RPC_URL_SEPOLIA found inside the rendered GIF bytes (${path.relative(ROOT, gifFile)}). Deleting it.`);
    fs.unlinkSync(gifFile);
    process.exit(1);
  }

  const gifDurationSecs = probeGifDurationSecs(gifFile);
  const gateExitMatch = transcript.match(/\[stark-demo-terminal\] gate exited (\d+)/);
  const gateExit = gateExitMatch ? Number(gateExitMatch[1]) : null;
  const gateGreen = /SEPOLIA GATE GREEN/.test(transcript);

  const addressMatch = transcript.match(/checking class hash at (0x[0-9a-fA-F]+)/);
  const classHashMatch = transcript.match(/class hash confirmed on-chain:\s*(0x[0-9a-fA-F]+)/);

  const durationDeltaPct =
    gifDurationSecs != null ? (Math.abs(gifDurationSecs - realDurationSecs) / realDurationSecs) * 100 : null;

  const lines = [];
  lines.push(`STARK-DEMO-TERMINAL PROOF BLOCK`);
  lines.push(`================================`);
  lines.push(`branch:        ${actualBranch}`);
  lines.push(`commit:        ${commitFull}`);
  lines.push(`gate exit:     ${gateExit === null ? "unknown (see transcript)" : gateExit} (0=GREEN, 2=INFRA, 1=RED)`);
  lines.push(`gate result:   ${gateGreen ? "SEPOLIA GATE GREEN" : "NOT GREEN — see transcript, do not treat as proof of a working deploy"}`);
  if (gateGreen && addressMatch) {
    const addr = addressMatch[1];
    lines.push(`contract:      ${addr}`);
    lines.push(`starkscan:     https://sepolia.starkscan.co/contract/${addr}`);
  } else {
    lines.push(`contract:      NOT AVAILABLE (gate did not reach S5 / did not confirm on-chain)`);
  }
  lines.push(`class hash:    ${gateGreen && classHashMatch ? classHashMatch[1] : "NOT AVAILABLE (gate did not confirm on-chain)"}`);
  lines.push(`gif duration:  ${gifDurationSecs == null ? "unknown (ffprobe failed)" : gifDurationSecs.toFixed(1) + "s"}`);
  lines.push(`real duration: ${realDurationSecs.toFixed(1)}s`);
  lines.push(
    `duration delta:${durationDeltaPct == null ? " unknown" : ` ${durationDeltaPct.toFixed(1)}%`}` +
      (durationDeltaPct != null && durationDeltaPct >= 10 ? "  *** EXCEEDS 10% TOLERANCE ***" : "")
  );
  lines.push(`gif:           ${path.relative(ROOT, gifFile)}`);
  lines.push(`transcript:    ${path.relative(ROOT, txtFile)}`);
  lines.push(`cast:          ${path.relative(ROOT, castFile)}`);
  lines.push(``);
  lines.push(`The GIF is illustrative only. A screen recording cannot be verified by a`);
  lines.push(`reviewer; the fields above (contract address, on-chain class hash,`);
  lines.push(`Starkscan link, branch/commit) can be. Verify independently at the`);
  lines.push(`Starkscan link before treating this as a passed gate.`);
  lines.push(``);

  const proofBlock = lines.join("\n");
  fs.writeFileSync(proofFile, proofBlock);

  console.log(`\n${proofBlock}`);
  console.log(`Proof block written to ${path.relative(ROOT, proofFile)}`);

  if (!gateGreen) {
    console.error(`\nNOTE: the sepolia gate did not go GREEN this run — the GIF/proof above document that, not a successful deploy.`);
    process.exit(gateExit && gateExit > 0 ? gateExit : 1);
  }
}

function shQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

/** Parses ffmpeg's stderr "Duration: HH:MM:SS.ms" line — ffprobe isn't guaranteed to be a separate binary alongside ffmpeg. */
function probeGifDurationSecs(gifFile) {
  const result = spawnSync("ffmpeg", ["-i", gifFile], { encoding: "utf8" });
  const text = `${result.stdout || ""}${result.stderr || ""}`;
  const m = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const [, hh, mm, ss] = m;
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
}

main();
