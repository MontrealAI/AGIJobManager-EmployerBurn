// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract MockERC20 is ERC20, ERC20Burnable {
    constructor() ERC20("Mock AGI", "mAGI") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
