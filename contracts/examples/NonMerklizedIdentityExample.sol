// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IState } from "@iden3/contracts/interfaces/IState.sol";
import { ClaimBuilder } from "@iden3/contracts/lib/ClaimBuilder.sol";
import { IdentityLib } from "@iden3/contracts/lib/IdentityLib.sol";
import { IdentityBase } from "@iden3/contracts/lib/IdentityBase.sol";
import { PrimitiveTypeUtils } from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";

/**
 * @dev Contract managing nonmerklized onchain identity
 */
contract NonMerklizedIdentityExample is IdentityBase, OwnableUpgradeable {
    using IdentityLib for IdentityLib.Data;

    // ClaimInfo represents a claim and its metadata
    struct ClaimInfo {
        // metadata
        string jsonldSchemaURL;
        uint256 jsonldSchemaHash;
        string jsonSchemaURL;
        string credentialType;
        // data
        uint256[8] claim;
    }

    uint256[500] private __gap_before;

    // These variables are used to create core claims
    // They represent the type of claim
    string private jsonldSchemaURL;
    uint256 private jsonldSchemaHash;
    string private jsonSchemaURL;
    string private credentialType;

    // countOfIssuedClaims count of issued claims for incrementing revocation nonce for new claims
    uint64 private countOfIssuedClaims = 0;
   
    // claimsMap claims storage
    mapping(uint256 => mapping(string => ClaimInfo)) private claimsMap;
   
    uint256[44] private __gap_after;

    function initialize(
        address _stateContractAddr,
        string calldata _jsonldSchemaURL, 
        uint256 _jsonldSchemaHash,
        string calldata _jsonSchemaURL,
        string calldata _credentialType
    ) public initializer {
        jsonldSchemaURL = _jsonldSchemaURL;
        jsonldSchemaHash = _jsonldSchemaHash;
        jsonSchemaURL = _jsonSchemaURL;
        credentialType = _credentialType;

        IdentityBase.initialize(_stateContractAddr);
        __Ownable_init();
    }

    // saveClaim save a claim to storage
    function saveClaim(
        uint256 _id,
        string memory _uuid,
        uint256[8] memory _claim
    ) private {
        claimsMap[_id][_uuid] = ClaimInfo({
            jsonldSchemaURL: jsonldSchemaURL,
            jsonldSchemaHash: jsonldSchemaHash,
            jsonSchemaURL: jsonSchemaURL,
            credentialType: credentialType,
            claim: _claim
        }); 
        countOfIssuedClaims++;
    }

    /**
     * @dev Get user claim by user id and uuid
     * @param _userId - user id
     * @param _uuid - uuid of the claim that was used for issuing claim
     */
    function getUserClaim(uint256 _userId, string memory _uuid) public view returns (ClaimInfo memory) {
        return claimsMap[_userId][_uuid];
    }

    /**
     * @dev Set schema
     * @param _jsonldSchemaURL  - JSONLD schema url
     * @param _jsonldSchemaHash - JSONLD schema hash. Use this code snippet to calculate hash: https://go.dev/play/p/3id7HAhf-Wi 
     * @param _jsonSchemaURL  - JSON schema url
     * @param _credentialType - credential type
     */
    function setSchema(
            string memory _jsonldSchemaURL, 
            uint256 _jsonldSchemaHash,
            string memory _jsonSchemaURL,
            string memory _credentialType
        ) public onlyOwner {
        jsonldSchemaURL = _jsonldSchemaURL;
        jsonldSchemaHash = _jsonldSchemaHash;
        jsonSchemaURL = _jsonSchemaURL;
        credentialType = _credentialType;
    }

    // addClaimAndTransit add a claim to the identity and transit state
    function addClaimAndTransit(uint256[8] memory _claim) private {
        identity.addClaim(_claim);
        identity.transitState();
    }

    /**
     * @dev Revoke claim using it's revocationNonce
     * @param _revocationNonce  - revocation nonce
     */
    function revokeClaimAndTransit(uint64 _revocationNonce) public onlyOwner {
        identity.revokeClaim(_revocationNonce);
        identity.transitState();
    }

    /**
     * @dev Issue credential
     * @param _userId - user id for which the claim is issued
     * @param _uuid - uuid of the claim
     */
    function issueCredential(uint256 _userId, string memory _uuid) public {
        ClaimBuilder.ClaimData memory claimData = ClaimBuilder.ClaimData({
             // metadata
            schemaHash: jsonldSchemaHash,
            idPosition: ClaimBuilder.ID_POSITION_INDEX,
            expirable: true,
            updatable: false,
            merklizedRootPosition: 0,
            version: 0,
            id: _userId,
            revocationNonce: countOfIssuedClaims,
            expirationDate: 3183110232,
            // data
            merklizedRoot: 0,
            indexDataSlotA: PrimitiveTypeUtils.addressToUint256(msg.sender),
            indexDataSlotB: weiToGwei(msg.sender.balance),
            valueDataSlotA: 0,
            valueDataSlotB: 0
        });
        uint256[8] memory claim = ClaimBuilder.build(claimData);
        addClaimAndTransit(claim);
        saveClaim(_userId, _uuid, claim);
    }

    function weiToGwei(uint weiAmount) internal pure returns (uint256) {
        return weiAmount / 1e9;
    }
}
