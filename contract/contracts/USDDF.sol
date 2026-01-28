// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title USDDF
 * @dev Mock USD-DF stablecoin token for testing with faucet and permit capabilities.
 */
contract USDDF is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint8 private immutable _tokenDecimals;

    constructor() 
        ERC20("DeFa USD", "USD-DF") 
        ERC20Permit("DeFa USD")
        Ownable(msg.sender) 
    {
        _tokenDecimals = 6; // USDC-like decimals
        _mint(msg.sender, 10_000_000 * 10 ** _tokenDecimals);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _tokenDecimals;
    }

    /**
     * @dev Faucet function to allow anyone to get tokens for testing.
     * Mints 1,000 USD-DF to the caller.
     */
    function faucet() external {
        _mint(msg.sender, 1_000 * 10 ** _tokenDecimals);
    }

    /**
     * @dev Mint new tokens (only owner).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Standard ERC20 transfer override.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        return super.transfer(to, amount);
    }

    /**
     * @dev Standard ERC20 transferFrom override.
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Standard ERC20 approve override.
     */
    function approve(address spender, uint256 amount) public virtual override returns (bool) {
        return super.approve(spender, amount);
    }

    /**
     * @dev Helper to mint and approve in one transaction (useful for testing).
     */
    function mintAndApprove(address spender, uint256 amount) external {
        _mint(msg.sender, amount);
        _approve(msg.sender, spender, amount);
    }
}
