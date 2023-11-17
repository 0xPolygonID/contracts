// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IState } from "@iden3/contracts/interfaces/IState.sol";
import { ClaimBuilder } from "@iden3/contracts/lib/ClaimBuilder.sol";
import { IdentityLib } from "@iden3/contracts/lib/IdentityLib.sol";
import { IdentityBase } from "@iden3/contracts/lib/IdentityBase.sol";
import { PrimitiveTypeUtils } from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";

contract NonMerklizedIdentityExample is IdentityBase, OwnableUpgradeable {
    using IdentityLib for IdentityLib.Data;

    // represent the current credential type
    string private schemaURL;
    uint256 private schemaHash;
    string private schemaJSON;
    string private credentialType;

    // claimsMapSize was used for revocationNonce
    uint64 private claimsMapSize = 0;
   
    // can represent historical claims
    struct ClaimInfo {
        // metadata
        string schemaURL;
        uint256 schemaHash;
        string schemaJSON;
        string credentialType;
        // data
        uint256[8] claim;
    }

    // credential storage
    mapping(uint256 => mapping(string => ClaimInfo)) private claimsMap;

    function setClaim(
        uint256 _id, 
        string memory _uuid,
        uint256[8] memory _claimData
    ) internal {
        claimsMap[_id][_uuid] = ClaimInfo({
            schemaURL: schemaURL,
            schemaHash: schemaHash,
            schemaJSON: schemaJSON,
            credentialType: credentialType,
            claim: _claimData
        }); 
        claimsMapSize++;
    }

    function getUserClaim(uint256 _userId, string memory _uuid) public view returns (ClaimInfo memory) {
        return claimsMap[_userId][_uuid];
    }

    function setSchema(
            string memory _schemaURL, 
            uint256 _schemaHash,
            string memory _schemaJSON,
            string memory _credentialType
        ) public onlyOwner {
        schemaURL = _schemaURL;
        schemaHash = _schemaHash;
        schemaJSON = _schemaJSON;
        credentialType = _credentialType;
    }

    uint256[500] private __gap;

    function initialize(
        address _stateContractAddr,
        string calldata _schemaURL, 
        uint256 _schemaHash,
        string calldata _schemaJSON,
        string calldata _credentialType
    ) public initializer {
        schemaURL = _schemaURL;
        schemaHash = _schemaHash;
        schemaJSON = _schemaJSON;
        credentialType = _credentialType;

        IdentityBase.initialize(_stateContractAddr);
        __Ownable_init();
    }

    function addClaimAndTransit(uint256[8] memory _claim) internal {
        identity.addClaim(_claim);
        identity.transitState();
    }

    function revokeClaimAndTransit(uint64 _revocationNonce) public onlyOwner {
        identity.revokeClaim(_revocationNonce);
        identity.transitState();
    }

    function issueCredential(uint256 _userId, string memory _uuid) public {
        ClaimBuilder.ClaimData memory claimData = ClaimBuilder.ClaimData({
             // metadata
            schemaHash: schemaHash,
            idPosition: ClaimBuilder.ID_POSITION_INDEX,
            expirable: true,
            updatable: false,
            merklizedRootPosition: 0,
            version: 0,
            id: _userId,
            revocationNonce: claimsMapSize,
            expirationDate: 3183110232,
            // data
            merklizedRoot: 0,
            indexDataSlotA: convertAddressToUint256(msg.sender),
            indexDataSlotB: weiToGwei(msg.sender.balance),
            valueDataSlotA: 0,
            valueDataSlotB: 0
        });
        uint256[8] memory claim = ClaimBuilder.build(claimData);
        addClaimAndTransit(claim);
        setClaim(_userId, _uuid, claim);
    }

    function weiToGwei(uint weiAmount) internal pure returns (uint256) {
        return weiAmount / 1e9;
    }

    function convertAddressToUint256(address _addr) internal pure returns (uint256) {
        return uint256(uint160(_addr));
    }
}
