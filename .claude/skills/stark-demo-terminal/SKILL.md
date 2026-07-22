---
name: stark-demo-terminal
description: Use when someone needs a shareable terminal recording of the Sepolia deploy gate (for a PR, a review, or a demo) — records `stark-smoke-test.mjs sepolia` with asciinema and produces a GIF plus a verifiable proof block.
---

# stark-demo-terminal — record the Sepolia gate as a GIF

Records a real run of the [Sepolia deploy gate](../stark-smoke-test/SKILL.md#sepolia-gate-opt-in-s1-s5)
(`node .claude/workflows/stark-smoke-test.mjs sepolia`) with `asciinema`,
converts it to a GIF with `agg`, and writes a proof block next to it.

```bash
node .claude/workflows/stark-demo-terminal.mjs --branch <branch-name>
```

**Terminal only.** This never touches a wallet, a browser extension, Braavos,
`chrome.storage`, or any credential — the Sepolia gate it wraps is pure CLI
(deploy script + JSON-RPC calls), same as `stark-smoke-test.mjs` itself.

**Spends real STRK.** The gate it wraps declares and deploys a real contract
against live Sepolia. Do not run this casually — same rule as the gate
itself.

## Why the GIF is not the deliverable

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

## Output

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

## Redaction

`RPC_URL_SEPOLIA` carries an API key. The underlying gate already redacts it
from every message it prints (`redactRpcUrl()` in `stark-smoke-test.mjs`), so
in the normal GREEN path it never reaches stdout. This script still checks
after the fact — greps the plain-text transcript, then greps the rendered
GIF bytes directly — and refuses to hand back a GIF or proof block if either
check finds the raw URL. If that happens, it deletes the GIF and stops; it
does not record over the leak and does not publish partial output.

## Duration honesty

`agg`'s default idle-time-limit (5s) would compress the multi-minute wait
during S4 (declare+deploy) down to a few seconds, making the GIF's playback
time lie about how long the gate actually took. This script overrides that
to effectively unlimited, so the GIF's timing matches the real run. (agg
still adds a fixed ~3s hold on the final frame by default — expect the GIF
to run a few seconds longer than the real wall-clock time on top of that;
the proof block reports both numbers and their delta so this is visible,
not hidden.)

## When the gate doesn't go GREEN

The script still writes a GIF and a proof block — but the proof block says
so explicitly (`gate result: NOT GREEN`) and omits contract
address/class-hash fields rather than showing stale or partial data. It
exits non-zero. Do not treat a non-GREEN run's artifacts as demo material;
they exist for debugging the gate itself, matching the `stark-smoke-test`
gate's own INFRA/RED reporting rules.

## Asciinema is on v3 (Rust), not v2

If you're touching this script: asciinema 3.x is a full Rust rewrite of the
2.x Python tool, and most guidance you'll find online describes 2.x and is
wrong for this version. Confirmed on this repo's pinned `asciinema 3.2.1`:
`asciinema record --command "<cmd>" <file>` (not `-c` positional shell
detection, not `asciinema rec` with implicit shell capture of a typed
command — `--command` runs one command and the recording ends when it
exits). Check `asciinema --help` / `asciinema record --help` yourself before
changing flags — don't trust memory or old tutorials.
