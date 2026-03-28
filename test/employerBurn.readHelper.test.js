const assert = require('assert');
const { time } = require('@openzeppelin/test-helpers');
const { toBN, toWei } = web3.utils;

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');
const EmployerBurnReadHelper = artifacts.require('EmployerBurnReadHelper');
const MockPausableBurnableToken = artifacts.require('MockPausableBurnableToken');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);
const EMPTY_PROOF = [];

contract('EmployerBurnReadHelper', (accounts) => {
  const [owner, employer, agent, validatorA, validatorB, moderator, validatorC] = accounts;

  let token;
  let manager;
  let helper;

  async function setup({ withBurnAllowance = true } = {}) {
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

    await manager.addModerator(moderator, { from: owner });
    await manager.addAdditionalAgent(agent, { from: owner });
    await manager.addAdditionalValidator(validatorA, { from: owner });
    await manager.addAdditionalValidator(validatorB, { from: owner });
    await manager.setRequiredValidatorApprovals(2, { from: owner });
    await manager.setRequiredValidatorDisapprovals(2, { from: owner });
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
    await token.approve(manager.address, payout, { from: employer });
    if (withBurnAllowance) {
      await token.approve(manager.address, payout.add(burn), { from: employer });
    }

    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });

    return { jobId, burn };
  }

  it('returns quote/requirements/readiness for employer-win disputed state', async () => {
    const { jobId, burn } = await setup({ withBurnAllowance: true });

    const quote = await helper.quoteEmployerBurn(jobId);
    assert.equal(quote.token, token.address);
    assert.equal(quote.amount.toString(), burn.toString());
    assert.equal(quote.burnBps.toString(), '100');
    assert.equal(quote.payer, employer);
    assert.equal(quote.spender, manager.address);

    const requirements = await helper.getEmployerBurnRequirements(jobId);
    assert.equal(requirements.balanceSufficient, true);
    assert.equal(requirements.allowanceSufficient, true);

    const readiness = await helper.getEmployerBurnReadiness(jobId);
    assert.equal(readiness.employerWinReadyNow, true);
    assert.equal(readiness.reasonCode.toString(), '0');
    assert.equal(readiness.settlementPathCode.toString(), '2');
    assert.equal(await helper.canFinalizeEmployerWinWithBurn(jobId), false);
  });

  it('reports insufficient allowance in readiness helper', async () => {
    const { jobId } = await setup({ withBurnAllowance: false });

    const readiness = await helper.getEmployerBurnReadiness(jobId);
    assert.equal(readiness.employerWinReadyNow, true);
    assert.equal(readiness.allowanceSufficient, false);
    assert.equal(readiness.reasonCode.toString(), '5');
    assert.equal(await helper.canFinalizeEmployerWinWithBurn(jobId), false);
  });

  it('reports not-ready when settlement is paused', async () => {
    const { jobId } = await setup({ withBurnAllowance: true });
    await manager.setSettlementPaused(true, { from: owner });
    const readiness = await helper.getEmployerBurnReadiness(jobId);
    assert.equal(readiness.employerWinReadyNow, false);
    assert.equal(readiness.reasonCode.toString(), '6');
    assert.equal(readiness.settlementPathCode.toString(), '0');
    assert.equal(await helper.canFinalizeEmployerWinWithBurn(jobId), false);
  });

  it('reports token-paused reason code when burn token exposes isPaused()', async () => {
    token = await MockPausableBurnableToken.new({ from: owner });
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
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await token.pause({ from: owner });

    const readiness = await helper.getEmployerBurnReadiness(jobId);
    assert.equal(readiness.employerWinReadyNow, false);
    assert.equal(readiness.reasonCode.toString(), '7');
    assert.equal(readiness.settlementPathCode.toString(), '0');
    assert.equal(await helper.canFinalizeEmployerWinWithBurn(jobId), false);
  });

  it('does not report finalize-path readiness during validator-approved challenge window', async () => {
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
    await manager.addAdditionalValidator(validatorC, { from: owner });
    await manager.setRequiredValidatorApprovals(1, { from: owner });
    await manager.setRequiredValidatorDisapprovals(3, { from: owner });
    await manager.setCompletionReviewPeriod(1, { from: owner });
    await manager.setChallengePeriodAfterApproval(1000, { from: owner });
    await manager.setEmployerBurnBps(100, { from: owner });

    const agiType = await MockERC721.new({ from: owner });
    await agiType.mint(agent, { from: owner });
    await manager.addAGIType(agiType.address, 92, { from: owner });

    await token.mint(agent, toWei('1000'), { from: owner });
    await token.mint(validatorA, toWei('1000'), { from: owner });
    await token.mint(validatorB, toWei('1000'), { from: owner });
    await token.mint(validatorC, toWei('1000'), { from: owner });
    await token.approve(manager.address, toWei('1000'), { from: agent });
    await token.approve(manager.address, toWei('1000'), { from: validatorA });
    await token.approve(manager.address, toWei('1000'), { from: validatorB });
    await token.approve(manager.address, toWei('1000'), { from: validatorC });

    const payout = toBN(toWei('100'));
    const burn = payout.muln(100).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });

    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();
    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs-completion', { from: agent });

    await manager.validateJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorC });
    await time.increase(2);

    const readiness = await helper.getEmployerBurnReadiness(jobId);
    assert.equal(readiness.employerWinReadyNow, false);
    assert.equal(readiness.reasonCode.toString(), '1');
    assert.equal(readiness.settlementPathCode.toString(), '0');
  });

  it('returns canFinalizeEmployerWinWithBurn=true only on finalize-path readiness', async () => {
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
    await manager.setRequiredValidatorApprovals(3, { from: owner });
    await manager.setRequiredValidatorDisapprovals(3, { from: owner });
    await manager.setVoteQuorum(2, { from: owner });
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
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await time.increase(2);

    const readiness = await helper.getEmployerBurnReadiness(jobId);
    assert.equal(readiness.employerWinReadyNow, true);
    assert.equal(readiness.settlementPathCode.toString(), '1');
    assert.equal(await helper.canFinalizeEmployerWinWithBurn(jobId), true);
  });
});
