// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HookMiner
/// @notice A utility to mine salt values for hook deployment
/// @dev This is a simplified version for testing - mines a salt that produces
///      a hook address with the correct permission flags encoded in the address
library HookMiner {
    /// @notice Find a salt that produces a hook address with the given flags
    /// @param deployer The address that will deploy the hook
    /// @param flags The flags that should be encoded in the hook address
    /// @param creationCode The creation code of the hook contract
    /// @param constructorArgs The encoded constructor arguments
    /// @return hookAddress The address where the hook will be deployed
    /// @return salt The salt to use for CREATE2 deployment
    function find(
        address deployer,
        uint160 flags,
        bytes memory creationCode,
        bytes memory constructorArgs
    ) internal pure returns (address hookAddress, bytes32 salt) {
        bytes memory initCode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 initCodeHash = keccak256(initCode);

        // Brute force search for a salt that produces an address with the correct flags
        for (uint256 i = 0; i < 10000; i++) {
            salt = bytes32(i);
            hookAddress = computeAddress(deployer, salt, initCodeHash);

            // Check if the address has the correct flags in the lower bits
            if (uint160(hookAddress) & flags == flags) {
                return (hookAddress, salt);
            }
        }

        revert("HookMiner: Could not find salt");
    }

    /// @notice Compute the CREATE2 address for a contract
    function computeAddress(
        address deployer,
        bytes32 salt,
        bytes32 initCodeHash
    ) internal pure returns (address) {
        return address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            deployer,
                            salt,
                            initCodeHash
                        )
                    )
                )
            )
        );
    }
}
