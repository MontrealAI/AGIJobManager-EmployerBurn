const assert = require("assert");
const { toBN, toWei } = web3.utils;

const AGIJobManager = artifacts.require("AGIJobManager");
const MockERC20 = artifacts.require("MockERC20");
const MockENS = artifacts.require("MockENS");
const MockNameWrapper = artifacts.require("MockNameWrapper");
const EmployerBurnReadHelper = artifacts.require("EmployerBurnReadHelper");
const { buildInitConfig } = require("./helpers/deploy");
const { expectCustomError } = require("./helpers/errors");

contract("AGIJobManager createJob funding + live surplus withdrawals", (accounts) => {
  const [owner, employer] = accounts;
  const ZERO32 = "0x" + "00".repeat(32);
  let token;
  let manager;
  let helper;

  beforeEach(async () => {
    token = await MockERC20.new({ from: owner });
    const ens = await MockENS.new({ from: owner });
    const wrapper = await MockNameWrapper.new({ from: owner });
    manager = await AGIJobManager.new(
      ...buildInitConfig(token.address, "ipfs://base", ens.address, wrapper.address, ZERO32, ZERO32, ZERO32, ZERO32, ZERO32, ZERO32),
      { from: owner }
    );
    helper = await EmployerBurnReadHelper.new(manager.address, { from: owner });
    await manager.setEmployerBurnBps(100, { from: owner });
  });

  it("quotes createJob burn/funding/allowance and snapshots per-job burn amount", async () => {
    const payout = toBN(toWei("100"));
    const burnExpected = payout.divn(100);
    const totalExpected = payout.add(burnExpected);

    const burnQuote = await helper.quoteCreateJobBurn(payout);
    assert.equal(burnQuote.burnAmount.toString(), burnExpected.toString());
    assert.equal(burnQuote.burnBps.toString(), "100");

    const funding = await helper.getCreateJobFundingRequirementWithToken(payout);
    assert.equal(funding.token, token.address);
    assert.equal(funding.escrowAmount.toString(), payout.toString());
    assert.equal(funding.burnAmount.toString(), burnExpected.toString());
    assert.equal(funding.totalUpfront.toString(), totalExpected.toString());

    const allowance = await helper.getCreateJobAllowanceRequirementWithToken(payout);
    assert.equal(allowance.token, token.address);
    assert.equal(allowance.spender, manager.address);
    assert.equal(allowance.allowanceRequired.toString(), totalExpected.toString());

    await token.mint(employer, totalExpected, { from: owner });
    await token.approve(manager.address, totalExpected, { from: employer });
    const createTx = await manager.createJob("ipfs://spec", payout, 3600, "details", { from: employer });
    const jobId = createTx.logs.find((log) => log.event === "JobCreated").args.jobId;

    const jobBurn = await helper.getJobBurnAmountSnapshot(jobId);
    assert.equal(jobBurn.toString(), burnExpected.toString());

  });

  it("allows owner to withdraw AGI surplus while unpaused and protects active escrow", async () => {
    const payout = toBN(toWei("10"));
    const burn = payout.divn(100);
    const total = payout.add(burn);

    await token.mint(employer, total, { from: owner });
    await token.approve(manager.address, total, { from: employer });
    await manager.createJob("ipfs://job", payout, 3600, "details", { from: employer });

    const surplus = toBN(toWei("3"));
    await token.mint(manager.address, surplus, { from: owner });
    assert.equal((await manager.paused()).toString(), "false");

    await expectCustomError(manager.withdrawAGI.call(surplus.addn(1), { from: owner }), "InsufficientWithdrawableBalance");
    await manager.withdrawAGI(surplus, { from: owner });
    assert.equal((await token.balanceOf(owner)).toString(), surplus.toString());

    await expectCustomError(manager.withdrawAGI.call(1, { from: owner }), "InsufficientWithdrawableBalance");
  });
});
