// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockPausableBurnableERC20 is ERC20, ERC20Burnable {
    bool public burnPaused;

    constructor() ERC20("Mock Pausable AGI", "mpAGI") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function pause() external {
        burnPaused = true;
    }

    function unpause() external {
        burnPaused = false;
    }

    function burnFrom(address account, uint256 amount) public override {
        require(!burnPaused, "burn paused");
        super.burnFrom(account, amount);
    }
}
