const assert = require('assert');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');
const ERC20NoReturn = artifacts.require('ERC20NoReturn');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);
const EMPTY_PROOF = [];
const { toBN, toWei } = web3.utils;

contract('AGIJobManager employer-funded burn settlement', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator] = accounts;
  let token;
  let manager;

  async function setup({ burnBps = 100 } = {}) {
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
    await manager.setEmployerBurnBps(burnBps, { from: owner });

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

  async function createJobAndRequest(payout, extraAllowance = toBN(0)) {
    await token.mint(employer, payout.add(extraAllowance), { from: owner });
    await token.approve(manager.address, payout.add(extraAllowance), { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    return jobId;
  }

  async function moveToEmployerWin(jobId) {
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    return manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator });
  }

  it('burns exact amount on employer-win dispute resolution', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const jobId = await createJobAndRequest(payout, burn);

    const supplyBefore = await token.totalSupply();
    const tx = await moveToEmployerWin(jobId);

    const enforced = tx.logs.find((l) => l.event === 'EmployerBurnEnforced');
    assert.ok(enforced);
    assert.equal(enforced.args.jobId.toNumber(), jobId);
    assert.equal(enforced.args.employer, employer);
    assert.equal(enforced.args.token, token.address);
    assert.equal(enforced.args.amount.toString(), burn.toString());
    assert.equal(enforced.args.finalizer, moderator);
    assert.equal(enforced.args.settlementPathCode.toString(), '2');

    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());
  });

  it('burns exact amount on stale-dispute employer-win owner resolution', async () => {
    await setup();
    await manager.setDisputeReviewPeriod(1, { from: owner });
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const jobId = await createJobAndRequest(payout, burn);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    const supplyBefore = await token.totalSupply();
    const tx = await manager.resolveStaleDispute(jobId, true, { from: owner });
    const enforced = tx.logs.find((l) => l.event === 'EmployerBurnEnforced');
    assert.ok(enforced);
    assert.equal(enforced.args.jobId.toNumber(), jobId);
    assert.equal(enforced.args.employer, employer);
    assert.equal(enforced.args.amount.toString(), burn.toString());
    assert.equal(enforced.args.finalizer, owner);
    assert.equal(enforced.args.settlementPathCode.toString(), '3');
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());
  });

  it('does not burn on agent-win finalization', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const jobId = await createJobAndRequest(payout, burn);

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const tx = await manager.finalizeJob(jobId, { from: employer });

    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
  });

  it('emits EmployerBurnEnforced when finalizeJob settles employer-win', async () => {
    await setup();
    await manager.setRequiredValidatorDisapprovals(3, { from: owner });
    await manager.setVoteQuorum(2, { from: owner });
    await manager.setCompletionReviewPeriod(1, { from: owner });
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const jobId = await createJobAndRequest(payout, burn);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const tx = await manager.finalizeJob(jobId, { from: employer });
    const enforced = tx.logs.find((l) => l.event === 'EmployerBurnEnforced');
    assert.ok(enforced);
    assert.equal(enforced.args.jobId.toNumber(), jobId);
    assert.equal(enforced.args.employer, employer);
    assert.equal(enforced.args.amount.toString(), burn.toString());
    assert.equal(enforced.args.finalizer, employer);
    assert.equal(enforced.args.settlementPathCode.toString(), '1');
  });

  it('reverts employer-win settlement with insufficient burn allowance', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const jobId = await createJobAndRequest(payout);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await expectRevert.unspecified(
      manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator })
    );
  });

  it('zero-burn edge case on tiny payout does not emit burn and keeps supply constant', async () => {
    await setup();
    const payout = toBN(1);
    const jobId = await createJobAndRequest(payout);

    const supplyBefore = await token.totalSupply();
    const tx = await moveToEmployerWin(jobId);
    const supplyAfter = await token.totalSupply();

    const event = tx.logs.find((l) => l.event === 'EmployerBurnEnforced');
    assert.equal(Boolean(event), false);
    assert.equal(supplyAfter.toString(), supplyBefore.toString());
  });

  it('settlement pause blocks employer-win burn path', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const jobId = await createJobAndRequest(payout, burn);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await manager.setSettlementPaused(true, { from: owner });

    await expectRevert.unspecified(
      manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator })
    );
  });

  it('prevents burn-bps changes while escrow is active (no retroactive burn policy)', async () => {
    await setup({ burnBps: 10 });
    const payout = toBN(toWei('100'));
    await createJobAndRequest(payout, payout.muln(10).divn(10_000));

    await expectRevert.unspecified(manager.setEmployerBurnBps(200, { from: owner }));
  });

  it('reverts employer-win settlement when configured token does not implement burnFrom', async () => {
    const plainToken = await ERC20NoReturn.new({ from: owner });
    const m = await AGIJobManager.new(
      plainToken.address,
      'ipfs://base',
      [ZERO_ADDRESS, ZERO_ADDRESS],
      [ZERO_ROOT, ZERO_ROOT, ZERO_ROOT, ZERO_ROOT],
      [ZERO_ROOT, ZERO_ROOT],
      { from: owner }
    );
    await m.addModerator(moderator, { from: owner });
    await m.addAdditionalAgent(agent, { from: owner });
    await m.addAdditionalValidator(validatorA, { from: owner });
    await m.addAdditionalValidator(validatorB, { from: owner });
    await m.setRequiredValidatorApprovals(2, { from: owner });
    await m.setRequiredValidatorDisapprovals(2, { from: owner });
    await m.setEmployerBurnBps(100, { from: owner });

    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    await plainToken.mint(employer, payout.add(burn), { from: owner });
    await plainToken.mint(agent, toWei('1000'), { from: owner });
    await plainToken.mint(validatorA, toWei('1000'), { from: owner });
    await plainToken.mint(validatorB, toWei('1000'), { from: owner });
    await plainToken.approve(m.address, payout.add(burn), { from: employer });
    await plainToken.approve(m.address, toWei('1000'), { from: agent });
    await plainToken.approve(m.address, toWei('1000'), { from: validatorA });
    await plainToken.approve(m.address, toWei('1000'), { from: validatorB });

    const agiType = await MockERC721.new({ from: owner });
    await agiType.mint(agent, { from: owner });
    await m.addAGIType(agiType.address, 92, { from: owner });

    const tx = await m.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await m.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await m.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    await m.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await m.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });

    await expectRevert.unspecified(
      m.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator })
    );
  });

});
