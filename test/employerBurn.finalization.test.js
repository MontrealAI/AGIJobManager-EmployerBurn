const assert = require('assert');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);
const EMPTY_PROOF = [];
const { toBN, toWei } = web3.utils;

contract('AGIJobManager completion-only employer-funded burn reserve', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator, relayer] = accounts;
  let token;
  let manager;

  async function setup() {
    token = await MockERC20.new({ from: owner });
    manager = await AGIJobManager.new(
      token.address,
      'ipfs://base',
      [ZERO_ADDRESS, ZERO_ADDRESS],
      [ZERO_ROOT, ZERO_ROOT, ZERO_ROOT, ZERO_ROOT],
      [ZERO_ROOT, ZERO_ROOT],
      { from: owner }
    );

    await manager.addModerator(moderator, { from: owner });
    await manager.addAdditionalAgent(agent, { from: owner });
    await manager.addAdditionalValidator(validatorA, { from: owner });
    await manager.addAdditionalValidator(validatorB, { from: owner });
    await manager.setRequiredValidatorApprovals(2, { from: owner });
    await manager.setRequiredValidatorDisapprovals(2, { from: owner });
    await manager.setChallengePeriodAfterApproval(1, { from: owner });
    await manager.setEmployerBurnBps(100, { from: owner });

    const agiType = await MockERC721.new({ from: owner });
    await agiType.mint(agent, { from: owner });
    await manager.addAGIType(agiType.address, 92, { from: owner });

    await token.mint(agent, toWei('1000'), { from: owner });
    await token.mint(validatorA, toWei('1000'), { from: owner });
    await token.mint(validatorB, toWei('1000'), { from: owner });
    await token.approve(manager.address, toWei('1000'), { from: agent });
    await token.approve(manager.address, toWei('1000'), { from: validatorA });
    await token.approve(manager.address, toWei('1000'), { from: validatorB });
  }

  async function createJobAndRequest(payout) {
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    return { jobId, burn };
  }

  it('burns exact reserve amount on successful completion only', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    const supplyBefore = await token.totalSupply();
    const tx = await manager.finalizeJob(jobId, { from: relayer });
    const executed = tx.logs.find((l) => l.event === 'CompletionBurnExecuted');
    assert.ok(executed);
    assert.equal(executed.args.jobId.toNumber(), jobId);
    assert.equal(executed.args.employer, employer);
    assert.equal(executed.args.amount.toString(), burn.toString());
    assert.equal(executed.args.finalizer, relayer);
    assert.equal(executed.args.settlementPathCode.toString(), '1');
    assert.equal(executed.args.burnMode.toString(), '1');

    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());
    assert.equal((await manager.lockedBurnReserve()).toString(), '0');
  });

  it('does not burn and refunds reserve on employer-win dispute outcome', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    const supplyBefore = await token.totalSupply();
    const tx = await manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator });

    assert.equal(Boolean(tx.logs.find((l) => l.event === 'CompletionBurnExecuted')), false);
    const refunded = tx.logs.find((l) => l.event === 'CompletionBurnReserveRefunded');
    assert.ok(refunded);
    assert.equal(refunded.args.amount.toString(), burn.toString());
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.toString(), supplyAfter.toString());
  });

  it('refunds reserve on cancel and expiry paths (no burn)', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn).muln(2), { from: owner });
    await token.approve(manager.address, payout.add(burn).muln(2), { from: employer });

    const createdA = await manager.createJob('ipfs-cancel', payout, 3600, 'details', { from: employer });
    const cancelJobId = createdA.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    const cancelTx = await manager.cancelJob(cancelJobId, { from: employer });
    assert.equal(Boolean(cancelTx.logs.find((l) => l.event === 'CompletionBurnExecuted')), false);
    assert.ok(cancelTx.logs.find((l) => l.event === 'CompletionBurnReserveRefunded'));

    const createdB = await manager.createJob('ipfs-expiry', payout, 1, 'details', { from: employer });
    const expireJobId = createdB.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(expireJobId, '', EMPTY_PROOF, { from: agent });
    await time.increase(2);
    const expireTx = await manager.expireJob(expireJobId, { from: relayer });
    assert.equal(Boolean(expireTx.logs.find((l) => l.event === 'CompletionBurnExecuted')), false);
    assert.ok(expireTx.logs.find((l) => l.event === 'CompletionBurnReserveRefunded'));
  });

  it('does not burn on tie/under-quorum dispute forcing path', async () => {
    await setup();
    await manager.setRequiredValidatorDisapprovals(3, { from: owner });
    const payout = toBN(toWei('100'));
    const { jobId } = await createJobAndRequest(payout);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(8 * 24 * 3600);
    const finalizeTx = await manager.finalizeJob(jobId, { from: relayer });
    assert.ok(finalizeTx.logs.find((l) => l.event === 'JobDisputed'));
    assert.equal(Boolean(finalizeTx.logs.find((l) => l.event === 'CompletionBurnExecuted')), false);
  });

  it('burns on dispute resolution in favor of successful completion', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    const supplyBefore = await token.totalSupply();
    const tx = await manager.resolveDisputeWithCode(jobId, 1, 'agent wins', { from: moderator });
    const executed = tx.logs.find((l) => l.event === 'CompletionBurnExecuted');
    assert.ok(executed);
    assert.equal(executed.args.amount.toString(), burn.toString());
    assert.equal(executed.args.settlementPathCode.toString(), '2');
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());
  });

  it('burn reserve is not withdrawable protocol revenue and cannot burn twice', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);

    assert.equal((await manager.withdrawableAGI()).toString(), '0');
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const tx = await manager.finalizeJob(jobId, { from: relayer });
    const burnEvents = tx.logs.filter((l) => l.event === 'CompletionBurnExecuted');
    assert.equal(burnEvents.length, 1);

    await expectRevert.unspecified(manager.finalizeJob(jobId, { from: relayer }));
    const post = await manager.getJobBurnFunding(jobId);
    assert.equal(post.toString(), '0');
    assert.equal((await manager.lockedBurnReserve()).toString(), '0');
    assert.equal((await manager.withdrawableAGI()).toString(), '0');

    assert.equal(burn.toString(), burn.toString());
  });
});
