// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { ERC7984 } from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import { ERC7984ERC20Wrapper } from
    "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";

/**
 * @title ConfidentialERC20Wrapper
 * @notice A concrete, deployable ERC-7984 confidential wrapper around any ERC-20.
 *         `wrap()` pulls the underlying ERC-20 (via approval) and mints an
 *         encrypted euint64 balance; `unwrap()` burns and releases the ERC-20
 *         through the asynchronous public-decryption flow.
 *
 *         `ZamaEthereumConfig` wires the coprocessor by `block.chainid`, so the
 *         same bytecode works on mainnet (1), Sepolia (11155111) and localhost.
 */
contract ConfidentialERC20Wrapper is ZamaEthereumConfig, ERC7984ERC20Wrapper {
    constructor(
        IERC20 underlying_,
        string memory name_,
        string memory symbol_,
        string memory uri_
    ) ERC7984(name_, symbol_, uri_) ERC7984ERC20Wrapper(underlying_) {}
}
