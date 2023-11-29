// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import { OwnableUpgradeable } from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IState } from "@iden3/contracts/interfaces/IState.sol";
import { ClaimBuilder } from "@iden3/contracts/lib/ClaimBuilder.sol";
import { IdentityLib } from "@iden3/contracts/lib/IdentityLib.sol";
import { IdentityBase } from "@iden3/contracts/lib/IdentityBase.sol";
import { PrimitiveTypeUtils } from "@iden3/contracts/lib/PrimitiveTypeUtils.sol";

/**
 * @dev Example of decentralized balance credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract BalanceCredentialIssuer is IdentityBase, OwnableUpgradeable {
    using IdentityLib for IdentityLib.Data;

    // Information about the schema that is used
    // for building verifiable credential from claim
    struct SchemaInfo {
        string jsonldSchemaURL;
        string jsonSchemaURL;
        string credentialType;
    }

    // Claim representation
    struct Claim {
        uint256[8] claim;
    }

    /**
     * @dev Version of contract
     */
    string public constant VERSION = "1.0.0";

    // jsonldSchemaHash hash of jsonld schema.
    // More about schema: https://devs.polygonid.com/docs/issuer-node/issuer-node-api/claim/apis/#get-claims
    uint256 private constant jsonldSchemaHash = 134825296953649542485291823871789853562;

    uint256[500] private __gap_before;
    
    // countOfIssuedClaims count of issued claims for incrementing revocation nonce for new claims
    uint64 private countOfIssuedClaims = 0;
    mapping(uint256 => Claim[]) private claimStorage;

    uint256[48] private __gap_after;

    function initialize(
        address _stateContractAddr
    ) public initializer override {
        IdentityBase.initialize(_stateContractAddr);
        __Ownable_init();
    }

    /**
     * @dev Get schema info by schema hash
     * @param _jsonldSchemaHash - schema hash
     */
    function getSchemaInfo(uint256 _jsonldSchemaHash) public pure returns (SchemaInfo memory) {
        require(_jsonldSchemaHash == jsonldSchemaHash, "Invalid schema hash");
        return SchemaInfo({
            jsonldSchemaURL: "https://gist.githubusercontent.com/ilya-korotya/ac20f870943abd4805fe882ae8f3dccd/raw/1d9969a6d0454280c8d5e79b959faf9b3978b497/balance.jsonld",
            jsonSchemaURL: "https://gist.githubusercontent.com/ilya-korotya/26ba81feb4da2f49f4b473661b80e8e3/raw/32113f4725088f32f31a6b06b4abdc94bc4b2d17/balance.json",
            credentialType: "Balance"
        });
    }

    /**
     * @dev Get all user claims by user id
     * @param _userId - user id
     */
    function getUserClaims(uint256 _userId) public view returns (Claim[] memory) {
        return claimStorage[_userId];
    }

    /**
     * @dev Get user claim by user id and index
     * @param _userId - user id
     * @param _index - index of the claim
     */
    function getUserClaimByIndex(uint256 _userId, uint _index) public view returns (Claim memory) {
        return claimStorage[_userId][_index];
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
     * @dev Issue credential with user's balance
     * @param _userId - user id for which the claim is issued
     */
    function issueBalanceCredential(uint256 _userId) public {
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
            expirationDate: convertTime(block.timestamp + 30 days),
            // data
            merklizedRoot: 0,
            indexDataSlotA: PrimitiveTypeUtils.addressToUint256(msg.sender),
            indexDataSlotB: weiToGwei(msg.sender.balance),
            valueDataSlotA: 0,
            valueDataSlotB: 0
        });
        uint256[8] memory claim = ClaimBuilder.build(claimData);
        saveClaim(_userId, claim);
        addClaimAndTransit(claim);
    }


    // saveClaim save a claim to storage
    function saveClaim(
        uint256 _userId,
        uint256[8] memory _claim
    ) private {
        claimStorage[_userId].push(Claim(_claim));
        countOfIssuedClaims++;
    }

    // addClaimAndTransit add a claim to the identity and transit state
    function addClaimAndTransit(uint256[8] memory _claim) private {
        identity.addClaim(_claim);
        identity.transitState();
    }

    function weiToGwei(uint weiAmount) internal pure returns (uint256) {
        return weiAmount / 1e9;
    }

    function convertTime(uint256 timestamp) internal pure returns (uint64) {
        require(timestamp <= type(uint64).max, "Timestamp exceeds uint64 range");
        return uint64(timestamp);
    }
}
