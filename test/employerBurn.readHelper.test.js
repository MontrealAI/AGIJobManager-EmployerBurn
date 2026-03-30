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

contract('EmployerBurnReadHelper', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator] = accounts;

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
    await manager.addModerator(moderator, { from: owner });
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

    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });

    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });

    return { jobId, burn, payout };
  }

  it('returns completion burn quote and upfront funding requirement', async () => {
    const { jobId, burn, payout } = await setup();
    const quote = await helper.quoteCompletionBurn(jobId);
    assert.equal(quote.token, token.address);
    assert.equal(quote.amount.toString(), burn.toString());

    const req = await helper.getEmployerUpfrontFundingRequirement(jobId);
    assert.equal(req.payoutEscrow.toString(), payout.toString());
    assert.equal(req.completionBurnReserve.toString(), burn.toString());
    assert.equal(req.totalRequired.toString(), payout.add(burn).toString());
  });

  it('reports reserve funding and readiness before and after success-path votes', async () => {
    const { jobId, burn } = await setup();

    const funding = await helper.getCompletionBurnFundingStatus(jobId);
    assert.equal(funding.reserveAmount.toString(), burn.toString());
    assert.equal(funding.reserveFunded, true);

    let readiness = await helper.getSuccessfulCompletionFinalizationReadiness(jobId);
    assert.equal(readiness.ready, false);
    assert.equal(readiness.reasonCode.toString(), '1');

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    readiness = await helper.getSuccessfulCompletionFinalizationReadiness(jobId);
    assert.equal(readiness.ready, true);
    assert.equal(readiness.settlementPathCode.toString(), '11');
    assert.equal(await helper.canFinalizeSuccessfulCompletion(jobId), true);
  });

  it('does not mark disputed jobs as finalize-ready', async () => {
    const { jobId } = await setup();
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });

    const readiness = await helper.getSuccessfulCompletionFinalizationReadiness(jobId);
    assert.equal(readiness.ready, false);
    assert.equal(readiness.settlementPathCode.toString(), '12');
    assert.equal(await helper.canFinalizeSuccessfulCompletion(jobId), false);
  });

  it('reports reserve as not funded after terminal completion', async () => {
    const { jobId } = await setup();
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);
    await manager.finalizeJob(jobId, { from: owner });

    const funding = await helper.getCompletionBurnFundingStatus(jobId);
    assert.equal(funding.reserveFunded, false);
    const readiness = await helper.getSuccessfulCompletionFinalizationReadiness(jobId);
    assert.equal(readiness.reserveFunded, false);
  });
});
