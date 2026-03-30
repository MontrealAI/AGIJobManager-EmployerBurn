const assert = require('assert');
const { expectRevert } = require('@openzeppelin/test-helpers');
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
    helper = await EmployerBurnReadHelper.new(manager.address, { from: owner });

    await manager.addAdditionalAgent(agent, { from: owner });
    await manager.addAdditionalValidator(validatorA, { from: owner });
    await manager.addAdditionalValidator(validatorB, { from: owner });
    await manager.addModerator(moderator, { from: owner });
    await manager.setRequiredValidatorApprovals(2, { from: owner });
    await manager.setRequiredValidatorDisapprovals(2, { from: owner });
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

  it('quotes createJob burn and funding requirements', async () => {
    await setup({ burnBps: 125 });
    const payout = toBN(toWei('100'));
    const burn = payout.muln(125).divn(10_000);
    const total = payout.add(burn);

    const quote = await helper.quoteCreateJobBurn(payout);
    assert.equal(quote.burnAmount.toString(), burn.toString());
    assert.equal(quote.burnBps.toString(), '125');

    const funding = await helper.getCreateJobFundingRequirement(payout);
    assert.equal(funding.escrowAmount.toString(), payout.toString());
    assert.equal(funding.burnAmount.toString(), burn.toString());
    assert.equal(funding.totalUpfront.toString(), total.toString());

    const allowanceRequired = await helper.getCreateJobAllowanceRequirement(payout);
    assert.equal(allowanceRequired.toString(), total.toString());

    const allowanceDetails = await helper.getCreateJobAllowanceRequirementWithToken(payout);
    assert.equal(allowanceDetails.token, token.address);
    assert.equal(allowanceDetails.spender, manager.address);
    assert.equal(allowanceDetails.allowanceRequired.toString(), total.toString());
  });

  it('returns createJob funding readiness based on wallet balance and allowance', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('10'));
    const burn = payout.divn(100);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });

    let readiness = await helper.getCreateJobFundingReadiness(payout, employer);
    assert.equal(readiness.totalUpfront.toString(), total.toString());
    assert.equal(readiness.balanceSufficient, true);
    assert.equal(readiness.allowanceSufficient, true);

    await token.approve(manager.address, payout, { from: employer });
    readiness = await helper.getCreateJobFundingReadiness(payout, employer);
    assert.equal(readiness.balanceSufficient, true);
    assert.equal(readiness.allowanceSufficient, false);
  });

  it('snapshots job economics at create time and preserves burn token snapshot across token updates', async () => {
    await setup({ burnBps: 100 });
    const payout = toBN(toWei('50'));
    const burn = payout.divn(100);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();

    const econ = await helper.getJobEconomicSnapshot(jobId);
    assert.equal(econ.employer, employer);
    assert.equal(econ.token, token.address);
    assert.equal(econ.payoutEscrowed.toString(), payout.toString());
    assert.equal(econ.burnAmountCharged.toString(), burn.toString());
    assert.equal(econ.totalUpfrontAtCreate.toString(), total.toString());
    assert.equal(econ.burnBpsSnapshot.toString(), '100');

    await manager.applyForJob(jobId, '', EMPTY_PROOF, { from: agent });
    await manager.requestJobCompletion(jobId, 'ipfs://completion', { from: agent });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorA });
    await manager.disapproveJob(jobId, '', EMPTY_PROOF, { from: validatorB });
    await manager.resolveDisputeWithCode(jobId, 2, 'employer win', { from: moderator });

    const newToken = await MockERC20.new({ from: owner });
    await expectRevert.unspecified(manager.updateAGITokenAddress(newToken.address, { from: owner }));
    const stillSnapshotted = await helper.getJobEconomicSnapshot(jobId);
    assert.equal(stillSnapshotted.token, token.address);
    const burnSnapshot = await helper.getJobBurnAmountSnapshot(jobId);
    assert.equal(burnSnapshot.toString(), burn.toString());
  });

  it('keeps deprecated employer-win burn readiness APIs non-actionable', async () => {
    await setup({ burnBps: 100 });
    const readiness = await helper.getEmployerBurnReadiness(0);
    assert.equal(readiness.employerWinReadyNow, false);
    assert.equal(readiness.balanceSufficient, true);
    assert.equal(readiness.allowanceSufficient, true);
    assert.equal(readiness.reasonCode.toString(), '7');
    assert.equal(readiness.settlementPathCode.toString(), '0');
    assert.equal(await helper.canFinalizeEmployerWinWithBurn(0), false);
  });
});
