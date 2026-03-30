const assert = require('assert');
const { toBN, toWei } = web3.utils;

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const EmployerBurnReadHelper = artifacts.require('EmployerBurnReadHelper');

const ZERO_ROOT = '0x' + '00'.repeat(32);
const ZERO_ADDRESS = '0x' + '00'.repeat(20);

contract('EmployerBurnReadHelper (create-job funding)', (accounts) => {
  const [owner, employer] = accounts;

  let token;
  let manager;
  let helper;

  beforeEach(async () => {
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
    await manager.setEmployerBurnBps(250, { from: owner });
  });

  it('quotes create-job funding requirement and readiness', async () => {
    const payout = toBN(toWei('100'));
    const burn = payout.muln(250).divn(10_000);
    const total = payout.add(burn);

    const quote = await helper.quoteCreateJobFunding(payout);
    assert.equal(quote.token, token.address);
    assert.equal(quote.spender, manager.address);
    assert.equal(quote.escrowAmount.toString(), payout.toString());
    assert.equal(quote.burnAmount.toString(), burn.toString());
    assert.equal(quote.burnBps.toString(), '250');
    assert.equal(quote.totalRequired.toString(), total.toString());

    await token.mint(employer, payout, { from: owner });
    await token.approve(manager.address, payout, { from: employer });

    let readiness = await helper.getCreateJobFundingReadiness(employer, payout);
    assert.equal(readiness.balanceSufficient, false);
    assert.equal(readiness.allowanceSufficient, false);

    await token.mint(employer, burn, { from: owner });
    await token.approve(manager.address, total, { from: employer });

    readiness = await helper.getCreateJobFundingReadiness(employer, payout);
    assert.equal(readiness.balanceSufficient, true);
    assert.equal(readiness.allowanceSufficient, true);
  });

  it('returns per-job economic snapshot from manager', async () => {
    const payout = toBN(toWei('20'));
    const burn = payout.muln(250).divn(10_000);
    await token.mint(employer, payout.add(burn), { from: owner });
    await token.approve(manager.address, payout.add(burn), { from: employer });

    const tx = await manager.createJob('ipfs-job', payout, 3600, 'details', { from: employer });
    const jobId = tx.logs.find((l) => l.event === 'JobCreated').args.jobId.toNumber();

    const snapshot = await helper.getJobEconomicSnapshot(jobId);
    assert.equal(snapshot.token, token.address);
    assert.equal(snapshot.payoutEscrow.toString(), payout.toString());
    assert.equal(snapshot.employerBurnAmountCharged.toString(), burn.toString());
    assert.equal(snapshot.employerBurnBpsSnapshot.toString(), '250');
  });
});
