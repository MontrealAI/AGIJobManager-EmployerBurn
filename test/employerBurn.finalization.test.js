const assert = require('assert');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');
const FailingERC20 = artifacts.require('FailingERC20');
const MockPausableBurnableERC20 = artifacts.require('MockPausableBurnableERC20');
const EmployerBurnReadHelper = artifacts.require('EmployerBurnReadHelper');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);
const EMPTY_PROOF = [];
const { toBN, toWei } = web3.utils;

contract('AGIJobManager createJob-only employer burn semantics', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator] = accounts;
  let token;
  let manager;
  let helper;

  async function setup({ burnBps = 100, tokenArtifact = MockERC20 } = {}) {
    token = await tokenArtifact.new({ from: owner });
    manager = await AGIJobManager.new(
      token.address,
      'ipfs://base',
      [ZERO_ADDRESS, ZERO_ADDRESS],
      [ZERO_ROOT, ZERO_ROOT, ZERO_ROOT, ZERO_ROOT],
      [ZERO_ROOT, ZERO_ROOT],
      { from: owner }
    );
    helper = await EmployerBurnReadHelper.new(manager.address, { from: owner });

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

  async function createJobAndRequest(payout, totalAllowance = payout) {
    await token.mint(employer, totalAllowance, { from: owner });
    await token.approve(manager.address, totalAllowance, { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    return { jobId, tx };
  }

  it('charges exact burn once at createJob and emits creation burn event', async () => {
    await setup({ burnBps: 125 });
    const payout = toBN(toWei('80'));
    const burn = payout.muln(125).divn(10_000);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    assert.equal((await token.balanceOf(employer)).toString(), '0');
    assert.equal((await token.balanceOf(manager.address)).toString(), payout.toString());

    const ev = tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation');
    assert.ok(ev);
    assert.equal(ev.args.jobId.toNumber(), jobId);
    assert.equal(ev.args.employer, employer);
    assert.equal(ev.args.token, token.address);
    assert.equal(ev.args.payoutAmount.toString(), payout.toString());
    assert.equal(ev.args.burnAmount.toString(), burn.toString());
    assert.equal(ev.args.totalUpfront.toString(), total.toString());
    assert.equal(ev.args.burnBps.toString(), '125');

    const econ = await helper.getJobEconomicSnapshot(jobId);
    assert.equal(econ.employer, employer);
    assert.equal(econ.token, token.address);
    assert.equal(econ.payoutEscrowed.toString(), payout.toString());
    assert.equal(econ.burnAmountCharged.toString(), burn.toString());
    assert.equal(econ.totalUpfrontAtCreate.toString(), total.toString());
    assert.equal(econ.burnBpsSnapshot.toString(), '125');
  });

  it('does not emit creation burn event when burn bps is zero', async () => {
    await setup({ burnBps: 0 });
    const payout = toBN(toWei('10'));
    await token.mint(employer, payout, { from: owner });
    await token.approve(manager.address, payout, { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const ev = tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation');
    assert.equal(Boolean(ev), false);
  });

  it('requires total allowance for payout + burn', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('100'));
    const burn = payout.divn(100);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout, { from: employer });

    await expectRevert.unspecified(
      manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer })
    );
  });

  it('requires total balance for payout + burn', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('100'));
    const burn = payout.divn(100);
    await token.mint(employer, payout, { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });

    await expectRevert.unspecified(
      manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer })
    );
  });

  it('reverts atomically if burn fails after escrow transfer', async () => {
    await setup({ burnBps: 100, tokenArtifact: MockPausableBurnableERC20 });
    const payout = toBN(toWei('20'));
    const burn = payout.divn(100);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    await token.pause({ from: owner });

    await expectRevert.unspecified(
      manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer })
    );

    assert.equal((await manager.nextJobId()).toString(), '0');
    assert.equal((await manager.lockedEscrow()).toString(), '0');
    assert.equal((await token.balanceOf(manager.address)).toString(), '0');
    assert.equal((await token.balanceOf(employer)).toString(), total.toString());
  });

  it('reverts atomically if payout transfer fails', async () => {
    await setup({ burnBps: 100, tokenArtifact: FailingERC20 });
    const payout = toBN(toWei('20'));
    const burn = payout.divn(100);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    await token.setFailTransferFroms(true, { from: owner });

    await expectRevert.unspecified(
      manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer })
    );

    assert.equal((await manager.nextJobId()).toString(), '0');
    assert.equal((await manager.lockedEscrow()).toString(), '0');
    assert.equal((await token.balanceOf(employer)).toString(), total.toString());
  });

  it('does not burn on agent-win finalize path', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('100'));
    const burn = payout.divn(100);
    const { jobId } = await createJobAndRequest(payout, payout.add(burn));

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const tx = await manager.finalizeJob(jobId, { from: employer });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation')), false);
  });

  it('does not burn on employer-refund paths (finalize + dispute resolution)', async () => {
    await setup({ burnBps: 100 });
    await manager.setRequiredValidatorDisapprovals(3, { from: owner });
    await manager.setVoteQuorum(2, { from: owner });
    await manager.setCompletionReviewPeriod(1, { from: owner });
    const payout = toBN(toWei('100'));
    const burn = payout.divn(100);

    const a = await createJobAndRequest(payout, payout.add(burn));
    await manager.disapproveJob(a.jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(a.jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const supplyBeforeFinalize = await token.totalSupply();
    const txFinalize = await manager.finalizeJob(a.jobId, { from: employer });
    const supplyAfterFinalize = await token.totalSupply();
    assert.equal(Boolean(txFinalize.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
    assert.equal(supplyBeforeFinalize.toString(), supplyAfterFinalize.toString());

    await setup({ burnBps: 100 });
    const b = await createJobAndRequest(payout, payout.add(burn));
    await manager.disapproveJob(b.jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(b.jobId, '', EMPTY_PROOF, { from: validatorB });
    const supplyBeforeResolve = await token.totalSupply();
    const txResolve = await manager.resolveDisputeWithCode(b.jobId, 2, 'employer win', { from: moderator });
    const supplyAfterResolve = await token.totalSupply();
    assert.equal(Boolean(txResolve.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
    assert.equal(supplyBeforeResolve.toString(), supplyAfterResolve.toString());
  });

  it('does not burn on cancellation, delist, expiry, tie-dispute, or stale dispute resolution', async () => {
    await setup({ burnBps: 100 });
    await manager.setCompletionReviewPeriod(1, { from: owner });
    await manager.setDisputeReviewPeriod(1, { from: owner });
    const payout = toBN(toWei('50'));
    const burn = payout.divn(100);

    // cancel
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    let tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    let jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    let before = await token.totalSupply();
    await manager.cancelJob(jobId, { from: employer });
    assert.equal((await token.totalSupply()).toString(), before.toString());

    // delist
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    before = await token.totalSupply();
    await manager.delistJob(jobId, { from: owner });
    assert.equal((await token.totalSupply()).toString(), before.toString());

    // expiry with assigned agent and no completion
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    tx = await manager.createJob('ipfs-job', payout, 1, 'details', { from: employer });
    jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await time.increase(2);
    before = await token.totalSupply();
    await manager.expireJob(jobId, { from: employer });
    assert.equal((await token.totalSupply()).toString(), before.toString());

    // tie -> dispute -> stale resolve employer wins
    const d = await createJobAndRequest(payout, payout.add(burn));
    await manager.validateJob(d.jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(d.jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    await manager.finalizeJob(d.jobId, { from: employer });
    await time.increase(2);
    before = await token.totalSupply();
    await manager.resolveStaleDispute(d.jobId, true, { from: owner });
    assert.equal((await token.totalSupply()).toString(), before.toString());
  });

  it('allows burn bps updates without empty-escrow guard and snapshots per job', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('40'));
    const burn1 = payout.divn(100);
    const a = await createJobAndRequest(payout, payout.add(burn1));

    await manager.setEmployerBurnBps(200, { from: owner });
    const burn2 = payout.muln(200).divn(10_000);
    const b = await createJobAndRequest(payout, payout.add(burn2));

    const econA = await helper.getJobEconomicSnapshot(a.jobId);
    const econB = await helper.getJobEconomicSnapshot(b.jobId);
    assert.equal(econA.burnBpsSnapshot.toString(), '100');
    assert.equal(econA.burnAmountCharged.toString(), burn1.toString());
    assert.equal(econB.burnBpsSnapshot.toString(), '200');
    assert.equal(econB.burnAmountCharged.toString(), burn2.toString());
  });

  it('helper views quote createJob requirements and allowance clearly', async () => {
    await setup({ burnBps: 150 });
    const payout = toBN(toWei('10'));
    const burn = payout.muln(150).divn(10_000);
    const total = payout.add(burn);

    const quoted = await helper.quoteCreateJobBurn(payout);
    assert.equal(quoted.burnAmount.toString(), burn.toString());
    assert.equal(quoted.burnBps.toString(), '150');

    const req = await helper.getCreateJobFundingRequirement(payout);
    assert.equal(req.escrowAmount.toString(), payout.toString());
    assert.equal(req.burnAmount.toString(), burn.toString());
    assert.equal(req.totalUpfront.toString(), total.toString());

    const reqWithToken = await helper.getCreateJobFundingRequirementWithToken(payout);
    assert.equal(reqWithToken.token, token.address);
    assert.equal(reqWithToken.escrowAmount.toString(), payout.toString());
    assert.equal(reqWithToken.burnAmount.toString(), burn.toString());
    assert.equal(reqWithToken.totalUpfront.toString(), total.toString());

    const allowance = await helper.getCreateJobAllowanceRequirement(payout);
    assert.equal(allowance.toString(), total.toString());
  });

  it('never treats create-time burn as escrow or protocol-funded refundable balance', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('60'));
    const burn = payout.divn(100);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    assert.equal((await manager.lockedEscrow()).toString(), payout.toString(), 'locked escrow must only track payout');
    assert.equal((await token.balanceOf(manager.address)).toString(), payout.toString(), 'contract only receives escrow, not burn');

    await manager.cancelJob(jobId, { from: employer });
    assert.equal((await token.balanceOf(manager.address)).toString(), '0', 'refund drains escrow only');
    assert.equal((await token.balanceOf(employer)).toString(), payout.toString(), 'employer receives escrow refund only');
    assert.equal((await token.totalSupply()).toString(), web3.utils.toBN(toWei('3000')).add(payout).toString(), 'create-time burn remains destroyed and unreimbursed');
  });
});
