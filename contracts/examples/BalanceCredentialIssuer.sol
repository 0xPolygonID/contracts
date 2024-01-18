// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {ClaimBuilder} from '@iden3/contracts/lib/ClaimBuilder.sol';
import {IdentityLib} from '@iden3/contracts/lib/IdentityLib.sol';
import {OnchainNonMerklizedIdentityBase} from '@iden3/contracts/lib/OnchainNonMerklizedIdentityBase.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {PoseidonUnit4L} from '@iden3/contracts/lib/Poseidon.sol';

/**
 * @dev Example of decentralized balance credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract BalanceCredentialIssuer is OnchainNonMerklizedIdentityBase, OwnableUpgradeable {
    using IdentityLib for IdentityLib.Data;

    /**
     * @dev Version of contract
     */
    string public constant VERSION = '1.0.0';

    // jsonldSchemaHash hash of jsonld schema.
    // More about schema: https://devs.polygonid.com/docs/issuer-node/issuer-node-api/claim/apis/#get-claims
    uint256 private constant jsonldSchemaHash = 134825296953649542485291823871789853562;

    struct ClaimData {
        CredentialMetadata metadata;
        Claim claim;
    }

    uint256[500] private __gap_before;
    // countOfIssuedClaims count of issued claims for incrementing id and revocation nonce for new claims
    uint64 private countOfIssuedClaims = 0;
    // claims sotre
    mapping(uint256 => Id[]) private userClaims;
    mapping(uint256 => ClaimData) private idToClaim;
    // this mapping is used to store credential subject fields
    // to escape additional copy in issueCredential function
    // since "Copying of type struct OnchainNonMerklizedIdentityBase.SubjectField memory[] memory to storage not yet supported.""
    mapping(uint256 => SubjectField[]) private idToCredentialSubject;
    uint256[46] private __gap_after;

    function initialize(address _stateContractAddr) public override initializer {
        super.initialize(_stateContractAddr);
        __Ownable_init();
    }

    /**
     * @dev Get user's id list of credentials
     * @param _userId - user id
     * @return list of credential ids
     */
    function listUserCredentials(uint256 _userId) external view override returns (Id[] memory) {
        return userClaims[_userId];
    }

    /**
     * @dev Get credential by id
     * @param _userId - user id
     * @param _credentialId - credential id
     * @return credential data
     */
    function getCredential(
        uint256 _userId,
        uint256 _credentialId
    ) external view override returns (CredentialData memory) {
        string[] memory jsonLDContextUrls = new string[](1);
        //prettier-ignore
        jsonLDContextUrls[0] = 
            'https://gist.githubusercontent.com/ilya-korotya/ac20f870943abd4805fe882ae8f3dccd/raw/1d9969a6d0454280c8d5e79b959faf9b3978b497/balance.jsonld';

        ClaimData memory claim = idToClaim[_credentialId];
        return
            processOnchainCredentialData(
                CredentialInformation({
                    jsonLDContextUrls: jsonLDContextUrls,
                    jsonSchemaUrl: 'https://gist.githubusercontent.com/ilya-korotya/26ba81feb4da2f49f4b473661b80e8e3/raw/32113f4725088f32f31a6b06b4abdc94bc4b2d17/balance.json',
                    _type: 'Balance'
                }),
                CredentialMetadata({
                    id: claim.metadata.id,
                    revocationNonce: claim.metadata.revocationNonce,
                    issuanceDate: claim.metadata.issuanceDate,
                    expirationDate: claim.metadata.expirationDate
                }),
                idToCredentialSubject[_credentialId],
                claim.claim
            );
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
    function issueCredential(uint256 _userId) public {
        uint64 expirationDate = convertTime(block.timestamp + 30 days);
        uint256 ownerAddress = PrimitiveTypeUtils.addressToUint256(msg.sender);
        uint256 ownerBalance = weiToGwei(msg.sender.balance);

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
            expirationDate: expirationDate,
            // data
            merklizedRoot: 0,
            indexDataSlotA: ownerAddress,
            indexDataSlotB: ownerBalance,
            valueDataSlotA: 0,
            valueDataSlotB: 0
        });
        uint256[8] memory claim = ClaimBuilder.build(claimData);

        uint256 hashIndex = PoseidonUnit4L.poseidon([claim[0], claim[1], claim[2], claim[3]]);
        uint256 hashValue = PoseidonUnit4L.poseidon([claim[4], claim[5], claim[6], claim[7]]);

        ClaimData memory claimToSave = ClaimData(
            CredentialMetadata({
                id: countOfIssuedClaims,
                revocationNonce: countOfIssuedClaims,
                issuanceDate: convertTime(block.timestamp),
                expirationDate: expirationDate
            }),
            Claim({coreClaim: claim, hashIndex: hashIndex, hashValue: hashValue})
        );

        idToCredentialSubject[countOfIssuedClaims].push(
            SubjectField({key: 'balance', value: ownerBalance, rawValue: ''})
        );
        idToCredentialSubject[countOfIssuedClaims].push(
            SubjectField({key: 'address', value: ownerAddress, rawValue: ''})
        );
        idToCredentialSubject[countOfIssuedClaims].push(
            SubjectField({key: 'id', value: _userId, rawValue: ''})
        );

        addClaimHashAndTransit(hashIndex, hashValue);
        saveClaim(_userId, claimToSave);
    }

    // saveClaim save a claim to storage
    function saveClaim(uint256 _userId, ClaimData memory _claim) private {
        userClaims[_userId].push(Id({id: countOfIssuedClaims}));
        idToClaim[countOfIssuedClaims] = _claim;
        countOfIssuedClaims++;
    }

    // addClaimAndTransit add a claim to the identity and transit state
    function addClaimHashAndTransit(uint256 hashIndex, uint256 hashValue) private {
        identity.addClaimHash(hashIndex, hashValue);
        identity.transitState();
    }

    function weiToGwei(uint weiAmount) private pure returns (uint256) {
        return weiAmount / 1e9;
    }

    function convertTime(uint256 timestamp) private pure returns (uint64) {
        require(timestamp <= type(uint64).max, 'Timestamp exceeds uint64 range');
        return uint64(timestamp);
    }
}
