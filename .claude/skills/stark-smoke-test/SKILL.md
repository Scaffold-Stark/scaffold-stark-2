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

This repo only, devnet only. Sepolia and mainnet are out of scope — they need
funded accounts and live external RPC, and one rate-limit would produce a false
red gate that trains people to ignore this skill. **Do not touch sibling repos**
— that is Phase 2.

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
