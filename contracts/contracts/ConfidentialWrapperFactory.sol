// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ConfidentialERC20Wrapper } from "./ConfidentialERC20Wrapper.sol";

interface IWrapperRegistry {
    function register(address token, address confidentialToken) external;
}

/**
 * @title ConfidentialWrapperFactory
 * @notice Deploys an ERC-7984 confidential wrapper for any ERC-20 and registers
 *         the resulting pair in the community {WrapperRegistry}, in one call.
 *         Lets a frontend offer "deploy a confidential wrapper for my token"
 *         entirely from the UI.
 */
contract ConfidentialWrapperFactory {
    IWrapperRegistry public immutable registry;

    event WrapperCreated(
        address indexed token,
        address indexed confidentialToken,
        address indexed creator
    );

    constructor(IWrapperRegistry registry_) {
        registry = registry_;
    }

    /**
     * @notice Deploy a confidential wrapper for `token` and register the pair.
     * @return wrapper The address of the newly deployed ERC-7984 wrapper.
     */
    function createWrapper(
        IERC20 token,
        string calldata name_,
        string calldata symbol_,
        string calldata uri_
    ) external returns (address wrapper) {
        ConfidentialERC20Wrapper w = new ConfidentialERC20Wrapper(token, name_, symbol_, uri_);
        wrapper = address(w);

        registry.register(address(token), wrapper);
        emit WrapperCreated(address(token), wrapper, msg.sender);
    }
}
