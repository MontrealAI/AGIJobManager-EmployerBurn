import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || '.');
let checks = 0;
function check(name, fn) { fn(); checks++; console.log(`PASS ${name}`); }
for (const version of [0, 1, 2]) {
  const file = `ui/agijobmanagerburnv${version}.html`;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  const inline = scripts.filter((m) => !/\bsrc\s*=/.test(m[1]));
  check(`${file}: all inline scripts parse`, () => {
    assert.ok(inline.length >= 1);
    for (const [i, item] of inline.entries()) new vm.Script(item[2], { filename: `${file}#${i}` });
  });
}
const html = fs.readFileSync(path.join(root, 'ui/agijobmanagerburnv2.html'), 'utf8');
function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Missing function boundary ${start}`);
  return html.slice(a, b);
}
const burn = section('function buildEmployerBurnTrace(', 'function buildTraceAuditHtml(');
const summary = section('async function updateSummary(', 'function loadJobPrefs(');
const create = section('async function createJob(', 'async function applyForJob(');
const ctx = vm.createContext({});
vm.runInContext(burn, ctx);
for (const [payout, bps, expected] of [
  [0n, 500n, 0n], [10000n, 0n, 0n], [10000n, 500n, 500n],
  [199n, 50n, 0n], [10000n, 10000n, 10000n],
  [100000000000000000000n, 500n, 5000000000000000000n]
]) {
  check(`burn arithmetic: payout=${payout}, bps=${bps}`, () => {
    const value = ctx.buildEmployerBurnTrace(payout, bps);
    assert.equal(value.burnAmountRaw, expected);
    assert.equal(value.totalUpfrontRaw, payout + expected);
  });
}
async function verifySummary(readFails) {
  const elements = new Map();
  const methods = new Proxy({}, { get: (_, key) => () => ({ call: async () => {
    if (key === 'employerBurnBps') { if (readFails) throw Error('RPC unavailable'); return '750'; }
    return '3';
  } }) });
  const state = { employerBurnBps: 500, ensJobLabelPrefix: 'aijob', unrelatedField: 'preserved' };
  const context = vm.createContext({
    window: { protocolState: state }, APP_STATE: { wallet: { chainId: 1 } },
    agiJobManager: { methods }, agiToken: { methods }, userAccount: 'mock',
    el: (id) => { if (!elements.has(id)) elements.set(id, {}); return elements.get(id); },
    runSafeReadStep: async (_, fn) => { try { return await fn(); } catch { return { __safeReadError: true }; } },
    secondsToHuman: String, formatUnitsToAmount: String,
    updateCalculator() {}, updateCreateJobEconomicsPreview() {}, async updateDynamicInsights() {}
  });
  vm.runInContext(summary, context);
  await context.updateSummary();
  check(`protocol-state merge (${readFails ? 'failed' : 'successful'} burn read)`, () => {
    assert.equal(context.window.protocolState.employerBurnBps, readFails ? 500 : 750);
    assert.equal(context.window.protocolState.ensJobLabelPrefix, 'aijob');
    assert.equal(context.window.protocolState.unrelatedField, 'preserved');
    assert.equal(context.window.protocolState.chainId, 1);
  });
}
await verifySummary(false);
await verifySummary(true);

async function verifyCreate({ name, freshBps = '1000', balance = 11000n, allowance = 11000n, approvalOk = true, sends = 1 }) {
  let review, approved, sent = 0;
  const toasts = [];
  const fields = { jobSpecURI: 'ipfs://example', jobDetails: 'Local test', jobPayout: '10000', jobDuration: '3600' };
  const context = vm.createContext({
    console, userAccount: 'mock', lastUploadedMetadataURI: null,
    requireConnected: () => true, mustBeReadyToWrite: () => true, saveBuilderDraft() {},
    el: (id) => ({ value: fields[id] || '' }),
    normalizeIpfsLikeUri: (value) => ({ valid: true, canonical: value }), isValidUriLoose: () => true,
    parseAmountToUnits: BigInt, formatUnitsToAmount: String, secondsToHuman: String,
    getProtocolBigInt: () => 500n, openActionReview: (value) => { review = value; },
    setToast: (value) => toasts.push(value),
    runSafeReadStep: async () => freshBps,
    ensureApproval: async (amount) => { approved = amount; return { ok: approvalOk }; },
    getTokenBalanceAndAllowance: async () => ({ balance, allowance }),
    runTrackedTx: async (_, fn) => fn(), refreshAll: async () => {},
    agiJobManager: { methods: { createJob: () => ({ send: async () => { sent++; return {}; } }) } }
  });
  vm.runInContext(burn + create, context);
  await context.createJob();
  assert.ok(review, 'Review must open before transactions');
  assert.equal(sent, 0);
  let error;
  try { await review.run(); } catch (e) { error = e; }
  check(name, () => {
    assert.equal(approved, freshBps?.__safeReadError ? 10500n : 10000n + BigInt(freshBps));
    assert.equal(sent, sends);
    if (approvalOk && sends === 0) assert.match(error?.message || '', /preflight drifted/);
  });
}
await verifyCreate({ name: 'fresh burn rate determines approval and send' });
await verifyCreate({ name: 'insufficient final balance prevents send', balance: 10999n, sends: 0 });
await verifyCreate({ name: 'insufficient final allowance prevents send', allowance: 10999n, sends: 0 });
await verifyCreate({ name: 'cancelled approval prevents send', approvalOk: false, sends: 0 });
await verifyCreate({ name: 'failed fresh burn read uses cached rate (documented limitation)', freshBps: { __safeReadError: true } });
console.log(`\n${checks} release UI checks passed. Mocked logic checks; no browser wallet or live-chain transactions.`);
