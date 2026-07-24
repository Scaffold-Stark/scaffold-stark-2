#!/usr/bin/env node
/**
 * stark-cdp-with-wallet/braavos.mjs — Braavos wallet primitives: read the
 * Keychain secret, check vault setup state, unlock, and approve a pending
 * connect/transaction request. This is the reusable part of the skill —
 * callers bring their own dapp page (a CDP target already navigated to the
 * app under test, see stark-smoke-test-browser.mjs) and their own Chrome
 * launch (see ./launch.mjs); this file only knows how to drive Braavos's
 * own extension pages via raw CDP.
 *
 * Extracted from stark-demo-web.mjs (formerly .claude/workflows/). The
 * technique (enumerate CDP targets, find the extension's own page by URL
 * prefix, attach a WebSocket directly to it) matches the in-repo precedent
 * in stark-smoke-test-browser.mjs and an internal Playwright helper this
 * was ported from — only the technique carries over, not any selector.
 *
 * Finding a Keychain entry is NOT the same as the password being correct —
 * the entry can hold a stale value from before the wallet's password last
 * changed. This module never treats "entry exists" as "password confirmed
 * working"; only a real unlock attempt against the live wallet does that.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { CDP_PORT, PROFILE_DIR, BRAAVOS_ID, listTargets } from "./launch.mjs";
import { waitFor, openTab, closeTab, connectSession, captureScreenshot } from "../stark-smoke-test/stark-smoke-test-browser.mjs";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** CdpSession.send() has no built-in timeout — a target that goes
 * unresponsive (an MV3 service worker torn down mid-request, observed once
 * here) leaves the promise pending forever instead of rejecting. Race it
 * against a timer so that failure mode surfaces as a reported error. */
function withTimeout(promise, ms, label) {
  return Promise.race([promise, sleep(ms).then(() => Promise.reject(new Error(`Timed out after ${ms}ms: ${label}`)))]);
}

// ----------------------------------------------------------- keychain ---

export const KEYCHAIN_SERVICE = "scaffold-stark-braavos";
export const KEYCHAIN_HELP =
  `Không có Keychain entry "${KEYCHAIN_SERVICE}". Tạo bằng:\n` +
  `  security add-generic-password -s ${KEYCHAIN_SERVICE} -a braavos -w '<mật khẩu Braavos thật>'\n` +
  `Không đoán, không fallback sang env var.`;

/**
 * Reads the Braavos password from the macOS Keychain — never an env var,
 * never logged, never returned in any report() detail. Finding an entry only
 * means an entry exists; it says nothing about whether the password inside
 * it still matches the live wallet (see the module header comment) — callers
 * must always follow this with a real unlock attempt, never trust `found`
 * alone as "password confirmed".
 */
export function readBraavosPasswordFromKeychain() {
  try {
    const out = execSync(`security find-generic-password -s ${KEYCHAIN_SERVICE} -w`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const password = out.replace(/\n$/, "");
    // The command can exit 0 with an empty value (e.g. the write half of a
    // `security add-generic-password` failed after the entry itself was
    // created — observed here after a disk-full error) — a real, distinct
    // state from "no entry at all", not the same failure.
    if (!password) return { found: true, empty: true };
    return { found: true, empty: false, password };
  } catch (err) {
    return { found: false, exitCode: err.status ?? null };
  }
}

// -------------------------------------------------------------- chrome ---

function readBraavosPopupUrl() {
  const extBase = path.join(PROFILE_DIR, "Default", "Extensions", BRAAVOS_ID);
  const versions = fs.readdirSync(extBase).filter((v) => fs.statSync(path.join(extBase, v)).isDirectory());
  if (!versions.length) throw new Error(`Braavos not found under ${extBase}`);
  const manifest = JSON.parse(fs.readFileSync(path.join(extBase, versions[0], "manifest.json"), "utf8"));
  const popupFile = manifest.action?.default_popup ?? manifest.browser_action?.default_popup ?? "index.html";
  return `chrome-extension://${BRAAVOS_ID}/${popupFile}`;
}

/**
 * Prefers the real "service_worker" target (bg-loader.js) strictly over any
 * "background_page" target — measured that Braavos also exposes a
 * background_page-typed offscreen.html target, and matching either type
 * loosely let `.find()` sometimes grab that one instead, whose execution
 * context does not have chrome.storage bound (real symptom hit: "Cannot read
 * properties of undefined (reading 'local')" even after retries/wake).
 */
export async function findServiceWorkerTarget() {
  const targets = await listTargets(CDP_PORT);
  const prefix = `chrome-extension://${BRAAVOS_ID}/`;
  const serviceWorker = targets.find((t) => t.type === "service_worker" && t.url.startsWith(prefix));
  if (serviceWorker) return serviceWorker;
  return targets.find((t) => t.type === "background_page" && t.url.startsWith(prefix) && !t.url.includes("offscreen"));
}

// ------------------------------------------------------- wallet unlock ---

/** Distinguishes "not set up" from "locked"/"unlocked" via real storage
 * evidence (walletVault/defiVault-style keys), not inference from the popup
 * alone — the popup's password-field signal cannot tell setup-vs-unlocked
 * apart on its own (both show no password field). */
export async function checkWalletSetupState() {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    // A CDP target listing for a service_worker can exist before that
    // worker's own global scope has finished bootstrapping the chrome.*
    // namespace (observed: chrome.storage undefined right after attaching).
    // Force a fresh wake via the popup every attempt (not just when no
    // target is found at all) rather than trusting a possibly-still-starting
    // worker reference.
    let popupTab;
    try {
      popupTab = await openTab(CDP_PORT, readBraavosPopupUrl());
      await sleep(1500);
    } finally {
      if (popupTab) await closeTab(CDP_PORT, popupTab.id);
    }
    const target = await findServiceWorkerTarget();
    if (!target) {
      const all = await listTargets(CDP_PORT);
      const braavosTargets = all.filter((t) => t.url.startsWith(`chrome-extension://${BRAAVOS_ID}/`)).map((t) => ({ type: t.type, url: t.url }));
      lastError = new Error(`no service_worker/background_page target found. Braavos-related targets present: ${JSON.stringify(braavosTargets)}`);
      await sleep(1000);
      continue;
    }

    const session = await connectSession(target.webSocketDebuggerUrl);
    try {
      await sleep(500); // let the worker's own init finish before evaluating
      const summary = await withTimeout(
        session.evaluate(`
          (async () => {
            const all = await chrome.storage.local.get(null);
            const keys = Object.keys(all);
            const hintWords = ["vault", "keyring", "keystore", "account", "wallet"];
            const keyHints = keys.filter((k) => hintWords.some((h) => k.toLowerCase().includes(h)));
            return { totalKeys: keys.length, keyHints };
          })()
        `),
        10_000,
        "chrome.storage.local.get against Braavos service worker"
      );
      return { vaultPresent: summary.keyHints.length > 0, summary };
    } catch (err) {
      lastError = err;
      await sleep(1000);
    } finally {
      session.close();
    }
  }
  return { vaultPresent: null, error: `chrome.storage.local.get failed after 3 attempts: ${String(lastError?.message ?? lastError)}` };
}

/** Unconditional CDP Input.insertText — never HTMLInputElement's value
 * setter. insertText never touches page globals, so it works whether or not
 * Braavos scuttles globals; the value-setter trick only works when it
 * doesn't. One approach dominates in both worlds — measuring which world
 * we're in was never necessary (see spike/braavos-cdp-headless M5/M4). */
export async function attemptUnlock(password) {
  let tab;
  try {
    tab = await openTab(CDP_PORT, readBraavosPopupUrl());
    const session = await connectSession(tab.webSocketDebuggerUrl);
    try {
      await sleep(1200);
      const hasPasswordField = await session.evaluate(`!!document.querySelector('input[type="password"]')`);
      if (!hasPasswordField) return { state: "NO_PASSWORD_FIELD" };

      await session.evaluate(`document.querySelector('input[type="password"]').focus()`);
      await session.send("Input.insertText", { text: password });
      const len = await session.evaluate(`document.querySelector('input[type="password"]').value.length`);
      if (len === 0) return { state: "INSERT_FAILED", detail: "Input.insertText left the password field empty." };

      await session.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await session.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      await sleep(2000);

      const after = await session.evaluate(`
        (() => {
          const pw = document.querySelector('input[type="password"]');
          return { stillPresent: !!pw, ariaInvalid: pw ? pw.getAttribute('aria-invalid') : null, hasAlert: !!document.querySelector('[role="alert"]') };
        })()
      `);
      if (!after.stillPresent) return { state: "UNLOCKED" };
      if (after.ariaInvalid === "true" || after.hasAlert) return { state: "REJECTED", detail: after };
      return { state: "UNKNOWN", detail: after };
    } finally {
      session.close();
    }
  } finally {
    if (tab) await closeTab(CDP_PORT, tab.id);
  }
}

// ------------------------------------------------- Braavos request UI ---

// Dapp-request paths that appear in the side panel's URL when it has a
// pending request to show — same list as the proven reference this was
// ported from.
const DAPP_REQUEST_PATHS = ["dapp-request", "transaction", "sign-message", "sign-transaction"];

/**
 * Braavos's side panel is a SINGLETON target reused across requests — it is
 * NOT a fresh popup per request. Measured directly: the same target's URL
 * went from `side-panel.html?nav={"path":"/dapp-request",...}` to bare
 * `side-panel.html` after an in-panel unlock lost the pending request state.
 * Matching "any new target ID" (the original approach) misses this reuse
 * entirely — match on URL path content instead, exactly like the reference
 * implementation this was ported from.
 */
export async function waitForBraavosRequestTarget(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const targets = await listTargets(CDP_PORT);
    const candidate = targets.find(
      (t) => t.type === "page" && t.url.startsWith(`chrome-extension://${BRAAVOS_ID}/`) && DAPP_REQUEST_PATHS.some((p) => t.url.includes(p))
    );
    if (candidate) return candidate;
    await sleep(400);
  }
  return null;
}

/**
 * Approves whatever Braavos request popup/side-panel is currently open
 * (connect or transaction confirm). Tries structural queries first
 * (button / role="button" / tabindex) since that's locale-proof; only falls
 * back to searching for known English action words (Connect/Approve/
 * Confirm/Accept/Sign) once structural search is measured to find nothing —
 * this build (4.19.6) renders its UI with React Native Web, plain <div>s
 * with synthetic pointer handlers and no semantic roles at all, confirmed via
 * a live DOM dump, not assumed. Braavos's own UI text is confirmed English
 * regardless of profile locale (title="Braavos"), unlike the localization
 * risk that applies to this app's own frontend, so the text fallback here is
 * measured-safe, not the same class of guess the brief warns against. The
 * primary action is assumed to be the last candidate found (Cancel/Reject
 * first, Confirm/Approve last) — unverified against a live approval screen,
 * so a wrong click surfaces as a THẤT BẠI on the next step, not silently.
 */
/**
 * A DOM.performSearch text-query match lands on a #text node — walk up to
 * its parent element (the actual clickable React Native Web div) and
 * resolve its box model + a short text/tag description. Returns null if the
 * node has no visible box (hidden/zero-size).
 */
async function resolveTextNodeToClickable(session, nodeId) {
  const resolved = await session.send("DOM.resolveNode", { nodeId }).catch(() => null);
  if (!resolved?.object?.objectId) return null;
  const parentResult = await session
    .send("Runtime.callFunctionOn", {
      objectId: resolved.object.objectId,
      functionDeclaration: "function() { const n = this.nodeType === 3 ? this.parentElement : this; return n; }",
      returnByValue: false,
    })
    .catch(() => null);
  if (!parentResult?.result?.objectId) return null;
  const box = await session.send("DOM.getBoxModel", { objectId: parentResult.result.objectId }).catch(() => null);
  if (!box?.model?.content) return null;
  const c = box.model.content;
  const info = await session
    .send("Runtime.callFunctionOn", {
      objectId: parentResult.result.objectId,
      functionDeclaration: "function() { return { tag: this.tagName, text: (this.innerText||this.textContent||'').slice(0,40) }; }",
      returnByValue: true,
    })
    .catch(() => null);
  return {
    cx: (c[0] + c[2] + c[4] + c[6]) / 4,
    cy: (c[1] + c[3] + c[5] + c[7]) / 4,
    tag: info?.result?.value?.tag ?? null,
    text: info?.result?.value?.text ?? null,
  };
}

async function clickPoint(session, cx, cy) {
  await session.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx, y: cy });
  await session.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
  await session.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx, y: cy, button: "left", clickCount: 1 });
}

export async function approveBraavosRequest(target, password, logDir, attachExtraNetworkCapture) {
  const session = await connectSession(target.webSocketDebuggerUrl);
  try {
    // The invoke-transaction RPC call is very likely made by Braavos's own
    // extension context, not observable from the dapp tab's Network domain —
    // capture it here too, since the tab-side capture came back empty on a
    // real run that otherwise showed a successful-looking approval click.
    // (attachExtraNetworkCapture is app-specific instrumentation — e.g.
    // stark-demo-web.mjs's attachTxHashCapture — supplied by the caller so
    // this module never depends back on its own caller.)
    await session.send("Network.enable");
    if (attachExtraNetworkCapture) attachExtraNetworkCapture(session);
    // The side panel shows a logo/spinner splash for a variable amount of
    // time (measured 2-6s+) before settling into either a lock screen or the
    // real request content — a trivial body shell ("just the splash") or a
    // not-yet-mounted #root both look like "content present" to a shallow
    // check, so poll for one of the two real end states specifically.
    const settled = await waitFor(
      () =>
        session.evaluate(`
          (() => {
            if (!document.body) return null;
            if (document.querySelector('input[type="password"]')) return 'locked';
            const text = (document.body.innerText || '').trim();
            return text.length > 20 && text !== 'Braavos' ? 'content' : null;
          })()
        `),
      { timeoutMs: 15_000, intervalMs: 400 }
    );
    if (!settled.ready) throw new Error(`Braavos request UI never got past its loading splash within ${Math.round(settled.waitedMs / 1000)}s.`);

    if (settled.result === "locked") {
      if (!password) throw new Error("Braavos request popup is locked and no password was supplied (Keychain entry missing).");
      await session.evaluate(`document.querySelector('input[type="password"]').focus()`);
      await session.send("Input.insertText", { text: password });

      // Login is itself a React Native Web div, not a real <button> — find
      // it via the same structural-then-text approach as the approve action.
      await session.send("DOM.enable");
      await session.send("DOM.getDocument", { depth: -1, pierce: true });
      const loginSearch = await session.send("DOM.performSearch", { query: "Login", includeUserAgentShadowDOM: true });
      if (loginSearch.resultCount) {
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: loginSearch.searchId, fromIndex: 0, toIndex: loginSearch.resultCount });
        for (const nodeId of nodeIds) {
          const point = await resolveTextNodeToClickable(session, nodeId);
          if (point) {
            await clickPoint(session, point.cx, point.cy);
            break;
          }
        }
      } else {
        // Fall back to Enter, in case there's no separate Login button.
        await session.send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
        await session.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
      }
      await sleep(3000);

      // Measured: unlocking THROUGH the side panel's own lock screen can
      // reset it to the wallet's home dashboard, dropping the pending
      // request's URL state (`?nav={"path":"/dapp-request",...}` -> bare
      // `side-panel.html`) — Braavos does not resume the request on its own.
      // Report this distinctly so the caller can retry the whole
      // click-connect/click-send step, which re-triggers a fresh request
      // against the now-unlocked wallet instead of failing silently.
      const stillOnRequest = await session
        .evaluate(`${JSON.stringify(DAPP_REQUEST_PATHS)}.some((p) => location.href.includes(p))`)
        .catch(() => false);
      if (!stillOnRequest) {
        return { lostContext: true, reason: "unlock reset the side panel away from the pending request" };
      }
    }

    await session.send("DOM.enable");
    // Measured: this Braavos build (4.19.6) renders its request UI with
    // React Native Web (`css-... r-...` atomic classes observed directly) —
    // clickable areas are plain <div>s with React's synthetic pointer
    // handlers, no <button>, no role="button", no shadow DOM at all. Three
    // structural query attempts all returned 0 real results (not a timing
    // issue — identical diagnostic across independent runs). Braavos's own
    // UI is confirmed English regardless of profile locale (title="Braavos"),
    // unlike this app's own frontend concern about localization, so falling
    // back to text search here is measured, not guessed — the same
    // technique already proven against this exact wallet in the internal
    // Playwright helper this was ported from.
    const STRUCTURAL_QUERIES = ['button', '[role="button"]', 'button, [role="button"], a[role="button"], [tabindex="0"]'];
    const TEXT_CANDIDATES = ["Connect", "Approve", "Confirm", "Accept", "Sign"];
    // Words identifying the PRIMARY action vs. the reject action — Braavos's
    // own UI is confirmed English regardless of profile locale (see above).
    const ACTION_RE = /\b(confirm|approve|connect|accept|sign|login)\b/i;
    const REJECT_RE = /\b(reject|cancel|decline|close)\b/i;

    /** Resolve one search hit to a clickable description: center point plus
     * the text/tag/disabled evidence needed to pick by identity, not order —
     * a blind last-candidate click at (180,696) left a tx request pending
     * forever (neither confirmed nor rejected), so order-picking is banned. */
    const describeNode = async (nodeId) => {
      const box = await session.send("DOM.getBoxModel", { nodeId }).catch(() => null);
      if (!box?.model?.content) return null;
      const c = box.model.content;
      const resolved = await session.send("DOM.resolveNode", { nodeId }).catch(() => null);
      let tag = null, text = null, disabled = false;
      if (resolved?.object?.objectId) {
        const info = await session
          .send("Runtime.callFunctionOn", {
            objectId: resolved.object.objectId,
            functionDeclaration:
              "function() { return { tag: this.tagName, text: (this.innerText || this.textContent || '').trim().slice(0, 60), disabled: !!this.disabled || this.getAttribute('aria-disabled') === 'true' }; }",
            returnByValue: true,
          })
          .catch(() => null);
        tag = info?.result?.value?.tag ?? null;
        text = info?.result?.value?.text ?? null;
        disabled = info?.result?.value?.disabled ?? false;
      }
      return { cx: (c[0] + c[2] + c[4] + c[6]) / 4, cy: (c[1] + c[3] + c[5] + c[7]) / 4, tag, text, disabled };
    };

    const collectCandidates = async () => {
      for (const query of STRUCTURAL_QUERIES) {
        await session.send("DOM.getDocument", { depth: -1, pierce: true });
        const search = await session.send("DOM.performSearch", { query, includeUserAgentShadowDOM: true });
        if (!search.resultCount) continue;
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: search.searchId, fromIndex: 0, toIndex: search.resultCount });
        const out = [];
        for (const nodeId of nodeIds) {
          const d = await describeNode(nodeId);
          if (d) out.push(d);
        }
        if (out.length) return { usedQuery: query, candidates: out };
      }
      return await collectTextCandidates();
    };

    // Text-leaf search for the action words themselves. Needed both when no
    // structural hit exists (connect screen) AND when structural hits are
    // only wrapper containers — measured: the tx screen's sole bottom hit is
    // one DIV whose text is "Decline\nSign" (both buttons in one box), so
    // identity-picking on structural results alone can never resolve it.
    // Prefer elements whose own text is EXACTLY the word ("Sign"), otherwise
    // a header like "Sign Transaction" would win the text search.
    const collectTextCandidates = async () => {
      for (const word of TEXT_CANDIDATES) {
        await session.send("DOM.getDocument", { depth: -1, pierce: true });
        const textSearch = await session.send("DOM.performSearch", { query: word, includeUserAgentShadowDOM: true });
        if (!textSearch.resultCount) continue;
        const out = [];
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: textSearch.searchId, fromIndex: 0, toIndex: textSearch.resultCount });
        for (const nodeId of nodeIds) {
          const point = await resolveTextNodeToClickable(session, nodeId);
          if (point) out.push({ ...point, disabled: false, word });
        }
        const exact = out.filter((c) => (c.text || "").trim() === word);
        if (exact.length) return { usedQuery: `text:"${word}" (exact)`, candidates: exact };
        if (out.length) return { usedQuery: `text:"${word}"`, candidates: out };
      }
      return { usedQuery: null, candidates: [] };
    };

    const pickAction = (list) =>
      [...list].reverse().find((c) => c.text && ACTION_RE.test(c.text) && !REJECT_RE.test(c.text) && !c.disabled) ?? null;

    // The tx-confirm screen's primary button can appear/enable only after fee
    // estimation finishes — re-poll until an enabled action-word candidate
    // shows up instead of clicking whatever is there first.
    // On the tx-confirm screen the Sign button stays disabled until fee
    // estimation completes ("Network Fee" shows "-" while estimating, and a
    // disabled RNW div is indistinguishable from an enabled one in DOM).
    // Wait for the fee value to materialize before picking a button.
    // A loading shimmer leaves the fee line EMPTY (innerText jumps straight
    // to "Decline") — measured: treating "no dash" as done clicked a still-
    // disabled Sign. Only a fee line containing a digit counts as settled,
    // and an estimation error fails fast instead of waiting out the clock.
    const feeSettled = await waitFor(
      () =>
        session.evaluate(`
          (() => {
            const t = document.body ? (document.body.innerText || '') : '';
            if (/Transaction execution error/i.test(t)) return 'estimation_error';
            if (!/Network Fee/i.test(t)) return 'no_fee_row';
            const m = t.match(/Network Fee\\s*\\n\\s*([^\\n]*)/);
            const line = m ? m[1].trim() : '';
            return /[0-9]/.test(line) && line !== '-' ? 'fee_shown' : null;
          })()
        `),
      { timeoutMs: 45_000, intervalMs: 800 }
    );
    if (feeSettled.ready && feeSettled.result === "estimation_error") {
      const t = await session.evaluate(`document.body ? (document.body.innerText || '').slice(0, 400) : ''`).catch(() => "");
      const errShot = path.join(logDir, `demo-web-panel-esterror-${Date.now()}.png`);
      await captureScreenshot(session, errShot).catch(() => {});
      throw new Error(`Braavos fee estimation FAILED (Transaction execution error shown). Panel text: ${JSON.stringify(t)}. Screenshot: ${errShot}`);
    }
    if (!feeSettled.ready) {
      const t = await session.evaluate(`document.body ? (document.body.innerText || '').slice(0, 400) : ''`).catch(() => "");
      // Do not click anything — an unestimatable tx means Sign never enables.
      const feeShot = path.join(logDir, `demo-web-panel-feestuck-${Date.now()}.png`);
      await captureScreenshot(session, feeShot).catch(() => {});
      throw new Error(`Braavos fee estimation never completed within 30s (Network Fee still "-"). Panel text: ${JSON.stringify(t)}. Screenshot: ${feeShot}`);
    }

    let usedQuery = null;
    let candidates = [];
    let primary = null;
    const pollDeadline = Date.now() + 25_000;
    while (Date.now() < pollDeadline) {
      ({ usedQuery, candidates } = await collectCandidates());
      primary = pickAction(candidates);
      if (primary) break;
      // Structural hits can be container-only (see collectTextCandidates) —
      // fall through to a text-leaf pass before waiting another round.
      const textOnly = await collectTextCandidates();
      const textPick = pickAction(textOnly.candidates);
      if (textPick) {
        ({ usedQuery, candidates } = textOnly);
        primary = textPick;
        break;
      }
      await sleep(1200);
    }

    const shot = path.join(logDir, `demo-web-panel-${Date.now()}.png`);
    await captureScreenshot(session, shot).catch(() => {});

    if (!primary) {
      // Measured on a real run: the panel showed "41: Transaction execution
      // error" with a disabled Sign button — the blocker is the wallet's own
      // fee-estimation/simulation failing, not the click. If a "See Error"
      // link is present, open it and screenshot the detail as evidence.
      let errorShot = null;
      await session.send("DOM.getDocument", { depth: -1, pierce: true });
      const errSearch = await session.send("DOM.performSearch", { query: "See Error", includeUserAgentShadowDOM: true }).catch(() => null);
      if (errSearch?.resultCount) {
        const { nodeIds } = await session.send("DOM.getSearchResults", { searchId: errSearch.searchId, fromIndex: 0, toIndex: errSearch.resultCount });
        for (const nodeId of nodeIds) {
          const point = await resolveTextNodeToClickable(session, nodeId);
          if (point) {
            await clickPoint(session, point.cx, point.cy);
            await sleep(2000);
            errorShot = path.join(logDir, `demo-web-panel-error-${Date.now()}.png`);
            await captureScreenshot(session, errorShot).catch(() => {});
            break;
          }
        }
      }
      const panelText = await session.evaluate(`document.body ? (document.body.innerText || '').slice(0, 1500) : ''`).catch(() => "");
      throw new Error(
        `No enabled action button (${String(ACTION_RE)}) appeared in the Braavos request UI within 25s. ` +
          `Refusing to blind-click by position. Candidates seen: ${JSON.stringify(
            candidates.map((c) => ({ tag: c.tag, text: c.text, disabled: c.disabled, x: Math.round(c.cx), y: Math.round(c.cy) }))
          )}. Screenshot: ${shot}${errorShot ? ` — error detail screenshot: ${errorShot}` : ""}. Panel text: ${JSON.stringify(panelText)}`
      );
    }

    // Click-and-verify: a click on a still-disabled RNW div is a silent
    // no-op (DOM can't tell the two apart), so after each click check that
    // the request screen actually went away; if not, re-resolve and click
    // again until the deadline.
    let clickAttempts = 0;
    const clickDeadline = Date.now() + 40_000;
    let panelChanged = false;
    while (Date.now() < clickDeadline) {
      await clickPoint(session, primary.cx, primary.cy);
      clickAttempts++;
      await sleep(2500);
      const still = await session
        .evaluate(`document.body ? /Decline/.test(document.body.innerText || '') && ${JSON.stringify(DAPP_REQUEST_PATHS)}.some((p) => location.href.includes(p)) : false`)
        .catch(() => false); // an evaluate failure usually means the panel target closed = accepted
      if (!still) {
        panelChanged = true;
        break;
      }
      const again = await collectTextCandidates();
      const p2 = pickAction(again.candidates);
      if (p2) primary = p2;
    }
    const afterShot = path.join(logDir, `demo-web-panel-after-${Date.now()}.png`);
    await captureScreenshot(session, afterShot).catch(() => {});
    return {
      query: usedQuery,
      candidates: candidates.map((c) => ({ tag: c.tag, text: c.text, disabled: c.disabled, word: c.word, x: Math.round(c.cx), y: Math.round(c.cy) })),
      clicked: { tag: primary.tag, text: primary.text, x: Math.round(primary.cx), y: Math.round(primary.cy) },
      clickAttempts,
      panelChanged,
      screenshot: shot,
      afterScreenshot: afterShot,
    };
  } finally {
    session.close();
  }
}
