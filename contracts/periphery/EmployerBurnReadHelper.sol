// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAGIJobManagerBurnView {
    function agiToken() external view returns (address);
    function employerBurnBps() external view returns (uint256);
    function voteQuorum() external view returns (uint256);
    function completionReviewPeriod() external view returns (uint256);
    function challengePeriodAfterApproval() external view returns (uint256);
    function disputeReviewPeriod() external view returns (uint256);
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
}

interface IERC20ReadOnly {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @title EmployerBurnReadHelper
/// @notice Read-only helper contract for Etherscan-first employer burn preflight checks.
/// @dev This helper is additive and non-authoritative: AGIJobManager remains settlement source-of-truth.
contract EmployerBurnReadHelper {
    uint8 public constant EMPLOYER_WIN_PATH_NONE = 0;
    uint8 public constant EMPLOYER_WIN_PATH_FINALIZE = 1;
    uint8 public constant EMPLOYER_WIN_PATH_DISPUTE_MODERATOR = 2;
    uint8 public constant EMPLOYER_WIN_PATH_STALE_DISPUTE_OWNER = 3;

    uint8 public constant BURN_READINESS_OK = 0;
    uint8 public constant BURN_READINESS_NOT_EMPLOYER_WIN_PATH = 1;
    uint8 public constant BURN_READINESS_ALREADY_TERMINAL = 2;
    uint8 public constant BURN_READINESS_BURN_BPS_ZERO = 3;
    uint8 public constant BURN_READINESS_INSUFFICIENT_BALANCE = 4;
    uint8 public constant BURN_READINESS_INSUFFICIENT_ALLOWANCE = 5;
    uint8 public constant BURN_READINESS_SETTLEMENT_PAUSED = 6;

    IAGIJobManagerBurnView public immutable manager;

    constructor(address managerAddress) {
        require(managerAddress != address(0), "manager=0");
        manager = IAGIJobManagerBurnView(managerAddress);
    }

    function quoteEmployerBurn(uint256 jobId)
        external
        view
        returns (address token, uint256 amount, uint256 burnBps, address payer, address spender)
    {
        uint256 payout;
        (payer,, payout,,,,,,) = manager.getJobCore(jobId);
        token = manager.agiToken();
        burnBps = manager.employerBurnBps();
        spender = address(manager);
        amount = (payout * burnBps) / 10_000;
    }

    function getEmployerBurnRequirements(uint256 jobId)
        external
        view
        returns (
            address token,
            address payer,
            address spender,
            uint256 amount,
            uint256 payerBalance,
            uint256 payerAllowance,
            bool balanceSufficient,
            bool allowanceSufficient
        )
    {
        uint256 payout;
        (payer,, payout,,,,,,) = manager.getJobCore(jobId);
        token = manager.agiToken();
        spender = address(manager);
        amount = (payout * manager.employerBurnBps()) / 10_000;
        payerBalance = IERC20ReadOnly(token).balanceOf(payer);
        payerAllowance = IERC20ReadOnly(token).allowance(payer, spender);
        balanceSufficient = payerBalance >= amount;
        allowanceSufficient = payerAllowance >= amount;
    }

    function getEmployerBurnReadiness(uint256 jobId)
        external
        view
        returns (
            bool employerWinReadyNow,
            bool balanceSufficient,
            bool allowanceSufficient,
            uint8 reasonCode,
            uint8 settlementPathCode
        )
    {
        return _getEmployerBurnReadiness(jobId);
    }

    function canFinalizeEmployerWinWithBurn(uint256 jobId) external view returns (bool) {
        (bool ready, bool balanceOk, bool allowanceOk,, uint8 settlementPathCode) = _getEmployerBurnReadiness(jobId);
        return ready && balanceOk && allowanceOk && settlementPathCode == EMPLOYER_WIN_PATH_FINALIZE;
    }

    function _getEmployerBurnReadiness(uint256 jobId) internal view returns (bool, bool, bool, uint8, uint8) {
        (address employer, uint256 payout, bool completed, bool disputed, bool expired) = _readCoreMinimal(jobId);
        if (completed || expired) {
            return (false, true, true, BURN_READINESS_ALREADY_TERMINAL, EMPLOYER_WIN_PATH_NONE);
        }
        if (manager.settlementPaused()) {
            return (false, true, true, BURN_READINESS_SETTLEMENT_PAUSED, EMPLOYER_WIN_PATH_NONE);
        }

        uint256 burnAmount = (payout * manager.employerBurnBps()) / 10_000;
        (bool balanceSufficient, bool allowanceSufficient) = _getFundingReadiness(employer, burnAmount);

        (bool completionRequested, uint256 approvals, uint256 disapprovals, uint256 completionRequestedAt, uint256 disputedAt) =
            _readValidation(jobId);

        if (disputed) {
            return _composeReadinessWithFunding(
                true,
                _getDisputeSettlementPath(disputedAt),
                balanceSufficient,
                allowanceSufficient,
                burnAmount
            );
        }

        (bool finalizeReady, uint8 pathCode) =
            _isFinalizeEmployerWinReady(jobId, completionRequested, approvals, disapprovals, completionRequestedAt);
        return _composeReadinessWithFunding(finalizeReady, pathCode, balanceSufficient, allowanceSufficient, burnAmount);
    }

    function _readCoreMinimal(uint256 jobId) internal view returns (address employer, uint256 payout, bool completed, bool disputed, bool expired) {
        (employer,, payout,,, completed, disputed, expired,) = manager.getJobCore(jobId);
    }

    function _readValidation(uint256 jobId)
        internal
        view
        returns (bool completionRequested, uint256 approvals, uint256 disapprovals, uint256 completionRequestedAt, uint256 disputedAt)
    {
        (completionRequested, approvals, disapprovals, completionRequestedAt, disputedAt) = manager.getJobValidation(jobId);
    }

    function _getFundingReadiness(address employer, uint256 burnAmount)
        internal
        view
        returns (bool balanceSufficient, bool allowanceSufficient)
    {
        if (burnAmount == 0) {
            return (true, true);
        }
        address token = manager.agiToken();
        balanceSufficient = IERC20ReadOnly(token).balanceOf(employer) >= burnAmount;
        allowanceSufficient = IERC20ReadOnly(token).allowance(employer, address(manager)) >= burnAmount;
    }

    function _getDisputeSettlementPath(uint256 disputedAt) internal view returns (uint8) {
        if (block.timestamp > disputedAt + manager.disputeReviewPeriod()) {
            return EMPLOYER_WIN_PATH_STALE_DISPUTE_OWNER;
        }
        return EMPLOYER_WIN_PATH_DISPUTE_MODERATOR;
    }

    function _isFinalizeEmployerWinReady(
        uint256 jobId,
        bool completionRequested,
        uint256 approvals,
        uint256 disapprovals,
        uint256 completionRequestedAt
    ) internal view returns (bool ready, uint8 pathCode) {
        if (!completionRequested) {
            return (false, EMPLOYER_WIN_PATH_NONE);
        }
        if (block.timestamp <= completionRequestedAt + manager.completionReviewPeriod()) {
            return (false, EMPLOYER_WIN_PATH_NONE);
        }

        (bool validatorApproved, uint256 validatorApprovedAt) = manager.getJobFinalizationGate(jobId);
        if (validatorApproved && block.timestamp <= validatorApprovedAt + manager.challengePeriodAfterApproval()) {
            return (false, EMPLOYER_WIN_PATH_NONE);
        }

        uint256 totalVotes = approvals + disapprovals;
        if (totalVotes == 0 || totalVotes < manager.voteQuorum() || approvals >= disapprovals) {
            return (false, EMPLOYER_WIN_PATH_NONE);
        }
        return (true, EMPLOYER_WIN_PATH_FINALIZE);
    }

    function _composeReadinessWithFunding(
        bool pathReady,
        uint8 pathCode,
        bool balanceSufficient,
        bool allowanceSufficient,
        uint256 burnAmount
    )
        internal
        pure
        returns (
            bool employerWinReadyNow,
            bool balanceOk,
            bool allowanceOk,
            uint8 reasonCode,
            uint8 settlementPathCode
        )
    {
        if (!pathReady) {
            return (
                false,
                balanceSufficient,
                allowanceSufficient,
                BURN_READINESS_NOT_EMPLOYER_WIN_PATH,
                EMPLOYER_WIN_PATH_NONE
            );
        }
        if (burnAmount == 0) {
            return (true, true, true, BURN_READINESS_BURN_BPS_ZERO, pathCode);
        }
        if (!balanceSufficient) {
            return (true, false, allowanceSufficient, BURN_READINESS_INSUFFICIENT_BALANCE, pathCode);
        }
        if (!allowanceSufficient) {
            return (true, true, false, BURN_READINESS_INSUFFICIENT_ALLOWANCE, pathCode);
        }
        return (true, true, true, BURN_READINESS_OK, pathCode);
    }
}
