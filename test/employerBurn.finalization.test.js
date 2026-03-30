const assert = require('assert');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');
const FailTransferToken = artifacts.require('FailTransferToken');
const ERC20NoReturn = artifacts.require('ERC20NoReturn');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);
const EMPTY_PROOF = [];
const { toBN, toWei } = web3.utils;

contract('AGIJobManager createJob-only employer burn', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator] = accounts;
  let token;
  let manager;

  async function deployBase(_token = null) {
    token = _token || await MockERC20.new({ from: owner });
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
    await manager.setCompletionReviewPeriod(1, { from: owner });
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

  async function createAssignedRequestedJob(payout) {
    const burn = payout.muln(100).divn(10_000);
    const total = payout.add(burn);
    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    return { jobId, burn, tx };
  }

  it('charges burn exactly once at createJob and emits snapshot event', async () => {
    await deployBase();
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const total = payout.add(burn);
    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });

    const supplyBefore = await token.totalSupply();
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const supplyAfter = await token.totalSupply();
    assert.equal(supplyBefore.sub(supplyAfter).toString(), burn.toString());

    const event = tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation');
    assert.ok(event);
    assert.equal(event.args.employer, employer);
    assert.equal(event.args.burnAmount.toString(), burn.toString());
    assert.equal(event.args.payoutAmount.toString(), payout.toString());
    assert.equal(event.args.totalUpfrontRequired.toString(), total.toString());
    assert.equal(event.args.burnBpsSnapshot.toString(), '100');
  });

  it('requires createJob allowance for payout + burn', async () => {
    await deployBase();
    const payout = toBN(toWei('100'));
    await token.mint(employer, toWei('101'), { from: owner });
    await token.approve(manager.address, payout, { from: employer });
    await expectRevert.unspecified(manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer }));
  });

  it('requires createJob balance for payout + burn', async () => {
    await deployBase();
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout, { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    await expectRevert.unspecified(manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer }));
  });

  it('reverts createJob atomically if payout transfer fails', async () => {
    const failingToken = await FailTransferToken.new({ from: owner });
    await deployBase(failingToken);
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const total = payout.add(burn);
    await failingToken.mint(employer, total, { from: owner });
    await failingToken.approve(manager.address, total, { from: employer });

    await expectRevert.unspecified(manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer }));
    assert.equal((await manager.nextJobId()).toString(), '0');
  });

  it('reverts createJob atomically if burn path fails', async () => {
    const noBurnToken = await ERC20NoReturn.new({ from: owner });
    await deployBase(noBurnToken);
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    const total = payout.add(burn);
    await noBurnToken.mint(employer, total, { from: owner });
    await noBurnToken.approve(manager.address, total, { from: employer });

    await expectRevert.unspecified(manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer }));
    assert.equal((await manager.nextJobId()).toString(), '0');
  });

  it('never burns on finalize, refund, cancellation, delist, expiry, dispute outcomes', async () => {
    await deployBase();
    const payout = toBN(toWei('100'));

    // finalize agent-win
    let { jobId } = await createAssignedRequestedJob(payout);
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    let tx = await manager.finalizeJob(jobId, { from: employer });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation')), false);

    // employer refund via dispute resolution
    ({ jobId } = await createAssignedRequestedJob(payout));
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    tx = await manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation')), false);

    // cancellation (unassigned)
    const burn = payout.muln(100).divn(10_000);
    const total = payout.add(burn);
    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    tx = await manager.createJob('ipfs-cancel', payout, 3600, 'details', { from: employer });
    let cancelId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    tx = await manager.cancelJob(cancelId, { from: employer });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation')), false);

    // delist (unassigned)
    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    tx = await manager.createJob('ipfs-delist', payout, 3600, 'details', { from: employer });
    const delistId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    tx = await manager.delistJob(delistId, { from: owner });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation')), false);

    // expiry
    ({ jobId } = await createAssignedRequestedJob(payout));
    // re-create for expiry without completion request
    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    tx = await manager.createJob('ipfs-expire', payout, 1, 'details', { from: employer });
    const expireId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(expireId, '', EMPTY_PROOF, { from: agent });
    await time.increase(2);
    tx = await manager.expireJob(expireId, { from: validatorA });
    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurnChargedAtJobCreation')), false);
  });

  it('does not double-burn and does not require burn allowance for settlement', async () => {
    await deployBase();
    const payout = toBN(toWei('100'));
    const { jobId, burn } = await createAssignedRequestedJob(payout);

    // consume remaining allowance to zero after createJob.
    await token.approve(manager.address, 0, { from: employer });
    const supplyAfterCreate = await token.totalSupply();

    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator });

    const supplyAfterSettlement = await token.totalSupply();
    assert.equal(supplyAfterCreate.sub(supplyAfterSettlement).toString(), '0');

    const snapshot = await manager.getJobEconomicSnapshot(jobId);
    assert.equal(snapshot.employerBurnAmountCharged.toString(), burn.toString());
    assert.equal(snapshot.employerBurnBpsSnapshot.toString(), '100');
  });
});
