---
name: stark-smoke-test
description: Use after Phase 1 dependency updates are merged, before any Phase 2 propagation to sibling forks - runs the end-to-end devnet gate (up brings devnet/deploy/dev-server up, verify drives Chrome over raw CDP to exercise the app, run does both plus teardown) and reports a green or red gate.
---

# stark-smoke-test — e2e gate between Phase 1 and Phase 2

Prove the stack actually works end-to-end on devnet before propagating anything
to sibling forks. **A red gate blocks Phase 2.**

All 13 steps are now fully automated — no manual Chrome driving. Steps 1–7
bring the stack up (process orchestration); steps 8–13 drive a real Chrome
instance over the Chrome DevTools Protocol (CDP), the same transport Chrome
DevTools itself uses. Zero new dependencies: Node's native `WebSocket` global
is the CDP transport, and pages are driven with `Runtime.evaluate` running JS
inside the page (`querySelector` / `.click()` / `textContent`) — never
synthetic mouse coordinates, which break on any layout change.

## Scope

This repo only. The 13-step gate above is devnet-only — mainnet is out of
scope entirely. Sepolia has its own separate, opt-in gate (below); it is not
step 14 of the devnet gate and a devnet green remains a devnet green
regardless of whether Sepolia has been run. **Do not touch sibling repos** —
that is Phase 2.

## Sepolia gate (opt-in, S1-S5)

Design: `docs/superpowers/specs/2026-07-22-sepolia-deploy-gate-design.md`

The devnet gate proves the stack works against `starknet-devnet`. It does not
prove a real declare+deploy would succeed against a live sequencer — fee
estimation, class-hash rules, RPC version negotiation and sequencer admission
all differ. This command proves that against real Sepolia, without letting
infrastructure flake (a rate limit, an unfunded account, a slow RPC)
masquerade as a code failure.

```bash
node .claude/workflows/stark-smoke-test.mjs sepolia
```

It spawns no long-lived processes — no `up`/`down` lifecycle, no
orphaned-process risk. It runs S1 through S5, reports, and exits.

**Real STRK is spent on every run.** The command is opt-in partly for this
reason — never run it as part of a routine gate check without the operator
asking for it.

**Three-way exit code contract** — this is not pass/fail like the devnet gate:

| Exit | Meaning | Effect on Phase 2 |
| --- | --- | --- |
| `0` | GREEN — declared, deployed, and confirmed on-chain | unblocked |
| `2` | INFRA (yellow) — unconfigured, unfunded, unreachable RPC, timeout, 429 | **does not block**; retryable |
| `1` | RED — chain-id mismatch, a real declare/deploy rejection, or no class on-chain | **blocks** |

An INFRA exit is explicitly not a code failure — do not report it as a red
gate, and do not retry-loop it blindly; read what S1–S5 printed and fix the
named cause (fund the account, fix the RPC URL, wait out the rate limit).

**The five steps:**

- **S1 — preflight.** Reuses the devnet toolchain check, then requires
  `PRIVATE_KEY_SEPOLIA`, `ACCOUNT_ADDRESS_SEPOLIA`, `RPC_URL_SEPOLIA` to be
  present and non-empty in `packages/snfoundry/.env`. Missing → INFRA. This
  gate **never writes to `.env`** and never offers to — unlike the devnet
  step, these are not public fixture keys.
- **S2 — RPC identity.** `starknet_chainId` against `RPC_URL_SEPOLIA` must
  answer `SN_SEPOLIA`. A different chain id is RED (the operator is pointed at
  the wrong network — deploying would be actively wrong); a connection error,
  timeout, 429, or 5xx is INFRA.
- **S3 — fee balance.** `balanceOf` on the STRK fee token for
  `ACCOUNT_ADDRESS_SEPOLIA`, compared against a documented minimum. Below the
  minimum is INFRA — this is the single most likely cause of a false red gate,
  so it is caught before spending a real declare/deploy on it.
- **S4 — deploy.** `yarn deploy --network sepolia`, logged to
  `.smoke-test-logs/deploy-sepolia.log`, on a timeout far longer than the
  devnet deploy (Sepolia block times are slower). A timeout is INFRA; an
  actual declare/deploy rejection reported by the tooling is RED.
- **S5 — on-chain confirmation.** The proof step — S4 exiting 0 only means the
  deploy script believed it succeeded. Parses the Sepolia entry out of
  `packages/nextjs/contracts/deployedContracts.ts` and calls
  `starknet_getClassHashAt` against that address. A non-zero class hash is
  GREEN; an absent address or "no class at that address" is RED; an
  unreachable RPC at this point is INFRA — **and the message says explicitly
  that the deploy may well have succeeded but was not confirmed.** Never
  report green here.

**Side effect to know about:** `packages/nextjs/contracts/deployedContracts.ts`
is modified by S4 (the Sepolia entry is added or updated). This is correct
behavior — the script prints that the file changed and leaves
commit-or-revert to the operator. It does not silently revert or stash the
working tree.

**Secret hygiene:** `RPC_URL_SEPOLIA` contains an API key. Never paste it into
a report, a commit message, or anywhere else the raw output goes — the script
itself redacts it from everything it prints to stdout, so a pasted log cannot
leak it.

**Reporting rule for this gate** matches the devnet gate's: report each of
S1–S5 as `PASSED`, `FAILED`, or `NOT RUN`. If the run stops at S3, S4–S5 are
`NOT RUN` — not passes. Never collapse the run into "Sepolia passed" unless
all five steps actually executed and were observed.

## Commands

```bash
node .claude/workflows/stark-smoke-test.mjs up [--write-env]      # steps 1-7, leaves stack RUNNING
node .claude/workflows/stark-smoke-test.mjs verify [--headed]     # steps 8-13, against an already-running stack
node .claude/workflows/stark-smoke-test.mjs down                  # kills what `up` recorded
node .claude/workflows/stark-smoke-test.mjs run [--write-env] [--headed]  # up -> verify -> down; the CI entry point
```

`run` is the one-shot gate: it exits non-zero if any of the 13 steps fail, and
on a full pass it tears the stack down itself. On failure — at any step, 1
through 13 — the stack (devnet, dev server) is deliberately left running so the
operator can inspect it, exactly like `up` alone. Chrome is different: it
belongs entirely to `verify`, so it is always killed (including on the failure
path), and its temp profile directory is always removed.

`--headed` launches Chrome visibly instead of headless — useful when debugging
a selector or a hung wallet-connect locally. `verify` picks its own CDP
debugging port (9333) and checks it is free first, the same way `up` checks
5050/3000.

## Step A — bring the stack up (steps 1–7)

```bash
node .claude/workflows/stark-smoke-test.mjs up
```

This exits 0 with devnet and the dev server **still running**, and prints their
PIDs and log paths. Do not background it, do not race it — it does its own
readiness polling and only exits when the stack answers.

**If it stops at step 3** (the three devnet vars missing or commented out in
`packages/snfoundry/.env`) that is a correct, expected result on a fresh
checkout: the devnet block ships commented out in `.env.example`. The script
prints the exact block to paste and offers to write it. Never edit a user's
`.env` silently — either let them paste it, confirm the prompt, or re-run with
`--write-env` once they have agreed.

**If any step 1–7 fails**, the script leaves the stack alive on purpose and
prints which step failed with verbatim output. Read the named log
(`.smoke-test-logs/devnet.log`, `deploy.log`, `next.log`) — do not re-run
blindly, and do not report a generic "deploy failed".

## Step B — verify in Chrome over CDP (steps 8–13)

```bash
node .claude/workflows/stark-smoke-test.mjs verify
```

Launches headless Chrome on an isolated temp profile (never the operator's real
browser data), opens a tab, and drives it over CDP:

**Step 8 — load the app.** Navigates to `http://localhost:3000`, waits for the
load event, and confirms the tab actually landed there (not a
`chrome-error://` page, which is how "dev server is down" surfaces). Console
`error`-type messages and uncaught exceptions are hard failures; console
warnings only fail if they mention the RPC, the provider, or a contract — plain
Next.js dev/hydration noise does not. Any failed (4xx/5xx or connection-level)
request to `127.0.0.1:5050` is also a fail.

**Step 9 — Debug Contracts + burner wallet.** Navigates to
`http://localhost:3000/debug`, clicks the Connect button
(`label[for="connect-modal"]`), clicks "Burner Wallet", clicks the first
predeployed account, and polls the wallet dropdown summary
(`details summary`) for a connected-address string.

**Step 10 — read a contract value.** Reads the `greeting` value off
`YourContract` on the Read tab (the `DisplayVariable.tsx` layout: an `<h3>`
with the function name, value in the following `.break-all.block.transition`
div) and records it.

**Step 11 — send one write transaction.** Switches to the Write tab, fills the
`set_greeting` `new_greeting` input (via the native `HTMLInputElement` value
setter + a dispatched `input` event, since it's a React-controlled input),
clicks that form's "Send 💸" button, and polls the page for the
`useTransactor` success toast text ("Transaction completed successfully!") —
never proceeds on "pending".

**Step 12 — read the value again.** Re-reads `greeting`; it must differ from
step 10. Unchanged is a fail even if the transaction reported success — that is
the whole point of doing a write.

**Step 13 — screenshots.** Confirms all six screenshots from steps 8–13 were
written to `.smoke-test-logs/` (`08-app-loaded.png` through `13-final.png`).

Every wait has a timeout; on timeout the failure names what it was waiting for
and for how long. A step failure prints in the same
`SMOKE TEST FAILED AT STEP N/13` format as steps 1–7, with verbatim detail —
never a generic message.

Selectors live in `.claude/workflows/stark-smoke-test.mjs` (steps 8–13) and
were read off the real rendered DOM, not guessed. If the UI changes and a
selector goes stale, re-inspect the live DOM before editing it — do not guess a
replacement.

## Step C — tear down

```bash
node .claude/workflows/stark-smoke-test.mjs down
```

Safe to run twice and safe when nothing is up. It kills what `up` recorded and
confirms ports 5050 and 3000 were actually released.

## Pass / fail

Pass requires **all 13 steps**. Any failing step means a **RED GATE** and Phase
2 is blocked. `run`'s exit code is the gate: `0` means all 13 steps passed and
the stack was torn down; non-zero means read the printed step number and
verbatim output.

## Reporting rule — hard rule

The report must distinguish **"ran and passed"** from **"did not run"**. Any
skipped step must be stated explicitly. Silence must never be mistakable for
coverage.

Report each of the 13 steps as one of: `PASSED`, `FAILED`, or `NOT RUN`. If you
stopped at step 6, steps 7–13 are `NOT RUN` — they are not passes, and the gate
is red. Do not summarise 13 steps as "smoke test passed" unless all 13 were
actually executed and observed.
