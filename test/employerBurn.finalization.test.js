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

contract('AGIJobManager completion-only employer burn reserve', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator, relayer] = accounts;
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
    await manager.setCompletionReviewPeriod(1, { from: owner });
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

  async function createAssignedJob(payout) {
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    return { jobId, burn };
  }

  it('burns exact reserve amount on successful completion finalization', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    const supplyBefore = await token.totalSupply();
    const tx = await manager.finalizeJob(jobId, { from: relayer });
    const enforced = tx.logs.find((l) => l.event === 'EmployerBurnEnforced');
    assert.ok(enforced);
    assert.equal(enforced.args.amount.toString(), burn.toString());
    assert.equal(enforced.args.settlementPathCode.toString(), '11');
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());
  });

  it('does not burn on employer refund path and refunds reserve', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId } = await createJobAndRequest(payout);

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    const supplyBefore = await token.totalSupply();
    const tx = await manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.toString(), supplyAfter.toString());
  });

  it('does not burn on cancellation', async () => {
    await setup();
    const payout = toBN(toWei('50'));
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();

    const supplyBefore = await token.totalSupply();
    const cancelTx = await manager.cancelJob(jobId, { from: employer });
    assert.equal(Boolean(cancelTx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.toString(), supplyAfter.toString());
  });

  it('does not burn on expiry', async () => {
    await setup();
    const payout = toBN(toWei('70'));
    const { jobId } = await createAssignedJob(payout);
    await time.increase(3601);
    const supplyBefore = await token.totalSupply();
    const tx = await manager.expireJob(jobId, { from: relayer });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.toString(), supplyAfter.toString());
  });

  it('tie path forces dispute and does not burn at finalize attempt', async () => {
    await setup();
    await manager.setVoteQuorum(2, { from: owner });
    const payout = toBN(toWei('100'));
    const { jobId } = await createJobAndRequest(payout);
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const tx = await manager.finalizeJob(jobId, { from: relayer });
    assert.ok(tx.logs.find((l) => l.event === 'JobDisputed'));
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
  });

  it('successful dispute resolution burns reserve', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);
    await token.mint(employer, toWei('5'), { from: owner });
    await token.approve(manager.address, toWei('5'), { from: employer });
    await manager.disputeJob(jobId, { from: employer });
    const supplyBefore = await token.totalSupply();
    const tx = await manager.resolveDisputeWithCode(jobId, 1, 'agent win', { from: moderator });
    const enforced = tx.logs.find((l) => l.event === 'EmployerBurnEnforced');
    assert.ok(enforced);
    assert.equal(enforced.args.amount.toString(), burn.toString());
    assert.equal(enforced.args.settlementPathCode.toString(), '11');
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());
  });

  it('stale dispute employer-win does not burn', async () => {
    await setup();
    await manager.setDisputeReviewPeriod(1, { from: owner });
    const payout = toBN(toWei('100'));
    const { jobId } = await createJobAndRequest(payout);
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    const tx = await manager.resolveStaleDispute(jobId, true, { from: owner });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnEnforced')), false);
  });

  it('tracks reserve separately from protocol withdrawable balance (no subsidy)', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createJobAndRequest(payout);
    const withdrawable = await manager.withdrawableAGI();
    assert.equal(withdrawable.toString(), '0');
    const reserves = await manager.lockedBurnReserves();
    assert.equal(reserves.toString(), burn.toString());
  });

  it('prevents double burn', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId } = await createJobAndRequest(payout);
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    await manager.finalizeJob(jobId, { from: relayer });
    await expectRevert.unspecified(manager.finalizeJob(jobId, { from: relayer }));
  });

  it('readiness helpers surface successful-completion readiness', async () => {
    await setup();
    const payout = toBN(toWei('100'));
    const { jobId } = await createJobAndRequest(payout);
    let readiness = await manager.getJobValidation(jobId);
    assert.equal(readiness.completionRequested, true);

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    readiness = await manager.getJobFinalizationGate(jobId);
    assert.equal(readiness.validatorApproved, true);
  });

  it('reverts successful completion settlement when token burn does not reduce supply', async () => {
    const plain = await ERC20NoReturn.new({ from: owner });
    const manager2 = await AGIJobManager.new(
      plain.address,
      'ipfs://base',
      [ZERO_ADDRESS, ZERO_ADDRESS],
      [ZERO_ROOT, ZERO_ROOT, ZERO_ROOT, ZERO_ROOT],
      [ZERO_ROOT, ZERO_ROOT],
      { from: owner }
    );
    await manager2.addAdditionalAgent(agent, { from: owner });
    await manager2.addAdditionalValidator(validatorA, { from: owner });
    await manager2.addAdditionalValidator(validatorB, { from: owner });
    await manager2.setRequiredValidatorApprovals(2, { from: owner });
    await manager2.setChallengePeriodAfterApproval(1, { from: owner });
    await manager2.setCompletionReviewPeriod(1, { from: owner });
    const agiType = await MockERC721.new({ from: owner });
    await agiType.mint(agent, { from: owner });
    await manager2.addAGIType(agiType.address, 92, { from: owner });

    await manager2.setEmployerBurnBps(100, { from: owner });
    const payout = toBN(toWei('10'));
    const burn = payout.muln(100).divn(10_000);
    await plain.mint(employer, payout.add(burn), { from: owner });
    await plain.mint(agent, toWei('100'), { from: owner });
    await plain.mint(validatorA, toWei('100'), { from: owner });
    await plain.mint(validatorB, toWei('100'), { from: owner });
    await plain.approve(manager2.address, payout.add(burn), { from: employer });
    await plain.approve(manager2.address, toWei('100'), { from: agent });
    await plain.approve(manager2.address, toWei('100'), { from: validatorA });
    await plain.approve(manager2.address, toWei('100'), { from: validatorB });

    const tx = await manager2.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager2.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager2.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    await manager2.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager2.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    await expectRevert.unspecified(manager2.finalizeJob(jobId, { from: owner }));
  });
});
