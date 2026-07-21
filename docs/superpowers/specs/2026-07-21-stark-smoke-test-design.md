# stark-smoke-test — e2e gate between Phase 1 and Phase 2

**Date:** 2026-07-21
**Status:** Approved design (spec only — not yet implemented)

## Purpose

After Phase 1 dependency updates are merged, prove the stack actually works
end-to-end on devnet before propagating anything to sibling forks in Phase 2.
A red gate blocks Phase 2.

## Scope

This repo only, devnet only.

Sepolia and mainnet are explicitly out of scope — they need funded accounts and
live external RPC, and one rate-limit would produce a false red gate that trains
people to ignore the skill.

Sibling repos are Phase 2 and must not be touched.

## Artifacts

| Path | Role |
| --- | --- |
| `.claude/skills/stark-smoke-test/SKILL.md` | Agent-facing instructions |
| `.claude/workflows/stark-smoke-test.mjs` | Orchestration script |

## Division of responsibility

This is the core design decision. Deterministic process orchestration goes to
the script because agents guess "it's probably up by now" and continue too
early, producing false failures. Judgment ("is this page actually correct")
goes to the agent because a script cannot answer it.

**Script owns:** preflight env + port checks, spawning devnet, polling
readiness, running deploy, capturing output, spawning the dev server, writing
PIDs and logs, teardown.

**Agent owns:** driving Chrome, reading console and network, connecting the
burner wallet, reading contract values, sending a write transaction, confirming
state changed, scoring pass/fail, screenshots.

## Script modes

Two modes, so that no orphan processes are created:

```bash
node .claude/workflows/stark-smoke-test.mjs up     # bring up stack, exit 0 when ready
node .claude/workflows/stark-smoke-test.mjs down   # kill everything via recorded PIDs
```

The script must **not** kill its children when `up` exits. It records PIDs to
`.smoke-test-state.json` (which must be gitignored). This is what makes it
possible to keep processes alive on failure yet still tear down cleanly
afterward.

## Flow — 13 steps

### Preflight (script; fail fast before wasting time)

1. Verify `.tool-versions` matches the actually-installed binaries
   (`scarb --version`, `snforge --version`, `starknet-devnet --version`).
   A mismatch is reported immediately, because the toolchain is exactly what
   Phase 1 just bumped.
2. Verify ports `5050` and `3000` are free.
3. Verify `packages/snfoundry/.env` contains the three devnet variables
   **uncommented**: `PRIVATE_KEY_DEVNET`, `RPC_URL_DEVNET`,
   `ACCOUNT_ADDRESS_DEVNET`.
   Note: in `.env.example` the entire devnet block ships commented out, so this
   is a genuine and common failure. On failure the script **stops** and prints
   the exact block to paste, and **offers** to write it — it must never silently
   modify a user's `.env`.

### Bring-up (script)

4. Run `yarn chain` in the background; poll `http://127.0.0.1:5050/is_alive`
   until ready.
5. Parse the predeployed account list from devnet startup output and cross-check
   it against `ACCOUNT_ADDRESS_DEVNET` in `.env`; on mismatch, fail with a clear
   message.

   **Rationale (do not drop this):** a devnet bump can change the default
   account class, making the seed-0 address drift from `.env.example`. That is
   precisely the class of breakage this gate exists to catch, and without this
   check it would surface later as a confusing "deploy failed".
6. Run `yarn deploy`; confirm `deployedContracts.ts` was actually regenerated
   (compare mtime and confirm a class hash is present).
7. Start `yarn start` in the background; poll `:3000` until ready.

### Verification (agent, via Chrome)

8. Open `:3000` — no console errors, no failed RPC calls.
9. Go to Debug Contracts, connect the burner wallet.
10. Read a contract value.
11. Send one write transaction; wait for confirmation.
12. Read the value again — it must have changed.
13. Capture screenshots of the key steps.

## Pass / fail

Pass requires all 13 steps. Any failing step means a **red gate** and Phase 2 is
blocked.

**On failure:** keep devnet and the dev server **alive** for debugging; print
the concrete PIDs, print the exact teardown command, print log paths
(`devnet.log`, `deploy.log`, `next.log`), and state **which step** failed with
verbatim output — never summarize to something like "deploy failed".

**On pass:** run teardown automatically and confirm the ports were released.

## Reporting rule (hard rule)

The report must distinguish "ran and passed" from "did not run". Any skipped
step must be stated explicitly. Silence must never be mistakable for coverage.

## Rejected alternatives

- **Pure markdown skill, no script.** Process orchestration would depend on the
  agent guessing readiness, causing false failures.
- **Playwright e2e committed to the repo.** This is a template repo, so a heavy
  dev-dependency would be inherited by every fork and by `create-stark`. The cost
  is disproportionate to an internal gate run a few times per update cycle.
- **Including Sepolia in the gate.** Depends on a funded account and live
  external RPC; flakiness would erode trust in the gate.
