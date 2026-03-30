// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAGIJobManagerCompletionBurnView {
    function agiToken() external view returns (address);
    function employerBurnBps() external view returns (uint256);
    function voteQuorum() external view returns (uint256);
    function completionReviewPeriod() external view returns (uint256);
    function challengePeriodAfterApproval() external view returns (uint256);
    function settlementPaused() external view returns (bool);
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
    function getJobBurnFunding(uint256 jobId) external view returns (uint256 burnReserveAmount);
}

contract EmployerBurnReadHelper {
    uint8 public constant SUCCESS_PATH_NONE = 0;
    uint8 public constant SUCCESS_PATH_FINALIZE = 1;

    uint8 public constant READINESS_OK = 0;
    uint8 public constant READINESS_TERMINAL = 1;
    uint8 public constant READINESS_SETTLEMENT_PAUSED = 2;
    uint8 public constant READINESS_NOT_COMPLETION_REQUESTED = 3;
    uint8 public constant READINESS_REVIEW_WINDOW = 4;
    uint8 public constant READINESS_CHALLENGE_WINDOW = 5;
    uint8 public constant READINESS_DISPUTED = 6;
    uint8 public constant READINESS_NOT_SUCCESS_OUTCOME = 7;

    IAGIJobManagerCompletionBurnView public immutable manager;

    constructor(address managerAddress) {
        require(managerAddress != address(0), "manager=0");
        manager = IAGIJobManagerCompletionBurnView(managerAddress);
    }

    function quoteCompletionBurn(uint256 jobId)
        external
        view
        returns (address token, uint256 amount, uint256 burnBpsSnapshot, address payer, uint256 payoutEscrow)
    {
        (payer,, payoutEscrow,,,,,,) = manager.getJobCore(jobId);
        amount = manager.getJobBurnFunding(jobId);
        burnBpsSnapshot = manager.employerBurnBps();
        token = manager.agiToken();
    }

    function getCompletionBurnFundingStatus(uint256 jobId)
        external
        view
        returns (
            address token,
            address payer,
            uint256 payoutEscrow,
            uint256 burnReserveRequired,
            uint256 burnReserveLocked,
            bool reserveFunded,
            uint256 totalEmployerUpfrontFunding
        )
    {
        (payer,, payoutEscrow,,,,,,) = manager.getJobCore(jobId);
        burnReserveLocked = manager.getJobBurnFunding(jobId);
        token = manager.agiToken();
        burnReserveRequired = (payoutEscrow * manager.employerBurnBps()) / 10_000;
        reserveFunded = burnReserveLocked >= burnReserveRequired;
        totalEmployerUpfrontFunding = payoutEscrow + burnReserveRequired;
    }

    function getEmployerUpfrontFundingRequirement(uint256 jobId)
        external
        view
        returns (uint256 payoutEscrow, uint256 burnReserveRequired, uint256 totalRequired)
    {
        (,, payoutEscrow,,,,,,) = manager.getJobCore(jobId);
        burnReserveRequired = (payoutEscrow * manager.employerBurnBps()) / 10_000;
        totalRequired = payoutEscrow + burnReserveRequired;
    }

    function canFinalizeSuccessfulCompletion(uint256 jobId) external view returns (bool) {
        (bool ready,,,,) = _getSuccessfulCompletionFinalizationReadiness(jobId);
        return ready;
    }

    function getSuccessfulCompletionFinalizationReadiness(uint256 jobId)
        external
        view
        returns (
            bool ready,
            uint8 reasonCode,
            uint8 settlementPathCode,
            bool reserveFunded,
            uint256 completionBurnAmount
        )
    {
        return _getSuccessfulCompletionFinalizationReadiness(jobId);
    }

    function _getSuccessfulCompletionFinalizationReadiness(uint256 jobId)
        internal
        view
        returns (bool ready, uint8 reasonCode, uint8 settlementPathCode, bool reserveFunded, uint256 completionBurnAmount)
    {
        (address employer, uint256 payout, bool completed, bool disputed, bool expired) = _readCoreMinimal(jobId);
        if (employer == address(0)) return (false, READINESS_TERMINAL, SUCCESS_PATH_NONE, false, 0);
        completionBurnAmount = (payout * manager.employerBurnBps()) / 10_000;
        uint256 reserveLocked = manager.getJobBurnFunding(jobId);
        reserveFunded = reserveLocked >= completionBurnAmount;

        if (completed || expired) return (false, READINESS_TERMINAL, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);
        if (manager.settlementPaused()) return (false, READINESS_SETTLEMENT_PAUSED, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);
        if (disputed) return (false, READINESS_DISPUTED, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);

        (bool completionRequested, uint256 approvals, uint256 disapprovals, uint256 completionRequestedAt,) = manager.getJobValidation(jobId);
        if (!completionRequested) return (false, READINESS_NOT_COMPLETION_REQUESTED, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);

        (bool validatorApproved, uint256 validatorApprovedAt) = manager.getJobFinalizationGate(jobId);
        if (validatorApproved && block.timestamp <= validatorApprovedAt + manager.challengePeriodAfterApproval()) {
            return (false, READINESS_CHALLENGE_WINDOW, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);
        }

        if (block.timestamp <= completionRequestedAt + manager.completionReviewPeriod()) {
            return (false, READINESS_REVIEW_WINDOW, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);
        }

        uint256 totalVotes = approvals + disapprovals;
        if ((validatorApproved && approvals > disapprovals) || totalVotes == 0 || approvals > disapprovals) {
            return (true, READINESS_OK, SUCCESS_PATH_FINALIZE, reserveFunded, completionBurnAmount);
        }

        return (false, READINESS_NOT_SUCCESS_OUTCOME, SUCCESS_PATH_NONE, reserveFunded, completionBurnAmount);
    }

    function _readCoreMinimal(uint256 jobId) internal view returns (address employer, uint256 payout, bool completed, bool disputed, bool expired) {
        (employer,, payout,,, completed, disputed, expired,) = manager.getJobCore(jobId);
    }
}
