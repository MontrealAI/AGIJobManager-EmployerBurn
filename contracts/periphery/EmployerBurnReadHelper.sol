// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAGIJobManagerBurnView {
    function agiToken() external view returns (address);
    function employerBurnBps() external view returns (uint256);
    function getJobBurnBpsSnapshot(uint256 jobId) external view returns (uint256 burnBpsSnapshot);
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
}

interface IERC20ReadOnly {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @title EmployerBurnReadHelper
/// @notice Read-only helper contract for Etherscan-first employer burn preflight and audit checks.
/// @dev This helper is additive and non-authoritative: AGIJobManager remains settlement source-of-truth.
/// @dev Corrected successor semantics charge burn only at createJob. Settlement-time burn readiness is deprecated.
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
    uint8 public constant BURN_READINESS_NOT_APPLICABLE_CREATEJOB_ONLY = 7;

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
        burnBps = manager.getJobBurnBpsSnapshot(jobId);
        spender = address(manager);
        amount = (payout * burnBps) / 10_000;
    }

    function quoteCreateJobBurn(uint256 payout) external view returns (uint256 burnAmount, uint256 burnBps) {
        burnBps = manager.employerBurnBps();
        burnAmount = (payout * burnBps) / 10_000;
    }

    function getCreateJobFundingRequirement(uint256 payout)
        external
        view
        returns (uint256 escrowAmount, uint256 burnAmount, uint256 totalUpfront)
    {
        escrowAmount = payout;
        burnAmount = (payout * manager.employerBurnBps()) / 10_000;
        totalUpfront = escrowAmount + burnAmount;
    }

    function getCreateJobAllowanceRequirement(uint256 payout) external view returns (uint256 allowanceRequired) {
        allowanceRequired = payout + ((payout * manager.employerBurnBps()) / 10_000);
    }

    function getCreateJobAllowanceRequirementWithToken(uint256 payout)
        external
        view
        returns (address token, address spender, uint256 allowanceRequired)
    {
        token = manager.agiToken();
        spender = address(manager);
        allowanceRequired = payout + ((payout * manager.employerBurnBps()) / 10_000);
    }

    function getJobBurnAmountSnapshot(uint256 jobId) external view returns (uint256 burnAmountCharged) {
        (, , uint256 payoutEscrowed, , , , , , ) = manager.getJobCore(jobId);
        uint256 burnBpsSnapshot = manager.getJobBurnBpsSnapshot(jobId);
        burnAmountCharged = (payoutEscrowed * burnBpsSnapshot) / 10_000;
    }

    function getJobEconomicSnapshot(uint256 jobId)
        external
        view
        returns (
            address employer,
            address token,
            uint256 payoutEscrowed,
            uint256 burnAmountCharged,
            uint256 totalUpfrontAtCreate,
            uint256 burnBpsSnapshot
        )
    {
        (employer,, payoutEscrowed,,,,,,) = manager.getJobCore(jobId);
        token = manager.agiToken();
        burnBpsSnapshot = manager.getJobBurnBpsSnapshot(jobId);
        burnAmountCharged = (payoutEscrowed * burnBpsSnapshot) / 10_000;
        totalUpfrontAtCreate = payoutEscrowed + burnAmountCharged;
    }

    function getCreateJobFundingReadiness(uint256 payout, address employer)
        external
        view
        returns (
            uint256 totalUpfront,
            uint256 employerBalance,
            uint256 employerAllowance,
            bool balanceSufficient,
            bool allowanceSufficient
        )
    {
        totalUpfront = payout + ((payout * manager.employerBurnBps()) / 10_000);
        address token = manager.agiToken();
        employerBalance = IERC20ReadOnly(token).balanceOf(employer);
        employerAllowance = IERC20ReadOnly(token).allowance(employer, address(manager));
        balanceSufficient = employerBalance >= totalUpfront;
        allowanceSufficient = employerAllowance >= totalUpfront;
    }

    /// @notice Deprecated in createJob-only burn semantics. Kept for backward compatibility.
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
        uint256 burnBpsSnapshot = manager.getJobBurnBpsSnapshot(jobId);
        amount = (payout * burnBpsSnapshot) / 10_000;
        payerBalance = IERC20ReadOnly(token).balanceOf(payer);
        payerAllowance = IERC20ReadOnly(token).allowance(payer, spender);
        balanceSufficient = payerBalance >= amount;
        allowanceSufficient = payerAllowance >= amount;
    }

    /// @notice Deprecated in createJob-only burn semantics. Kept for backward compatibility.
    function getEmployerBurnReadiness(uint256)
        external
        pure
        returns (
            bool employerWinReadyNow,
            bool balanceSufficient,
            bool allowanceSufficient,
            uint8 reasonCode,
            uint8 settlementPathCode
        )
    {
        return (
            false,
            true,
            true,
            BURN_READINESS_NOT_APPLICABLE_CREATEJOB_ONLY,
            EMPLOYER_WIN_PATH_NONE
        );
    }

    /// @notice Deprecated in createJob-only burn semantics. Always false.
    function canFinalizeEmployerWinWithBurn(uint256) external pure returns (bool) {
        return false;
    }
}
