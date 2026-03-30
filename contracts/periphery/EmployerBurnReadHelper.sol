// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAGIJobManagerCreateFundingView {
    function agiToken() external view returns (address);
    function employerBurnBps() external view returns (uint256);
    function getJobEconomicSnapshot(uint256 jobId)
        external
        view
        returns (address token, uint256 payoutEscrow, uint256 employerBurnAmountCharged, uint256 employerBurnBpsSnapshot);
}

interface IERC20ReadOnly {
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/// @title EmployerBurnReadHelper
/// @notice Etherscan-first helper for create-job burn and funding checks.
contract EmployerBurnReadHelper {
    IAGIJobManagerCreateFundingView public immutable manager;

    constructor(address managerAddress) {
        require(managerAddress != address(0), "manager=0");
        manager = IAGIJobManagerCreateFundingView(managerAddress);
    }

    function quoteCreateJobFunding(uint256 payout)
        external
        view
        returns (
            address token,
            address spender,
            uint256 escrowAmount,
            uint256 burnAmount,
            uint256 burnBps,
            uint256 totalRequired
        )
    {
        token = manager.agiToken();
        spender = address(manager);
        escrowAmount = payout;
        burnBps = manager.employerBurnBps();
        burnAmount = (payout * burnBps) / 10_000;
        unchecked {
            totalRequired = escrowAmount + burnAmount;
        }
    }

    function getCreateJobFundingReadiness(address employer, uint256 payout)
        external
        view
        returns (
            address token,
            address spender,
            uint256 escrowAmount,
            uint256 burnAmount,
            uint256 totalRequired,
            uint256 balance,
            uint256 allowance,
            bool balanceSufficient,
            bool allowanceSufficient
        )
    {
        token = manager.agiToken();
        spender = address(manager);
        escrowAmount = payout;
        burnAmount = (payout * manager.employerBurnBps()) / 10_000;
        unchecked {
            totalRequired = escrowAmount + burnAmount;
        }
        balance = IERC20ReadOnly(token).balanceOf(employer);
        allowance = IERC20ReadOnly(token).allowance(employer, spender);
        balanceSufficient = balance >= totalRequired;
        allowanceSufficient = allowance >= totalRequired;
    }

    function getJobEconomicSnapshot(uint256 jobId)
        external
        view
        returns (address token, uint256 payoutEscrow, uint256 employerBurnAmountCharged, uint256 employerBurnBpsSnapshot)
    {
        return manager.getJobEconomicSnapshot(jobId);
    }
}
