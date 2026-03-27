// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAGIJobManagerBurnView {
    function agiToken() external view returns (address);
    function employerBurnBps() external view returns (uint256);
    function voteQuorum() external view returns (uint256);
    function completionReviewPeriod() external view returns (uint256);
    function challengePeriodAfterApproval() external view returns (uint256);
    function disputeReviewPeriod() external view returns (uint256);
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
        (bool ready, bool balanceOk, bool allowanceOk,,) = _getEmployerBurnReadiness(jobId);
        return ready && balanceOk && allowanceOk;
    }

    function _getEmployerBurnReadiness(uint256 jobId)
        internal
        view
        returns (
            bool employerWinReadyNow,
            bool balanceSufficient,
            bool allowanceSufficient,
            uint8 reasonCode,
            uint8 settlementPathCode
        )
    {
        (address employer,, uint256 payout,,, bool completed, bool disputed, bool expired,) = manager.getJobCore(jobId);
        if (completed || expired) {
            return (false, true, true, BURN_READINESS_ALREADY_TERMINAL, EMPLOYER_WIN_PATH_NONE);
        }

        uint256 burnAmount;
        (burnAmount, balanceSufficient, allowanceSufficient) = _getBurnFundingStatus(employer, payout);

        if (disputed) {
            (, , , , uint256 disputedAt) = manager.getJobValidation(jobId);
            employerWinReadyNow = true;
            settlementPathCode = EMPLOYER_WIN_PATH_DISPUTE_MODERATOR;
            if (block.timestamp > disputedAt + manager.disputeReviewPeriod()) {
                settlementPathCode = EMPLOYER_WIN_PATH_STALE_DISPUTE_OWNER;
            }
        } else {
            (
                bool completionRequested,
                uint256 approvals,
                uint256 disapprovals,
                uint256 completionRequestedAt,
                uint256 disputedAtIgnored
            ) = manager.getJobValidation(jobId);
            disputedAtIgnored;
            if (!completionRequested) {
                return (false, balanceSufficient, allowanceSufficient, BURN_READINESS_NOT_EMPLOYER_WIN_PATH, EMPLOYER_WIN_PATH_NONE);
            }
            if (block.timestamp <= completionRequestedAt + manager.completionReviewPeriod()) {
                return (false, balanceSufficient, allowanceSufficient, BURN_READINESS_NOT_EMPLOYER_WIN_PATH, EMPLOYER_WIN_PATH_NONE);
            }
            // Conservative challenge-window guard: if any approval quorum could have armed validatorApproved,
            // do not report finalize-path readiness until challenge window has definitely elapsed.
            if (approvals >= manager.voteQuorum()) {
                uint256 minSafeFinalizationTime = completionRequestedAt
                    + manager.completionReviewPeriod()
                    + manager.challengePeriodAfterApproval();
                if (block.timestamp <= minSafeFinalizationTime) {
                    return (false, balanceSufficient, allowanceSufficient, BURN_READINESS_NOT_EMPLOYER_WIN_PATH, EMPLOYER_WIN_PATH_NONE);
                }
            }
            uint256 totalVotes = approvals + disapprovals;
            if (totalVotes == 0 || totalVotes < manager.voteQuorum() || approvals >= disapprovals) {
                return (false, balanceSufficient, allowanceSufficient, BURN_READINESS_NOT_EMPLOYER_WIN_PATH, EMPLOYER_WIN_PATH_NONE);
            }
            employerWinReadyNow = true;
            settlementPathCode = EMPLOYER_WIN_PATH_FINALIZE;
        }

        if (burnAmount == 0) {
            return (employerWinReadyNow, true, true, BURN_READINESS_BURN_BPS_ZERO, settlementPathCode);
        }
        if (!balanceSufficient) {
            return (employerWinReadyNow, false, allowanceSufficient, BURN_READINESS_INSUFFICIENT_BALANCE, settlementPathCode);
        }
        if (!allowanceSufficient) {
            return (employerWinReadyNow, true, false, BURN_READINESS_INSUFFICIENT_ALLOWANCE, settlementPathCode);
        }
        return (employerWinReadyNow, true, true, BURN_READINESS_OK, settlementPathCode);
    }

    function _getBurnFundingStatus(address employer, uint256 payout)
        internal
        view
        returns (uint256 burnAmount, bool balanceSufficient, bool allowanceSufficient)
    {
        burnAmount = (payout * manager.employerBurnBps()) / 10_000;
        if (burnAmount == 0) {
            return (0, true, true);
        }
        address token = manager.agiToken();
        balanceSufficient = IERC20ReadOnly(token).balanceOf(employer) >= burnAmount;
        allowanceSufficient = IERC20ReadOnly(token).allowance(employer, address(manager)) >= burnAmount;
    }
}
