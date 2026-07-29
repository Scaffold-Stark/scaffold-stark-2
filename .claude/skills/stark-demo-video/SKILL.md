---
name: stark-demo-video
description: Use when asked to record a demo proving scaffold-stark actually works end to end — a terminal take of a real Sepolia deploy gate (Take 1), and/or a browser take of a real Braavos wallet connecting and sending a write transaction against that deploy (Take 2). Triggers on requests to record a demo, produce a proof video/GIF, or show a real deploy + wallet flow on camera.
---

# stark-demo-video — record the Sepolia deploy gate and/or a real Braavos wallet flow

## Overview

`stark-smoke-test`'s devnet gate proves the stack works against the local
burner wallet; it never drives a real wallet extension or a live network.
This skill records two independent takes that together prove
scaffold-stark works end to end against **real Sepolia**:

1. **Take 1 (terminal)** — wraps the [Sepolia deploy gate](../stark-smoke-test/SKILL.md#sepolia-gate-opt-in-s1-s5)
   (`node .claude/skills/stark-smoke-test/stark-smoke-test.mjs sepolia`) in
   an `asciinema` recording, converts it to a GIF with `agg`, and writes a
   proof block next to it — recorded by `stark-demo-terminal.mjs`.
2. **Take 2 (browser)** — drives a real Braavos wallet connect + write
   transaction against **the contract Take 1 (or a prior run of the
   Sepolia gate) just deployed**, via `stark-cdp-with-wallet`'s primitives,
   and exports an MP4 plus its own proof block — recorded by
   `stark-demo-web.mjs`. It reads the deployed contract address straight
   out of `packages/nextjs/contracts/deployedContracts.ts`'s `sepolia`
   entry and refuses to run if that entry doesn't exist yet — run the
   Sepolia gate (directly, or via Take 1) first.

Each take is its own independent CLI script — unlike scaffold-stylus's
single `record.mjs` orchestrating both takes internally, stark keeps two
separate entry points, unified here under one skill folder/doc because
they tell one end-to-end story and Take 2 depends on what Take 1 (or the
gate it wraps) produces. **In both takes, the video/GIF is the throwaway
part; the proof block (contract address, tx hash + Starkscan link,
on-chain read/confirmation, branch + commit) is the actual deliverable** —
a recording cannot be independently verified, a tx hash / class hash can.

All Braavos-driving primitives Take 2 uses (Chrome launch against the
persistent debug profile, Keychain password read, unlock, connect/tx
approval) live in `.claude/skills/stark-cdp-with-wallet/` — see that
skill's own SKILL.md. Take 2 only knows the app-specific parts: clicking
this app's own "Connect Wallet" button, reading/writing
`deployedContracts.ts` and `scaffold.config.ts`, capturing the transaction
hash from this app's own RPC traffic, and screencast/MP4 assembly. That
boundary mirrors scaffold-stylus's split between `cdp-with-wallet` (wallet
primitives) and `demo-video` (app-specific orchestration).

Zero npm dependencies in both takes: Take 1 shells out to `asciinema`/`agg`/
`ffmpeg` (external tools, not repo dependencies); Take 2 uses raw CDP over
Node's built-in `fetch()`/`WebSocket`, same style as
`stark-smoke-test-browser.mjs`. This is a template repo — nothing here may
be added to any `package.json`.

## Files

```
.claude/skills/stark-demo-video/
  SKILL.md               this file — covers both takes
  stark-demo-terminal.mjs  Take 1: records the Sepolia gate as a GIF
  stark-demo-web.mjs       Take 2: records a real Sepolia + Braavos browser demo;
                           imports stark-smoke-test-browser.mjs (CDP toolkit) and
                           stark-cdp-with-wallet's launch.mjs/braavos.mjs
                           (wallet primitives) rather than duplicating them
```

---

## Take 1 — terminal: record the Sepolia gate as a GIF

```bash
node .claude/skills/stark-demo-video/stark-demo-terminal.mjs --branch <branch-name>
```

**Terminal only.** This never touches a wallet, a browser extension, Braavos,
`chrome.storage`, or any credential — the Sepolia gate it wraps is pure CLI
(deploy script + JSON-RPC calls), same as `stark-smoke-test.mjs` itself.

**Spends real STRK.** The gate it wraps declares and deploys a real contract
against live Sepolia. Do not run this casually — same rule as the gate
itself.

### Why the GIF is not the deliverable

A screen recording proves nothing on its own — it can show anything, and a
reviewer has no way to verify it after the fact. scaffold-stylus learned this
the expensive way: a demo was recorded on `main` (older than the fix it was
meant to demonstrate), looked completely legitimate on playback, and was
submitted for review anyway. Nothing in the artifact identified which branch
or commit it came from.

Two things this script does specifically because of that:

1. **`--branch` is mandatory and cross-checked.** The script refuses to
   record if you don't declare the branch you intend to prove, and refuses
   again if the declared branch doesn't match what's actually checked out
   (`git symbolic-ref --short HEAD`). Detached HEAD is also refused — there's
   no branch name to check.
2. **The proof block is the primary output, the GIF is illustrative.** The
   proof block carries the facts a reviewer *can* independently verify:
   contract address, on-chain class hash (from the gate's own S5
   confirmation step, not guessed), a Starkscan link, and branch + commit
   SHA. Paste the proof block into the PR description; attach the GIF only
   as a supporting visual.

### Output

Everything lands in `.smoke-test-logs/demo-gif/` (gitignored — same
directory the Sepolia gate already logs to), named
`sepolia-gate-<branch>-<short-sha>.*`:

- `.cast` — raw asciinema recording (asciicast v3)
- `.txt` — plain-text transcript of the recording (used internally for the
  redaction check and to parse the proof-block fields; also handy to read
  without a GIF viewer)
- `.gif` — the rendered recording
- `-proof.txt` — the proof block, described above

**Do not commit the `.cast`/`.gif`/`.txt` files** — they're large binary/log
artifacts, gitignored on purpose. Attach the GIF to the PR directly instead.

### Redaction

`RPC_URL_SEPOLIA` carries an API key. The underlying gate already redacts it
from every message it prints (`redactRpcUrl()` in `stark-smoke-test.mjs`), so
in the normal GREEN path it never reaches stdout. This script still checks
after the fact — greps the plain-text transcript, then greps the rendered
GIF bytes directly — and refuses to hand back a GIF or proof block if either
check finds the raw URL. If that happens, it deletes the GIF and stops; it
does not record over the leak and does not publish partial output.

### Duration honesty

`agg`'s default idle-time-limit (5s) would compress the multi-minute wait
during S4 (declare+deploy) down to a few seconds, making the GIF's playback
time lie about how long the gate actually took. This script overrides that
to effectively unlimited, so the GIF's timing matches the real run. (agg
still adds a fixed ~3s hold on the final frame by default — expect the GIF
to run a few seconds longer than the real wall-clock time on top of that;
the proof block reports both numbers and their delta so this is visible,
not hidden.)

### When the gate doesn't go GREEN

The script still writes a GIF and a proof block — but the proof block says
so explicitly (`gate result: NOT GREEN`) and omits contract
address/class-hash fields rather than showing stale or partial data. It
exits non-zero. Do not treat a non-GREEN run's artifacts as demo material;
they exist for debugging the gate itself, matching the `stark-smoke-test`
gate's own INFRA/RED reporting rules.

### Asciinema is on v3 (Rust), not v2

If you're touching this script: asciinema 3.x is a full Rust rewrite of the
2.x Python tool, and most guidance you'll find online describes 2.x and is
wrong for this version. Confirmed on this repo's pinned `asciinema 3.2.1`:
`asciinema record --command "<cmd>" <file>` (not `-c` positional shell
detection, not `asciinema rec` with implicit shell capture of a typed
command — `--command` runs one command and the recording ends when it
exits). Check `asciinema --help` / `asciinema record --help` yourself before
changing flags — don't trust memory or old tutorials.

---

## Take 2 — browser: record a real Sepolia + Braavos browser demo

```bash
node .claude/skills/stark-demo-video/stark-demo-web.mjs preflight --branch=<name>
node .claude/skills/stark-demo-video/stark-demo-web.mjs run       --branch=<name>
```

Load app → connect a real Braavos wallet → read a contract value → send a
write transaction → approve it in Braavos → read the value again, against
the live Sepolia deployment Take 1 (or a prior `stark-smoke-test.mjs
sepolia` run) produced. Exports an MP4 plus a text proof block (contract
address, tx hash + Starkscan link, on-chain read before/after, branch +
commit).

`run` refuses to start without an explicit `--branch` matching the checked
out HEAD — same rationale as Take 1's `--branch` requirement above; this
makes recording against the wrong branch impossible by construction.

`run` will **not** submit the write transaction unless `DEMO_SEND_TX=1` is
set in the environment. Without it, the script stops cleanly right before
the Send click, finalizes the partial recording, and reports a checkpoint —
this is the mechanism, not a promise, for "stop and ask before sending".

### Secret handling

The Braavos password is read from the macOS Keychain (service name
`scaffold-stark-braavos`) via `stark-cdp-with-wallet`'s
`readBraavosPasswordFromKeychain()` — never from an env var, since an env
var means typing the password into some terminal where it lands in
scrollback/transcript history. If the Keychain entry doesn't exist, this
script says so with creation instructions and stops; it never falls back,
never guesses. Finding a Keychain entry is **not** the same as the password
being correct — only a real unlock attempt against the live wallet confirms
that, and its three distinct outcomes (no entry / entry rejected / unlocked)
are always reported separately.

`RPC_URL_SEPOLIA` and `PRIVATE_KEY_SEPOLIA` carry secrets. `loadSecrets()`
collects every `*_URL`/`*RPC*` value from the two `.env` files this repo
uses for Sepolia once, up front, so every console line and every rendered
DOM text-content check can be scrubbed against the same list —
`assertNoSecretLeak()` actively checks rendered page text after every
navigation rather than assuming `redact()` alone covers it, since a leak in
a video **frame** can't be redacted after the fact the way a log line can.

### Side effects to know about

- `scaffold.config.ts`'s `targetNetworks` is patched to `[chains.sepolia]`
  for the run and restored afterward (`patchScaffoldConfigForSepolia` /
  `restoreScaffoldConfig`) — runtime only, never committed.
- The persistent `$HOME/.chrome-debug-profile` Chrome instance and the local
  dev server are both torn down in a `cleanup()` that runs in a `finally`
  and on `SIGINT`/`SIGTERM`, regardless of outcome.

### Known traps (measured, not assumed)

- **Braavos requires `localhost`, not `127.0.0.1`.** Braavos's
  `manifest.json` declares its inpage-injection script under
  `web_accessible_resources` matching only `["http://localhost/*",
  "https://*/*"]` — `127.0.0.1` is absent from that list even though it IS
  present in `content_scripts` matches, so the isolated content script runs
  fine on `127.0.0.1` but `window.starknet_braavos` never appears there.
  Verified directly on this exact Braavos build (4.19.6).
- **The connect click must go through real CDP `Input.dispatchMouseEvent`,
  never a synthetic `element.click()`.** Braavos's manifest needs
  `chrome.sidePanel.open()` for its connect/approve UI, which only works
  inside a *trusted* user gesture — a synthetic click from
  `Runtime.evaluate` does not carry that trust and Braavos's handler
  silently no-ops with no error and no side panel ever opening.
- **The transaction hash is captured from the real JSON-RPC write, not
  scraped UI confirmation text.** Braavos submits the invoke RPC from its
  own service worker, invisible to the dapp tab's Network domain — so this
  script attaches a Network capture to both the dapp tab's own provider hook
  AND directly to the Braavos service worker target
  (`findServiceWorkerTarget()`, from `stark-cdp-with-wallet`) as a fallback.
- **Local storage on the persistent profile can already hold a connected
  session from an earlier run** (autoConnect) — no "Connect" label renders
  in that case at all. This script checks for an already-connected address
  before assuming the connect trigger must exist.
