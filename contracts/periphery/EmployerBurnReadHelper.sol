// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAGIJobManagerCompletionBurnView {
    function agiToken() external view returns (address);
    function employerBurnBps() external view returns (uint256);
    function voteQuorum() external view returns (uint256);
    function completionReviewPeriod() external view returns (uint256);
    function challengePeriodAfterApproval() external view returns (uint256);
    function disputeReviewPeriod() external view returns (uint256);
    function settlementPaused() external view returns (bool);
    function lockedBurnReserves() external view returns (uint256);
    function getJobCore(uint256 jobId)
        external
        view
        returns (
            address employer,
            address assignedAgent,
            uint256 payout,
            uint256 duration,
            uint256 assignedAt,
            bool completed,
            bool disputed,
            bool expired,
            uint8 agentPayoutPct
        );
    function getJobValidation(uint256 jobId)
        external
        view
        returns (
            bool completionRequested,
            uint256 validatorApprovals,
            uint256 validatorDisapprovals,
            uint256 completionRequestedAt,
            uint256 disputedAt
        );
    function getJobFinalizationGate(uint256 jobId) external view returns (bool validatorApproved, uint256 validatorApprovedAt);
}

contract EmployerBurnReadHelper {
    uint8 public constant READINESS_OK = 0;
    uint8 public constant READINESS_NOT_SUCCESS_PATH = 1;
    uint8 public constant READINESS_ALREADY_TERMINAL = 2;
    uint8 public constant READINESS_SETTLEMENT_PAUSED = 3;
    uint8 public constant READINESS_RESERVE_MISSING = 4;

    IAGIJobManagerCompletionBurnView public immutable manager;

    constructor(address managerAddress) {
        require(managerAddress != address(0), "manager=0");
        manager = IAGIJobManagerCompletionBurnView(managerAddress);
    }

    function quoteCompletionBurn(uint256 jobId)
        external
        view
        returns (address token, uint256 amount, uint256 burnBps)
    {
        uint256 payout;
        (,, payout,,,,,,) = manager.getJobCore(jobId);
        token = manager.agiToken();
        burnBps = manager.employerBurnBps();
        amount = (payout * burnBps) / 10_000;
    }

    function getCompletionBurnFundingStatus(uint256 jobId)
        external
        view
        returns (uint256 reserveAmount, bool reserveFunded, uint256 lockedReserveTotal)
    {
        uint256 payout;
        (,, payout,,,,,,) = manager.getJobCore(jobId);
        uint256 expected = (payout * manager.employerBurnBps()) / 10_000;
        reserveAmount = expected;
        reserveFunded = true;
        lockedReserveTotal = manager.lockedBurnReserves();
    }

    function getEmployerUpfrontFundingRequirement(uint256 jobId)
        external
        view
        returns (uint256 payoutEscrow, uint256 completionBurnReserve, uint256 totalRequired)
    {
        (,, payoutEscrow,,,,,,) = manager.getJobCore(jobId);
        completionBurnReserve = (payoutEscrow * manager.employerBurnBps()) / 10_000;
        totalRequired = payoutEscrow + completionBurnReserve;
    }

    function canFinalizeSuccessfulCompletion(uint256 jobId) external view returns (bool) {
        (bool ready,,, , uint8 settlementPathCode) = getSuccessfulCompletionFinalizationReadiness(jobId);
        return ready && settlementPathCode == 11;
    }

    function getSuccessfulCompletionFinalizationReadiness(uint256 jobId)
        public
        view
        returns (bool ready, bool reserveFunded, bool completionPathReady, uint8 reasonCode, uint8 settlementPathCode)
    {
        (, , bool completed, bool disputed, bool expired) = _readCore(jobId);
        if (completed || expired) return (false, true, false, READINESS_ALREADY_TERMINAL, 0);
        if (manager.settlementPaused()) return (false, true, false, READINESS_SETTLEMENT_PAUSED, 0);

        reserveFunded = true;

        (completionPathReady, settlementPathCode) = _isSuccessPathReady(jobId, disputed);
        if (!completionPathReady) return (false, reserveFunded, false, READINESS_NOT_SUCCESS_PATH, settlementPathCode);
        if (!reserveFunded) return (false, false, true, READINESS_RESERVE_MISSING, settlementPathCode);
        return (true, true, true, READINESS_OK, settlementPathCode);
    }

    function _readCore(uint256 jobId) internal view returns (address employer, uint256 payout, bool completed, bool disputed, bool expired) {
        (employer,, payout,,, completed, disputed, expired,) = manager.getJobCore(jobId);
    }

    function _isSuccessPathReady(uint256 jobId, bool disputed) internal view returns (bool ready, uint8 settlementPathCode) {
        if (disputed) {
            (, ,,, uint256 disputedAt) = manager.getJobValidation(jobId);
            if (block.timestamp > disputedAt + manager.disputeReviewPeriod()) return (false, 13);
            return (false, 12);
        }

        (
            bool completionRequested,
            uint256 approvals,
            uint256 disapprovals,
            uint256 completionRequestedAt,

        ) = manager.getJobValidation(jobId);

        if (!completionRequested) return (false, 0);

        (bool validatorApproved, uint256 validatorApprovedAt) = manager.getJobFinalizationGate(jobId);
        if (validatorApproved) {
            if (block.timestamp <= validatorApprovedAt + manager.challengePeriodAfterApproval()) return (false, 11);
            if (approvals > disapprovals) return (true, 11);
        }

        if (block.timestamp <= completionRequestedAt + manager.completionReviewPeriod()) return (false, 11);

        uint256 totalVotes = approvals + disapprovals;
        if (totalVotes == 0) return (true, 11);
        if (totalVotes < manager.voteQuorum() || approvals == disapprovals) return (false, 0);
        return (approvals > disapprovals, 11);
    }
}
