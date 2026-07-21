---
name: stark-smoke-test
description: Use after Phase 1 dependency updates are merged, before any Phase 2 propagation to sibling forks - runs the end-to-end devnet gate (script brings up devnet/deploy/dev-server, agent verifies the app in Chrome) and reports a green or red gate.
---

# stark-smoke-test — e2e gate between Phase 1 and Phase 2

Prove the stack actually works end-to-end on devnet before propagating anything
to sibling forks. **A red gate blocks Phase 2.**

## Scope

This repo only, devnet only. Sepolia and mainnet are out of scope — they need
funded accounts and live external RPC, and one rate-limit would produce a false
red gate that trains people to ignore this skill. **Do not touch sibling repos**
— that is Phase 2.

## Division of responsibility

The script owns deterministic process orchestration, because agents guess "it's
probably up by now" and continue too early, producing false failures. You own
judgment — "is this page actually correct" — because a script cannot answer it.

| Steps | Owner | What |
| --- | --- | --- |
| 1–7 | script | preflight, devnet, deploy, dev server |
| 8–13 | you | Chrome verification |

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

## Step B — verify in Chrome (steps 8–13)

Use the `mcp__claude-in-chrome__*` tools. Load them in **one** `ToolSearch`
call:

```
select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__tabs_create_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__read_console_messages,mcp__claude-in-chrome__read_network_requests
```

Call `tabs_context_mcp` first, then `tabs_create_mcp` for a fresh tab. Do not
reuse tab IDs from an earlier session.

**Step 8 — load the app.** Navigate to `http://localhost:3000`. Then:
- `read_console_messages` — there must be **no** console errors. Hydration
  warnings and Next.js dev noise are not passes; read them and judge. Any error
  mentioning the RPC, the provider, or a contract is a fail.
- `read_network_requests` — there must be **no** failed calls to
  `127.0.0.1:5050`. A 4xx/5xx or a connection error to devnet is a fail.

**Step 9 — Debug Contracts + burner wallet.** Navigate to
`http://localhost:3000/debug`. Connect the wallet using the burner wallet
connector (Burner Wallet / one of the predeployed devnet accounts). Confirm the
UI shows a connected address. If the connect modal never resolves, that is a
fail — capture the console output.

**Step 10 — read a contract value.** On the Debug Contracts page, pick a read
function on the deployed contract and call it. Record the exact value returned.

**Step 11 — send one write transaction.** Call a write function that changes the
value you just read. Approve it in the burner wallet flow. Wait for the
transaction to be confirmed — do not proceed on "pending".

**Step 12 — read the value again.** It **must** have changed relative to step
10. Unchanged is a fail even if the transaction reported success: that is the
whole point of doing a write.

**Step 13 — screenshots.** Capture the key steps: the loaded app, the connected
wallet, the value before, the transaction confirmation, and the value after.

## Step C — tear down

```bash
node .claude/workflows/stark-smoke-test.mjs down
```

Safe to run twice and safe when nothing is up. It kills what `up` recorded and
confirms ports 5050 and 3000 were actually released.

- **On pass:** tear down and confirm the ports were released.
- **On failure:** leave the stack running for debugging, and report the PIDs,
  the log paths, and the exact teardown command above so the operator can clean
  up when done.

## Pass / fail

Pass requires **all 13 steps**. Any failing step means a **RED GATE** and Phase
2 is blocked.

When reporting a failure, state **which step** failed and include the verbatim
output. Never collapse it to something like "deploy failed". If there is an error (or an expected failure), say so in your signal done/blocked message so the captain can check tu11aa/squadrant and file it. Don't file issues from the crew.

## Reporting rule — hard rule

The report must distinguish **"ran and passed"** from **"did not run"**. Any
skipped step must be stated explicitly. Silence must never be mistakable for
coverage.

Report each of the 13 steps as one of: `PASSED`, `FAILED`, or `NOT RUN`. If you
stopped at step 6, steps 7–13 are `NOT RUN` — they are not passes, and the gate
is red. Do not summarise 13 steps as "smoke test passed" unless all 13 were
actually executed and observed.
