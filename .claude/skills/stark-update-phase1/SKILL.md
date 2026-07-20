---
name: stark-update-phase1
description: Phase 1 — check and update dependencies for scaffold-stark-2 itself (Starknet toolchain, Cairo/OpenZeppelin, starknet.js, Next.js frontend, security advisories). Use when asked "does anything need updating?", before planning a release, or when returning to the project after time away. Phase 1 covers THIS repo only; sibling forks are Phase 2 and must not be touched here.
---

# Phase 1 — Update scaffold-stark-2

Answer one question: **which dependencies in this repo need updating, and which should deliberately stay put?**

Scope is **this repo only**. Siblings (`speedrunstark`, `basecamp`, `scaffold-stark-rn`, branch `v3-bulletproof-contracts`) are Phase 2. Do not check or modify them here — they receive changes from this repo via sync workflows, so fixing them before this repo is done gets overwritten.

## Prime directives

**Never state a version from memory.** Your training data is stale relative to this project. Every "latest" must come from a live lookup in this session. If a lookup fails, write `unverified` — an unverified claim is worse than a gap.

**Do not recommend an upgrade just because a newer version exists.** Recommend it only when the delta fixes a real problem, closes a *reachable* security gap, or unblocks something. For each upgrade you do recommend, say what would break.

**Read the KNOWN block below before reporting anything.** It lists conditions already investigated and settled. Re-reporting them is noise.

**If something is fine, say so plainly.** Do not invent busywork to look thorough.

**A version gap is not a finding. The changelog is the finding.** Reporting `2.18.0 → 2.19.3`
tells the reader nothing they can decide on. For **every** upgrade you surface, you must read
what actually changed and report it. This is not optional and it is the main output of this
skill — a report of bare version numbers has failed regardless of how accurate the numbers are.

For each gap, read the release notes across **every intervening version**, not just the newest:

```sh
gh release view <tag> --repo <owner>/<repo>                      # one release
gh release list --repo <owner>/<repo> --limit 20 --exclude-pre-releases
gh api repos/<owner>/<repo>/releases --jq '.[]|select(.tag_name>="vX")|{tag:.tag_name,body:.body}'
```

For npm packages without GitHub releases, fetch `CHANGELOG.md` from the repo, or the package's
`repository` URL from `npm view <pkg> repository.url`.

Report per upgrade, in this order:
1. **Breaking changes** — what would stop compiling or running. If none, say "no breaking changes".
2. **Bug fixes that matter to this project** — especially anything touching contract compilation,
   declare/deploy flow, RPC spec, account/provider APIs, or test execution.
3. **New capability** worth adopting, if any.
4. **Migration cost** — concretely, which files here would need editing.

If the release notes are empty or uninformative, say so and fall back to comparing tags
(`gh api repos/<owner>/<repo>/compare/<old>...<new> --jq '.commits[].commit.message'`). Never
substitute a guess about what a version "probably" contains — mark it `unverified` instead.

---

## Step 1 — Starknet toolchain

Source of truth: **`.tool-versions`** at repo root. CI reads this file directly via `grep`, so it is authoritative — not any version mentioned in a workflow file.

```sh
cat .tool-versions
gh release list --repo software-mansion/scarb --limit 5 --exclude-pre-releases
gh release list --repo foundry-rs/starknet-foundry --limit 5 --exclude-pre-releases
gh release list --repo 0xSpaceShard/starknet-devnet --limit 5 --exclude-pre-releases
```

> **Do not read the first line as "latest".** `gh release list` sorts by date, so pre-releases
> appear above the stable release — scarb has shown `v2.20.0-rc.1` on top while `v2.19.3` carried
> the `Latest` tag. Either pass `--exclude-pre-releases` as above, or read the row explicitly
> marked `Latest`. Recommending an `-rc` build into `.tool-versions` would propagate a pre-release
> to every fork.

Rules specific to this stack:

- **`snforge_std` (Scarb.toml) and `starknet-foundry` (.tool-versions) must move in lockstep.** A version mismatch makes snforge refuse to run. Never recommend moving one alone — they go in the same commit.
- **`starknet-devnet` is 0.x, so treat a minor bump as breaking.** 0.9.0 pulled in Starknet v0.14.3 RPC spec changes.
- **Before recommending a devnet bump, verify its Docker image tag actually exists** (`shardlabs/starknet-devnet-rs:<version>`). `sync-bulletproof-contracts.yaml` greps `.tool-versions` to stamp that tag — a nonexistent tag breaks the workflow.
- A toolchain bump propagates to all sibling forks. Flag it as needing coordinated rollout, and **defer the actual sibling work to Phase 2**.

## Step 2 — Cairo / OpenZeppelin

Source of truth: **`packages/snfoundry/contracts/Scarb.toml`**, cross-checked against `Scarb.lock` for what actually resolves.

```sh
cat packages/snfoundry/contracts/Scarb.toml
gh release list --repo OpenZeppelin/cairo-contracts --limit 5
```

Check `openzeppelin_access`, `openzeppelin_token`, `openzeppelin_interfaces`, `openzeppelin_utils`, `snforge_std`.

## Step 3 — starknet.js and @starknet-start

These are the packages most likely to actually need work, and they span **two** workspaces.

```sh
grep -n '"starknet"' packages/*/package.json          # used in BOTH nextjs and snfoundry
grep -n '@starknet-start' packages/nextjs/package.json
npm view starknet version
for p in chains explorers providers react; do npm view "@starknet-start/$p" version; done
```

`starknet` is a direct dependency of **both** `packages/nextjs` (hooks, components) **and** `packages/snfoundry` (deploy scripts). A major bump touches both — never treat it as frontend-only.

> Registry quirk: `npm view starknet version` returns the `latest` dist-tag, which has lagged behind published versions before (10.0.2 as `latest` while 10.0.3–10.4.0 existed and 10.5.0 sat on `next`). Check `npm view starknet versions --json | tail` if the number looks suspiciously round.

## Step 4 — Next.js frontend and security

```sh
yarn outdated || npm outdated --workspaces      # if this fails, fall back to npm view per direct dep
yarn npm audit || npm audit --workspaces
gh api --paginate repos/Scaffold-Stark/scaffold-stark-2/dependabot/alerts \
  --jq '[.[]|select(.state=="open")|.security_advisory.severity]|group_by(.)|map({(.[0]):length})|add'
```

The org is **`Scaffold-Stark`**, not `Quantum3-Labs`. A `gh api` call against the wrong org fails in a way that looks like "no alerts".

**`--paginate` is mandatory.** Without it `gh api` returns only the first page (30 items), so the count silently undercounts — it answers "how many on page one", not "how many are open". Verified 2026-07-20: 25 without, 29 with.

Focus on **direct** dependencies: `next`, `react`, `eslint-config-next`, `vitest`, `typescript`, and the UI set (`daisyui`, `zustand`, `@radix-ui/themes`, `usehooks-ts`, `qrcode.react`, `next-themes`). Fold routine patch drift in dev tooling into **one** informational line — not twenty findings.

**For every advisory, determine reachability before assigning severity.** This repo carries a large alert backlog that is almost entirely build-time. The question is never "is there an advisory" but "does it reach the deployed dapp bundle". A dev-only or build-time advisory is `low`, whatever its CVSS.

---

## KNOWN — settled conditions, do not re-report

Review this list each release; stale entries here cause missed regressions.

**Intentional, not drift:**
- `starknet = ">=2.18.0"` in Scarb.toml is an **open floor by design**. It already accepts 2.19.x. The real constraint is the scarb pin in `.tool-versions`. An open floor is not lag.
- **TypeScript stays on `^5`.** npm `latest` points at the Go-native TS7 compiler; `ts-node` and `typescript-eslint@^7` are not ready.
- **ESLint stays on `^8`** until `typescript-eslint` is bumped — `@^7` caps at eslint 8, and moving requires a flat-config migration.
- **Next 15 → 16 and starknet.js v9 → v10 are deliberate deferrals**, each needing its own migration pass. Raise them only if a security fix lands that is unavailable on the current major.

**Already investigated (verified 2026-07-20) — report only if status changed:**
- `overrides` blocks in root/nextjs/snfoundry `package.json` are **inert**: this is Yarn Berry (`yarn@3.2.3`), which reads `resolutions`. Known.
- **TanStack** May-2026 compromise: not exposed. Resolved versions predate the window; `yarn.lock` pins per-artifact sha512.
- **`next-pwa` is abandoned** (last publish 2022) and pulls a second `next@13.5.11` tree, which is the source of most remaining alerts — all build-time. Migration target is `@serwist/next`. Known, deferred.
- The Dependabot backlog reports every alert as `scope=runtime` because they trace through `yarn.lock`. That labelling is useless here; judge reachability yourself.
- **Alert count as of 2026-07-20: 29 open — 10 high, 12 medium, 7 low, zero critical.** Treat this as a baseline to diff against, not a fact to repeat. A jump above ~35, or any critical appearing, is the signal worth acting on. (Earlier figures of 78 and 107 in the May/July reports were unpaginated or double-counted — do not trust them as history.)

---

## Grouping the work

Do not produce a flat list. Group into PRs by risk, because these have very different review needs:

**Batch 1 — safe, one PR.** Same-major bumps and version alignments. Anything where the existing semver range already permits the new version is lockfile-only and near-zero risk.

**Batch 2 — toolchain, breaking, coordinated.** `.tool-versions` + `Scarb.toml` + `Scarb.lock` in a single commit. Must not be split.

> **Carry-over from 2026-05-18:** a previous org-wide toolchain sync reached parity in `package.json` but **missed the nested Cairo manifest inside the generator template** — `create-stark-rn/template/snfoundry/contracts/Scarb.toml` never got the OZ 3.0 dep. Template copies are a **separate sync surface**. When bumping the toolchain, explicitly check the `Scarb.toml` inside the create-stark template, not just the ones under `packages/`.

**Batch 3 — migrations, one PR each.** starknet.js v10, UI major bumps, `next-pwa` → `@serwist/next`. Never bundle these.

---

## Before claiming anything is done

Run these and report **actual output**. Do not assert.

```sh
yarn install --immutable    # lockfile actually resolves
yarn next:check-types       # types still compile
yarn test:nextjs            # frontend tests
cd packages/snfoundry/contracts && scarb build && snforge test
```

If `scarb build` fails with a cache error, `scarb clean` first — a corrupted package cache has produced false build failures here before.

State plainly what passed, what failed, and what you did not run. A skipped check reported as silence is the most common way a bad update ships.

## Output format

1. **One sentence:** does anything actually need updating right now?
2. **Findings** ranked `blocker > needs-update > nice-to-have`, each tagged **CODE** (needs a crew) or **OPS** (captain does directly).
3. **Batches** as above, with suggested branch names.
4. **Checked and clean** — say explicitly what was verified as current, so silence is not mistaken for coverage.
5. **Deferred, with reasons** — so the next run does not re-litigate them.

## Not in scope

Sibling repos, sync-workflow health, CI configuration, open PR triage. Those belong to Phase 2 or to the `stark-drift-check` workflow. Keep this skill about dependencies.
