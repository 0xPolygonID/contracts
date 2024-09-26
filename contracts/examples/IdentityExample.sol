// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.26;

import {Ownable2StepUpgradeable} from '@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol';
import {ClaimBuilder} from '@iden3/contracts/lib/ClaimBuilder.sol';
import {IdentityLib} from '@iden3/contracts/lib/IdentityLib.sol';
import {IdentityBase} from '@iden3/contracts/lib/IdentityBase.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';

/**
 * @dev Example of centralized credential issuer.
 * This issuer issue merklized credentials centralized.
 */
contract IdentityExample is IdentityBase, Ownable2StepUpgradeable {
    using IdentityLib for IdentityLib.Data;

    function initialize(address _stateContractAddr) public initializer {
        super.initialize(_stateContractAddr, IState(_stateContractAddr).getDefaultIdType());
        __Ownable_init(_msgSender());
    }

    function addClaimAndTransit(uint256[8] calldata claim) public onlyOwner {
        addClaim(claim);
        transitState();
    }

    function addClaimHashAndTransit(uint256 hashIndex, uint256 hashValue) public onlyOwner {
        addClaimHash(hashIndex, hashValue);
        transitState();
    }

    function revokeClaimAndTransit(uint64 revocationNonce) public onlyOwner {
        revokeClaim(revocationNonce);
        transitState();
    }

    /**
     * @dev Add claim
     * @param claim - claim data
     */
    function addClaim(uint256[8] calldata claim) public virtual onlyOwner {
        _getIdentityBaseStorage().identity.addClaim(claim);
    }

    /**
     * @dev Add claim hash
     * @param hashIndex - hash of claim index part
     * @param hashValue - hash of claim value part
     */
    function addClaimHash(uint256 hashIndex, uint256 hashValue) public virtual onlyOwner {
        _getIdentityBaseStorage().identity.addClaimHash(hashIndex, hashValue);
    }

    /**
     * @dev Revoke claim using it's revocationNonce
     * @param revocationNonce - revocation nonce
     */
    function revokeClaim(uint64 revocationNonce) public virtual onlyOwner {
        _getIdentityBaseStorage().identity.revokeClaim(revocationNonce);
    }

    /**
     * @dev Make state transition
     */
    function transitState() public virtual onlyOwner {
        _getIdentityBaseStorage().identity.transitState();
    }

    /**
     * @dev Calculate IdentityState
     * @return IdentityState
     */
    function calcIdentityState() public view virtual returns (uint256) {
        return _getIdentityBaseStorage().identity.calcIdentityState();
    }

    function newClaimData() public pure virtual returns (ClaimBuilder.ClaimData memory) {
        ClaimBuilder.ClaimData memory claimData;
        return claimData;
    }

    // TODO(illia-korotia): need to remove from the contract.
    /**
     * @dev Builds claim
     * @param claimData - claim data
     * @return binary claim
     */
    function buildClaim(
        ClaimBuilder.ClaimData calldata claimData
    ) public pure virtual returns (uint256[8] memory) {
        return ClaimBuilder.build(claimData);
    }
}
