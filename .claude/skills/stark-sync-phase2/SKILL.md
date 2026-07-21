---
name: stark-sync-phase2
description: Phase 2 — propagate an already-merged scaffold-stark-2 update out to its sibling forks and the create-stark npm template. Verifies whether each target's sync automation actually worked, and repairs broken automation rather than hand-patching the target. Use only AFTER Phase 1 changes are merged; run stark-update-phase1 first.
---

# Phase 2 — Propagate to siblings

Answer: **did each sibling actually receive the Phase 1 changes, and if not, why?**

## Precondition — do not start without this

Phase 2 propagates *already-merged* work. Verify Phase 1 actually landed before touching anything:

```sh
git log --oneline origin/main -5
git log --oneline origin/main..origin/develop | wc -l    # unreleased work sitting on develop
```

If the Phase 1 changes are still on `develop` or still in an open PR, **stop**. Syncing now propagates a half-state, and re-syncing later produces conflicts on top of it.

## Governing rule — repair, do not bypass

When a target is out of date **and** has automation, the automation is the defect. Fix the workflow so it works, then let it run.

Do **not** hand-patch the target repo. A manual edit gets overwritten by the next successful sync, hides the broken automation, and has to be redone every release. The one exception is a target with **no** automation at all — see the routing table.

---

## Targets

| Target | Kind | Automation | Trigger |
|---|---|---|---|
| `Scaffold-Stark/speedrunstark` | fork | `sync-speedrun-repo.yaml` | push(develop) + PR-closed + **dispatch** |
| `Scaffold-Stark/basecamp` | fork | `sync-basecamp-repo.yaml` | push(develop) + PR-closed + **dispatch** |
| `Scaffold-Stark/scaffold-stark-rn` | fork (sed-rewritten) | `sync-rn-repo.yaml` | push(develop) + PR-closed + **dispatch** |
| `v3-bulletproof-contracts` | **branch inside this repo** | `sync-bulletproof-contracts.yaml` | push(develop) **only** |
| `Scaffold-Stark/create-stark` | **npm package template** | `release-create-stark.yaml` | PR-closed **only** |

Two structural constraints that shape everything below:

- **`sync-bulletproof-contracts` and `release-create-stark` have no `workflow_dispatch`.** They cannot be triggered manually. If they need to run, either a qualifying event must occur or the workflow needs a `workflow_dispatch` block added first.
- **Releases are pushed to `main` as `chore(release): X` with `[skip ci]`.** Sync workflows fire on `push: branches:[develop]` or `pull_request: closed`. A release push therefore fires **nothing**. Do not assume a release propagated.

---

## Step 1 — Did the automation run, and did it *work*?

These are different questions. Run all three checks per target; a target passes only if all three agree.

```sh
# (a) did it run at all?
gh run list --workflow <file> --limit 10 --json conclusion,createdAt,headBranch

# (b) does the trigger still resolve? (a deleted branch silently kills a workflow)
git ls-remote --heads origin develop

# (c) DID IT PRODUCE ANYTHING? — the check that actually matters
gh api repos/Scaffold-Stark/<target>/commits --jq '.[0:10] | .[] | "\(.commit.author.date) \(.author.login // "?") \(.commit.message | split("\n")[0])"'
```

**Green runs prove nothing.** This repo's sync workflows have reported `success` while merging nothing, because a `|| echo` swallowed the merge's exit code and the subsequent push was a no-op. Confirmed in run `26048950811`: 11 conflicts, `Automatic merge failed`, then `No changes to merge`, then `Everything up-to-date`, conclusion `success`.

**Check commit *provenance*, not recency.** A target can carry recent commits produced by a side-effect step while the step you care about has never once succeeded. On the bulletproof branch, every `chore: update Docker versions [CI]` commit landed while **zero** `origin/develop` merges ever did — the branch looked maintained and was not.

```sh
# for the bulletproof branch specifically:
git log origin/v3-bulletproof-contracts --merges --oneline -15   # any 'develop' merges? or only 'main'?
git log origin/develop ^origin/v3-bulletproof-contracts --oneline | wc -l   # how far behind
```

For fork targets, compare the actual files rather than trusting commit counts — a fork can be N commits behind while the only content difference is a version string:

```sh
gh api repos/Scaffold-Stark/<target>/contents/.tool-versions --jq '.content' | base64 -d
gh api repos/Scaffold-Stark/<target>/contents/packages/snfoundry/contracts/Scarb.toml --jq '.content' | base64 -d
```

## Step 2 — Classify each target

| Finding | Action |
|---|---|
| Automation ran, target has the changes | **Clean.** Say so and move on. |
| Automation ran green but target unchanged | **Broken automation.** Read the run log; look for a swallowed exit code and an unconditional push. Fix the workflow. |
| Automation never ran | **Trigger problem.** Is the branch it fires on still present? Did the event actually occur? A release push with `[skip ci]` fires nothing. |
| Automation ran and failed loudly | Read the failure. Usually a real conflict needing resolution — that is a legitimate PR, not a workflow bug. |
| No automation for this target | Only case where a manual sync PR is correct. |

## Step 3 — Repairing broken automation

Known defect patterns in this repo's sync workflows, in the order worth checking:

**Swallowed exit code.** `git merge ... || echo "..."` followed by an unconditional push reports success while doing nothing. The fix is `|| { git merge --abort; exit 1; }`. While there, check whether the fallback message *asserts* something false — `|| echo "No changes to merge"` printed after a failed merge tells the next reader the opposite of the truth and stops them looking.

**Persist path gated on the wrong condition.** For every artefact a job produces, ask whether a path exists for it to reach the remote, and whether that path is gated on the same thing that produced it. A merge guarded by "did file X change" can only be pushed by coincidence.

**No failure notification.** `sync-bulletproof-contracts.yaml` is the only sync workflow with no Slack step, which is why its failure went unseen. Add one when repairing it.

**Path filter vs rsync scope disagreeing.** The push filter lists six paths while the rsync copies the whole tree. Either broaden the filter or narrow the rsync — as written, a change to an unlisted path never triggers a sync that would have copied it.

After repairing, trigger and re-verify with Step 1 — a repair claimed but not observed is not a repair.

## Step 4 — create-stark (npm template)

Highest blast radius: its rsync feeds `destination_repo/templates/base`, which is then `npm publish`ed and scaffolded onto every user's disk by `npx create-stark`.

```sh
npm view create-stark version                       # published
git log --oneline -1 origin/main                    # what this repo is at
gh run list --workflow release-create-stark.yaml --limit 5
```

**Generator templates are a separate sync surface.** Carry-over from 2026-05-18: an org-wide toolchain sync reached parity in `package.json` but missed the nested Cairo manifest inside the template — `template/snfoundry/contracts/Scarb.toml` never received the OZ 3.0 dependency. When verifying template parity, check the **nested** `Scarb.toml` and `.tool-versions` inside `templates/base`, not only the top-level ones.

Verify the published artefact, not just the repo:

```sh
cd $(mktemp -d) && npm pack create-stark@latest && tar -xzf create-stark-*.tgz
grep -r "scarb\|snforge_std" package/templates/base/.tool-versions \
  package/templates/base/packages/snfoundry/contracts/Scarb.toml 2>/dev/null
```

A template can scaffold cleanly and still ship a broken import — the published `scaffold-stark-rn` v1.0.6 carried a dangling `verify-contracts.ts` import for exactly this reason. If you can, scaffold and typecheck rather than only reading files.

---

## Known constraints

- **`scaffold-stark-rn` may be intentionally deferred.** Check whether it is intentionally deferred before proposing work on it; if so, report its state and do not rank it actionable unless materially worse.
- **`v3-bulletproof-contracts` is a branch, not a repo.** It cannot be checked with `gh api repos/...`; use `git log origin/v3-bulletproof-contracts`.
- **A toolchain bump propagates to every target.** `.tool-versions` is copied wholesale by the fork syncs and greped by `sync-bulletproof-contracts.yaml` to stamp a Docker image tag. Verify that tag exists before syncing a devnet bump, or the workflow emits a broken image reference.

## Before claiming a target is synced

Report actual output, never assertions:

```sh
gh run list --workflow <file> --limit 3         # the triggered run and its conclusion
gh api repos/Scaffold-Stark/<target>/commits --jq '.[0].commit.message'   # what landed
```

State which targets you verified, which you could not, and why. "I did not find a problem" and "there is no problem" are different claims — only one is checkable.

## Output format

1. **One sentence:** are all targets in sync?
2. **Per target:** clean / broken-automation / trigger-problem / needs-manual, with the evidence.
3. **Repairs needed**, tagged CODE (needs a code change) or OPS (a repo action, no code change), with branch names.
4. **Verified clean** — explicitly, so silence is not read as coverage.

## Not in scope

Dependency selection and changelog review — that is `stark-update-phase1`. This skill only propagates what Phase 1 already decided and merged.
