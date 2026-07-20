export const meta = {
  name: 'stark-drift-check',
  description: 'Audit the scaffold-stark ecosystem for drift: repo/PR state, sync-workflow health, toolchain lag, and an optional devnet deploy smoke test',
  whenToUse: 'Run at the start of a session after time away, to answer "does anything need updating?" across scaffold-stark-2 and its sync targets',
  phases: [
    { title: 'Audit', detail: 'parallel: primary repo, sync health, siblings, upstream deps' },
    { title: 'Smoke', detail: 'optional devnet scaffold+deploy end-to-end check' },
    { title: 'Synthesize', detail: 'merge into one ranked, CODE-vs-OPS actionable list' },
  ],
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// No hardcoded repo path or org — every agent below derives these itself so this
// workflow runs unmodified from any clone or fork:
//   REPO_ROOT = `git rev-parse --show-toplevel`
//   ORG       = the owner segment of `git remote get-url origin`
const REPO_CONTEXT = `
Derive these before anything else and use them for every command below:
  REPO_ROOT = $(git rev-parse --show-toplevel)
  ORG       = the owner segment of \`git remote get-url origin\`
              (e.g. git@github.com:OWNER/repo.git or https://github.com/OWNER/repo)
`

const SIBLINGS = [
  {
    key: 'speedrunstark',
    repo: 'speedrunstark',
    syncedBy: 'sync-speedrun-repo.yaml',
    role: 'speedrun challenge fork; receives full-tree rsync from primary',
  },
  {
    key: 'basecamp',
    repo: 'basecamp',
    syncedBy: 'sync-basecamp-repo.yaml',
    role: 'basecamp curriculum fork; receives full-tree rsync from primary',
  },
  {
    key: 'scaffold-stark-rn',
    repo: 'scaffold-stark-rn',
    syncedBy: 'sync-rn-repo.yaml',
    role: 'React Native fork; receives sed-rewritten sync (nextjs -> rn paths)',
    deferred: true, // audit and report state, but do not recommend action unless materially worsened
  },
  {
    key: 'v3-bulletproof-contracts',
    repo: 'scaffold-stark-2 (branch: v3-bulletproof-contracts)',
    syncedBy: 'sync-bulletproof-contracts.yaml',
    role: 'INTRA-repo long-lived branch, not a separate repo; develop is merged into it',
  },
]

const SIBLINGS_TEXT = SIBLINGS.map((s) => {
  const label = s.key === 'v3-bulletproof-contracts' ? s.repo : `ORG/${s.repo}`
  const deferredNote = s.deferred
    ? '\n      *** DEFERRED — audit and report state, but do NOT recommend action unless materially worsened ***'
    : ''
  return `  - ${s.key} | repo: ${label} | synced by: ${s.syncedBy}\n      role: ${s.role}${deferredNote}`
}).join('\n')

// Toolchain pins. Update this list when pins move.
const PINS = `
  .tool-versions (AUTHORITATIVE — CI greps this file directly):
    scarb 2.18.0 | starknet-foundry 0.60.0 | starknet-devnet 0.8.1
  packages/snfoundry/contracts/Scarb.toml:
    starknet ">=2.18.0" | openzeppelin_access ">=3.0.0" | openzeppelin_token ">=3.0.0"
    openzeppelin_interfaces ">=2.0.0" | openzeppelin_utils ">=2.0.0" | snforge_std "0.60.0" (exact)
  packages/nextjs: next 15.5.18 | react 19.0.3 | starknet ^9.4.2 | vitest 3.2.4
`

// ---------------------------------------------------------------------------
// Known conditions. Agents MUST NOT re-report these as new problems.
// This block is what keeps the report free of busywork.
//
// REVIEW THIS BLOCK EACH RELEASE. Pins and "known" statuses below go stale
// fast — an unreviewed entry here silently swallows real drift instead of
// flagging it.
// ---------------------------------------------------------------------------

const KNOWN = `
KNOWN AND INTENTIONAL — do not report these as findings:
- \`starknet = ">=2.18.0"\` in Scarb.toml is an OPEN FLOOR, deliberately. It already accepts
  2.19.x. The real toolchain constraint is the scarb pin in .tool-versions. An open floor is
  not drift.
- TypeScript stays on ^5. npm "latest" now points at the Go-native TS7 compiler; ts-node and
  typescript-eslint ^7 are not ready. Staying is correct, not lag.
- Staying on Next 15 (not 16) and starknet.js v9 (not v10) are deliberate deferrals, each
  needing its own migration pass coordinated across forks. Mention only if a SECURITY fix
  lands that is unavailable on the current major.

KNOWN AND ALREADY TRACKED — report only if the STATUS has changed:
- \`overrides\` blocks in root/nextjs/snfoundry package.json are inert: this is Yarn Berry
  (yarn@3.2.3), which reads \`resolutions\`, not \`overrides\`. Already logged.
- \`daisyui: "latest"\` in packages/nextjs is an unpinned specifier resolving a different major
  than root. Known, tracked.
`

const GUARDRAILS = `
READ-ONLY. Do not edit, commit, push, or open anything. Only the Smoke phase executes, and
even it must not modify the primary repo (REPO_ROOT) or any sibling repo it audits.

Report what you actually OBSERVE from commands you ran. Never state a version from memory —
your training data is stale relative to this project. If you cannot verify something from a
live source, say "unverified" rather than guessing. An unverified claim is worse than a gap.

Do NOT recommend an upgrade just because a newer version exists. Recommend it only when the
delta fixes a real problem, closes a reachable security gap, or unblocks something. For each
upgrade you DO recommend, say what would break.

If an area is fine, say so plainly. Do not invent busywork to look thorough.
`

// ---------------------------------------------------------------------------
// Schema — severity is decision-shaped, and every finding is CODE or OPS.
// ---------------------------------------------------------------------------

const FINDINGS = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'findings'],
  properties: {
    summary: { type: 'string', description: 'One sentence: is this area clean or does it need attention?' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'severity', 'kind', 'detail', 'action'],
        properties: {
          title: { type: 'string' },
          severity: { enum: ['blocker', 'needs-update', 'nice-to-have', 'informational'] },
          kind: {
            enum: ['CODE', 'OPS'],
            description: 'CODE = needs a crew to implement. OPS = a merge/close/delete/review the captain does directly.',
          },
          detail: { type: 'string', description: 'Concrete evidence: version numbers, PR numbers, file:line, command output' },
          action: { type: 'string', description: 'The specific next step. "none" if no action needed.' },
          breaksForks: { type: 'boolean', description: 'Would this change propagate to sync targets and need coordination?' },
        },
      },
    },
    checkedClean: { type: 'string', description: 'What you checked and found healthy, so silence is not mistaken for verified.' },
  },
}

// ---------------------------------------------------------------------------
// Audit prompts
// ---------------------------------------------------------------------------

const primaryAudit = `${GUARDRAILS}\n${KNOWN}
${REPO_CONTEXT}

Audit the PRIMARY repo's git/CI/review state.

Run and report what you observe:
  cd REPO_ROOT
  git fetch --quiet && git status -sb
  git log --oneline -10
  git log --oneline origin/main..origin/develop | wc -l   # is develop ahead of main?
  gh pr list --state open --json number,title,headRefName,createdAt,updatedAt,mergeable
  gh run list --limit 20 --json name,status,conclusion,headBranch,createdAt

Judge:
1. Is main in sync with origin, tree clean?
2. develop vs main divergence — is there merged-but-unreleased work sitting on develop?
   (Releases ship from main; a fix stuck on develop never reaches the forks.)
3. Open PRs: age, mergeable state, CI status. A PR whose green checks predate significant
   base movement has a STALE signal even though it shows green — call that out.
4. Any workflow failing repeatedly on main/develop.
5. Deprecated action pins in .github/workflows/ (actions/checkout@master or @v3, setup-node@v3).

Severity: red CI on main or a broken release path = blocker. Real PR needing review =
needs-update. Deprecated action pin = nice-to-have.`

const syncHealthAudit = `${GUARDRAILS}\n${KNOWN}
${REPO_CONTEXT}

Audit the SYNC WORKFLOWS themselves. This is the highest-value area — this project's
sync automation has silently failed before, and a sync that reports green while doing
nothing is the worst possible failure mode.

Read every REPO_ROOT/.github/workflows/sync-*.yaml. For each:
1. What triggers it? (push to develop w/ path filter? pull_request closed? workflow_dispatch?)
2. What is its target, and what does it actually copy (rsync scope vs path filter — do they agree)?
3. CRITICAL: does any git/merge/push step swallow its exit code with \`|| true\`, \`|| echo ...\`,
   or \`continue-on-error\`? A merge whose failure is swallowed followed by an unconditional
   push will report SUCCESS while merging nothing. Grep for this pattern specifically.
4. Does it notify on failure (Slack step)? A sync with no notification fails invisibly.
5. gh run list --workflow <file> --limit 10 — check conclusions AND whether runs are stuck
   queued. Cross-check: a "success" run that pushed nothing is a false green.

Also: releases are pushed to main as \`chore(release): X\` with [skip ci]. Verify whether the
sync workflows can actually fire on a release push, or whether the trigger conditions mean
releases never propagate to the forks at all.

Any false-green sync is a BLOCKER.`

const siblingsAudit = `${GUARDRAILS}\n${KNOWN}
${REPO_CONTEXT}

Audit whether the sync TARGETS have actually received what the primary has.

Targets (substitute the ORG you derived above for every ORG/<repo> below):
${SIBLINGS_TEXT}

Note: v3-bulletproof-contracts is a BRANCH inside the primary repo, not a separate repo.
Check it with: cd REPO_ROOT && git log --oneline origin/develop ^origin/v3-bulletproof-contracts | wc -l

None of these siblings are locally cloned. Use \`gh api repos/ORG/<repo>/contents/<path>\` to
read individual files for comparison, or \`gh repo clone ORG/<repo> /tmp/<repo>\` if you need a
full local diff (clean up /tmp afterwards — see GUARDRAILS).

For each target, determine CONCRETELY how far behind it is:
  - commits behind the primary's develop/main
  - date of its last successful sync vs the date of the last primary change to a synced path
  - whether its .tool-versions / Scarb.toml / package.json actually match the primary's
    (compare file contents, not just assume — a version-string-only diff is very different
    from missing toolchain pins, and the distinction determines severity)

Report one finding per target that is genuinely behind. Be precise about WHAT is missing:
"N commits behind but the only content diff is the version string" is a much smaller problem
than "N commits behind and missing the toolchain bump" — do not conflate them.`

const upstreamAudit = `${GUARDRAILS}\n${KNOWN}

Check whether pinned toolchain/dependencies have fallen behind upstream.

Current pins:
${PINS}

For each, find the latest upstream release LIVE. Use:
  gh release list --repo software-mansion/scarb --limit 5
  gh release list --repo foundry-rs/starknet-foundry --limit 5
  gh release list --repo 0xSpaceShard/starknet-devnet --limit 5
  gh release list --repo OpenZeppelin/cairo-contracts --limit 5
  npm view <pkg> version

Critical project context you must weigh:
- .tool-versions propagates to ALL sync targets and is greped by
  sync-bulletproof-contracts.yaml to stamp a Docker image tag. A toolchain bump is therefore
  a multi-repo coordinated change, and has broken the forks before. Set breaksForks=true.
- snforge_std (Scarb.toml) and the starknet-foundry binary (.tool-versions) MUST move in
  lockstep or snforge rejects the mismatch. Never recommend moving one alone.
- If you recommend a devnet bump, VERIFY the corresponding Docker image tag actually exists
  before saying so, or the sync workflow will emit a broken tag.

Report: current vs latest, releases behind, whether the gap includes breaking changes, and
whether it fixes something that has previously bitten this project. Skip routine patch drift
in dev tooling — fold that into ONE informational finding, not twenty.`

const smokeTest = `${GUARDRAILS}

You are running an end-to-end smoke test of the published scaffold-stark toolchain against a
LOCAL devnet (free, no testnet funds). This phase may execute commands, but must NOT modify
the primary repo (REPO_ROOT) or any other git repository — work only inside a throwaway /tmp
directory.

Steps:
1. Work in a throwaway dir under /tmp (e.g. /tmp/stark-smoke).
2. Scaffold a fresh app from the CURRENTLY PUBLISHED CLI: npx create-stark@latest
   Report which version npx actually resolves to.
3. Install deps. Start the local devnet (starknet-devnet --seed 0, per packages/snfoundry
   "chain" script). Confirm it is listening before proceeding.
4. Compile and deploy the default contract to the devnet.
5. Verify the deploy ACTUALLY landed by querying the chain independently via RPC
   (get_class_hash_at / a view call) — do NOT trust the deploy script's own success message.
6. IMPORTANT: also check that the scaffolded project's scripts actually resolve their imports.
   Specifically run the verify-contracts / parse-deployments scripts, or at minimum
   typecheck them. A published template can scaffold fine and still ship a dangling import.
7. Tear down: stop devnet, delete the /tmp dir.

Report exactly what happened at each step, including the resolved create-stark version and
the deployed contract address. If ANY step fails, that is a blocker finding with the real
error output — do not paper over it, and do not retry more than twice. If the toolchain
required to run this is not installed locally, STOP and report that rather than improvising.`

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const SMOKE = (args && args.smoke) || 'devnet' // 'devnet' | 'none'

phase('Audit')
log(`Auditing primary + sync health + ${SIBLINGS.length} targets + upstream deps (smoke: ${SMOKE})`)

const auditTasks = [
  () => agent(primaryAudit, { label: 'repo:primary', phase: 'Audit', schema: FINDINGS }).then((r) => (r ? { area: 'primary-repo', ...r } : null)),
  () => agent(syncHealthAudit, { label: 'sync:health', phase: 'Audit', schema: FINDINGS }).then((r) => (r ? { area: 'sync-health', ...r } : null)),
  () => agent(siblingsAudit, { label: 'sync:targets', phase: 'Audit', schema: FINDINGS }).then((r) => (r ? { area: 'sync-targets', ...r } : null)),
  () => agent(upstreamAudit, { label: 'upstream:deps', phase: 'Audit', schema: FINDINGS }).then((r) => (r ? { area: 'upstream-deps', ...r } : null)),
]

const audits = (await parallel(auditTasks)).filter(Boolean)

let smoke = null
if (SMOKE !== 'none') {
  phase('Smoke')
  log('Running local devnet scaffold + deploy smoke test')
  smoke = await agent(smokeTest, { label: 'smoke:devnet', phase: 'Smoke', schema: FINDINGS })
  if (smoke) smoke = { area: 'smoke-devnet', ...smoke }
} else {
  log('Smoke test skipped (smoke: "none")')
}

const all = smoke ? [...audits, smoke] : audits

phase('Synthesize')

const report = await agent(
  `You are the final synthesizer for a drift check across the scaffold-stark ecosystem.
Below are the raw per-area audit results as JSON.

${JSON.stringify(all, null, 2)}

Produce a single decision-ready report:
1. A one-sentence verdict: does anything actually need updating right now, yes or no?
2. Findings ranked blocker > needs-update > nice-to-have. MERGE duplicates appearing in
   multiple areas into one finding naming all affected repos.
3. For each actionable finding, state whether it is CODE (needs a crew, and give the branch
   name you'd suggest) or OPS (a merge, close, branch delete, or review the captain does
   directly, and give the exact command or PR number).
4. Flag any finding with breaksForks=true as needing coordinated multi-repo rollout — this
   project syncs to 3 forks plus an intra-repo branch, and an unsynced toolchain bump has
   broken them before.
5. Explicitly list what was checked and found CLEAN, so the captain knows coverage — silence
   is not the same as verified.
6. Note scaffold-stark-rn is marked deferred in SIBLINGS. Report its state for awareness; do
   not rank it as actionable unless it has materially worsened.

Be blunt. If everything is fine, say so plainly rather than inventing busywork. Do not
recommend dependency upgrades that have no concrete payoff.`,
  { label: 'synthesize', phase: 'Synthesize', schema: FINDINGS }
)

return { verdict: report, areas: all.map((a) => a.area), smokeMode: SMOKE }
