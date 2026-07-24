---
name: stark-cdp-with-wallet
description: Use when a task needs a real Braavos wallet driven end-to-end (unlock, connect, approve a transaction) against a live network like Starknet Sepolia, without a human clicking the extension popup. Triggers on requests to automate Braavos, drive a real wallet transaction, or record a browser demo that needs a connected wallet.
---

# stark-cdp-with-wallet

## Overview

Proving the frontend half of a real Sepolia deploy needs an actual Braavos
wallet extension connected and signing — `stark-smoke-test`'s devnet gate
only exercises the burner wallet, never a real extension. This skill closes
that gap with raw Chrome DevTools Protocol over WebSocket, **zero npm
dependencies**, matching the in-repo precedent
`.claude/skills/stark-smoke-test/stark-smoke-test-browser.mjs` (same CDP
client shape, same `waitFor`/`openTab`/`connectSession` idiom).

This is an extraction, not a rewrite: every function here used to live
inline in `stark-demo-web.mjs` (formerly `.claude/workflows/`). Splitting it
out mirrors scaffold-stylus's `cdp-with-wallet` skill
(`.claude/skills/cdp-with-wallet/` at `origin/release/v0.2.0` in
scaffold-stylus) — same shape (`launch.mjs` for Chrome/profile management,
a wallet-primitives file for unlock/connect/approve), adapted for Braavos
instead of MetaMask. The blueprint technique for both is an internal
Playwright e2e helper's `braavos.ts`: enumerate CDP targets from
`GET http://localhost:<port>/json`, find the extension's own page by URL
prefix, attach a WebSocket directly to it. Only the *technique* carries
over — Braavos and MetaMask have different selectors, different popup
shapes (a side-panel singleton vs. a fresh `notification.html` popup per
request), and different discovery protocols (Wallet Standard vs. EIP-6963).

## Files

```
.claude/skills/stark-cdp-with-wallet/
  SKILL.md      this file
  launch.mjs    Chrome launcher against the PERSISTENT debug profile
                (Braavos already installed there), CDP port/target helpers,
                profile-lock detection
  braavos.mjs   Keychain password read, wallet setup-state check, unlock(),
                and approveBraavosRequest() (connect + tx-confirm — Braavos
                renders both through the same side-panel component)
```

`stark-demo-web.mjs` (`.claude/skills/stark-demo-video/`) is the only current
caller — it imports these primitives and supplies the app-specific parts
(clicking this app's own "Connect Wallet" button, reading `deployedContracts.ts`,
screencast/MP4 assembly). That split follows the same boundary as
scaffold-stylus's `cdp-with-wallet` vs. `demo-video`: this skill only knows
how to drive Braavos's own extension pages; it has no opinion about the
dapp under test.

## Can-do / cannot-do

| Can do | Cannot do |
|---|---|
| Unlock an already-initialised Braavos vault given its password, via CDP `Input.insertText` (never the page's own `HTMLInputElement` value setter, which some wallet UIs scuttle) | Create a wallet, import a seed phrase, or otherwise initialise a vault — by design, not a limitation |
| Distinguish "not set up" from "locked"/"unlocked" from real `chrome.storage.local` evidence (`checkWalletSetupState`), not from the popup's password-field signal alone (both states show no password field) | Guarantee any *other* extension's popups are automatable the same way — only this Braavos build's (4.19.6) side-panel shape has been reasoned about here |
| Approve a connect or transaction-confirm request by finding and clicking its real button via CDP DOM search — structural queries first (locale-proof), text-word fallback only once structural search is measured to find nothing | Read or validate what a transaction actually does before approving it — `approveBraavosRequest` clicks the primary action, it does not decide whether confirming is safe. Isolation (testnet-only funds) is the actual safety control |
| Recover from the side panel losing its pending-request state mid-unlock (`lostContext`) so the caller can retry the click that re-triggers a fresh request | Assume Braavos's side panel is a fresh popup per request — it's a **singleton** target reused across requests; matching "any new target" misses this and was a real bug caught before shipping |

## Secret handling

```bash
security find-generic-password -s scaffold-stark-braavos -w
```

`readBraavosPasswordFromKeychain()` reads this and only this — never an env
var, never logged, never returned in a caller's report detail. Finding an
entry is **not** the same as the password being correct: the entry can hold
a stale value from before the wallet's password last changed. Callers must
always follow this with a real `attemptUnlock()`/`approveBraavosRequest()`
call; never trust `found` alone as "password confirmed".

The wallet being automated must hold **testnet funds only**.
`approveBraavosRequest()` clicks the primary action; it does not read or
understand what it's confirming.

## Procedure

```js
import { CDP_PORT, PROFILE_DIR, launchPersistentChrome, killPersistentChrome } from "./launch.mjs";
import { readBraavosPasswordFromKeychain, checkWalletSetupState, attemptUnlock, waitForBraavosRequestTarget, approveBraavosRequest } from "./braavos.mjs";

const { password } = readBraavosPasswordFromKeychain();
const launch = await launchPersistentChrome();
try {
  const setup = await checkWalletSetupState();
  if (!setup.vaultPresent) throw new Error("Braavos not set up on this profile");

  const unlock = await attemptUnlock(password);
  // unlock.state is "UNLOCKED" | "NO_PASSWORD_FIELD" | "REJECTED" | "INSERT_FAILED" | "UNKNOWN"

  // Caller drives the dapp's own "Connect" button here (app-specific — see
  // stark-demo-web.mjs's connectBraavosWallet), then:
  const request = await waitForBraavosRequestTarget(8_000);
  if (request) {
    const approved = await approveBraavosRequest(request, password, logDir);
    // A 4th, optional argument (attachExtraNetworkCapture) lets the caller
    // attach its own app-specific Network-domain instrumentation to the
    // Braavos session — e.g. stark-demo-web.mjs's attachTxHashCapture — so
    // this module never depends back on its own caller.
    // approved.lostContext === true means the side panel reset mid-unlock —
    // retry the dapp-side click that re-triggers the request.
  }
} finally {
  await killPersistentChrome();
}
```

## Known traps (measured, not assumed)

- **Braavos's side panel is a singleton**, reused across requests — its URL
  goes from `side-panel.html?nav={"path":"/dapp-request",...}` to bare
  `side-panel.html` after an in-panel unlock. `waitForBraavosRequestTarget`
  matches on URL path content, never on "any new target ID".
- **The service-worker target can exist before `chrome.*` finishes
  bootstrapping.** `checkWalletSetupState` forces a fresh wake via the popup
  on every attempt (not just when no target is found) rather than trusting a
  possibly-still-starting worker reference.
- **A blind last-candidate click is banned.** An earlier version clicked
  "whatever's last" by screen position and left a real tx request pending
  forever (neither confirmed nor rejected). `approveBraavosRequest` only
  clicks a candidate identified by text/role, and re-polls with a fresh DOM
  query if the click doesn't visibly change the panel.
- **The tx-confirm Sign button stays disabled until fee estimation
  completes** — a loading shimmer can make the fee line read empty rather
  than "-", which a naive check reads as "settled". Only a fee line
  containing a digit counts; an explicit "Transaction execution error" fails
  fast instead of waiting out the poll.
