const assert = require('assert');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const AGIJobManager = artifacts.require('AGIJobManager');
const MockERC20 = artifacts.require('MockERC20');
const MockERC721 = artifacts.require('MockERC721');

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

    const event = tx.logs.find((l) => l.event === 'EmployerBurned');
    assert.ok(event);
    assert.equal(event.args.jobId.toNumber(), jobId);
    assert.equal(event.args.employer, employer);
    assert.equal(event.args.amount.toString(), burn.toString());

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

    assert.equal(Boolean(tx.logs.find((l) => l.event === 'EmployerBurned')), false);
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

    const event = tx.logs.find((l) => l.event === 'EmployerBurned');
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
});
