// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

interface IUnderlying {
    function underlying() external view returns (address);
}

/**
 * @title WrapperRegistry
 * @notice A permissionless, community ERC-20 ↔ ERC-7984 wrapper registry.
 *
 *         Zama's official registry is owner-gated, so it cannot accept
 *         user-submitted pairs. This registry is open: anyone (typically the
 *         WrapperFactory, or a user with an already-deployed wrapper) can
 *         register a pair, provided the confidential token actually wraps the
 *         given ERC-20 (`confidentialToken.underlying() == token`).
 *
 *         The read surface deliberately mirrors Zama's
 *         `getTokenConfidentialTokenPairs()` so the same frontend ABI and
 *         merge logic read both registries.
 */
contract WrapperRegistry {
    struct TokenWrapperPair {
        address tokenAddress; // public ERC-20
        address confidentialTokenAddress; // ERC-7984 wrapper
        bool isValid;
    }

    TokenWrapperPair[] private _pairs;
    /// confidentialToken => registered?
    mapping(address => bool) public isRegistered;
    /// confidentialToken => who registered it.
    mapping(address => address) public registrar;

    event PairRegistered(
        address indexed tokenAddress,
        address indexed confidentialTokenAddress,
        address indexed registrar
    );

    error AlreadyRegistered(address confidentialToken);
    error UnderlyingMismatch(address confidentialToken, address expected, address actual);
    error ZeroAddress();

    /**
     * @notice Register an ERC-20 ↔ ERC-7984 pair. Permissionless, but validated:
     *         the confidential token must report `underlying() == token`.
     */
    function register(address token, address confidentialToken) external {
        if (token == address(0) || confidentialToken == address(0)) revert ZeroAddress();
        if (isRegistered[confidentialToken]) revert AlreadyRegistered(confidentialToken);

        address actual = IUnderlying(confidentialToken).underlying();
        if (actual != token) revert UnderlyingMismatch(confidentialToken, token, actual);

        isRegistered[confidentialToken] = true;
        registrar[confidentialToken] = msg.sender;
        _pairs.push(TokenWrapperPair(token, confidentialToken, true));

        emit PairRegistered(token, confidentialToken, msg.sender);
    }

    /// @notice All registered pairs (Zama-registry-compatible shape).
    function getTokenConfidentialTokenPairs() external view returns (TokenWrapperPair[] memory) {
        return _pairs;
    }

    function getTokenConfidentialTokenPairsLength() external view returns (uint256) {
        return _pairs.length;
    }
}
