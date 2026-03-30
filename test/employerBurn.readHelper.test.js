const assert = require('assert');
const { time } = require('@openzeppelin/test-helpers');
const { toBN, toWei } = web3.utils;

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');
const EmployerBurnReadHelper = artifacts.require('EmployerBurnReadHelper');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);
const EMPTY_PROOF = [];

contract('EmployerBurnReadHelper completion-only semantics', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB] = accounts;

  let token;
  let manager;
  let helper;

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
    helper = await EmployerBurnReadHelper.new(manager.address, { from: owner });

    await manager.addAdditionalAgent(agent, { from: owner });
    await manager.addAdditionalValidator(validatorA, { from: owner });
    await manager.addAdditionalValidator(validatorB, { from: owner });
    await manager.setRequiredValidatorApprovals(2, { from: owner });
    await manager.setRequiredValidatorDisapprovals(2, { from: owner });
    await manager.setChallengePeriodAfterApproval(1, { from: owner });
    await manager.setCompletionReviewPeriod(1, { from: owner });
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

  async function createRequestedJob() {
    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    return { jobId, payout, burn };
  }

  it('quotes completion burn and upfront funding requirements', async () => {
    await setup();
    const { jobId, payout, burn } = await createRequestedJob();

    const quote = await helper.quoteCompletionBurn(jobId);
    assert.equal(quote.token, token.address);
    assert.equal(quote.amount.toString(), burn.toString());
    assert.equal(quote.burnBpsSnapshot.toString(), '100');
    assert.equal(quote.payer, employer);
    assert.equal(quote.payoutEscrow.toString(), payout.toString());

    const funding = await helper.getCompletionBurnFundingStatus(jobId);
    assert.equal(funding.burnReserveRequired.toString(), burn.toString());
    assert.equal(funding.burnReserveLocked.toString(), burn.toString());
    assert.equal(funding.reserveFunded, true);

    const upfront = await helper.getEmployerUpfrontFundingRequirement(jobId);
    assert.equal(upfront.payoutEscrow.toString(), payout.toString());
    assert.equal(upfront.burnReserveRequired.toString(), burn.toString());
    assert.equal(upfront.totalRequired.toString(), payout.add(burn).toString());
  });

  it('reports readiness for successful finalize path and disputed path block', async () => {
    await setup();
    const { jobId, burn } = await createRequestedJob();

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    const readiness = await helper.getSuccessfulCompletionFinalizationReadiness(jobId);
    assert.equal(readiness.ready, true);
    assert.equal(readiness.reasonCode.toString(), '0');
    assert.equal(readiness.settlementPathCode.toString(), '1');
    assert.equal(readiness.reserveFunded, true);
    assert.equal(readiness.completionBurnAmount.toString(), burn.toString());
    assert.equal(await helper.canFinalizeSuccessfulCompletion(jobId), true);

    // separate disputed job should not be marked ready
    const second = await createRequestedJob();
    await manager.disapproveJob(second.jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(second.jobId, '', EMPTY_PROOF, { from: validatorB });
    const blocked = await helper.getSuccessfulCompletionFinalizationReadiness(second.jobId);
    assert.equal(blocked.ready, false);
    assert.equal(blocked.reasonCode.toString(), '6');
    assert.equal(await helper.canFinalizeSuccessfulCompletion(second.jobId), false);
  });
});
