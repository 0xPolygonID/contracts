// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {ClaimBuilder} from '@iden3/contracts/lib/ClaimBuilder.sol';
import {IdentityLib} from '@iden3/contracts/lib/IdentityLib.sol';
import {IdentityBase} from '@iden3/contracts/lib/IdentityBase.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {SmtLib} from '@iden3/contracts/lib/SmtLib.sol';
import {PoseidonUnit4L} from '@iden3/contracts/lib/Poseidon.sol';
import {GenesisUtils} from '@iden3/contracts/lib/GenesisUtils.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';
import {IOnchainIssuer} from '@iden3/contracts/interfaces/IOnchainIssuer.sol';
import {W3CLib} from '@iden3/contracts/lib/W3CLib.sol';

/**
 * @dev Example of decentralized balance credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract BalanceCredentialIssuer is IdentityBase, OwnableUpgradeable, IOnchainIssuer {
    using IdentityLib for IdentityLib.Data;
    IState private state;

    struct BalanceCredentialSubject {
        uint256 balance;
        uint256 ownerAddress;
    }

    struct CredentialMetadata {
        uint64 expirationDate;
        uint64 issuanceDate;
        uint64 sequenceNumber;
    }

    // Claim representation
    struct Claim {
        uint256[8] claim;
        BalanceCredentialSubject balanceCredentialSubject;
        CredentialMetadata credentialMetadata;
    }

    /**
     * @dev Version of contract
     */
    string public constant VERSION = '1.0.0';

    // jsonldSchemaHash hash of jsonld schema.
    // More about schema: https://devs.polygonid.com/docs/issuer-node/issuer-node-api/claim/apis/#get-claims
    uint256 private constant jsonldSchemaHash = 134825296953649542485291823871789853562;

    uint256[500] private __gap_before;

    // countOfIssuedClaims count of issued claims for incrementing id and revocation nonce for new claims
    uint64 private countOfIssuedClaims = 0;
    mapping(uint256 => Claim[]) private claimStorage;

    uint256[48] private __gap_after;

    function initialize(address _stateContractAddr) public override initializer {
        IdentityBase.initialize(_stateContractAddr);
        state = IState(_stateContractAddr);
        __Ownable_init();
    }

    /**
     * @dev Get user's verifiable credentials
     * @param _userId - user id
     */
    function getCredentials(
        uint256 _userId
    ) public view returns (W3CLib.Credential[] memory) {
        Claim[] memory claims = claimStorage[_userId];
        W3CLib.Credential[]
            memory credentials = new W3CLib.Credential[](claims.length);
        for (uint i = 0; i < claims.length; i++) {
            credentials[i] = convertToVerifiableCredential(claims[i]);
        }
        return credentials;
    }

    function convertToVerifiableCredential(
        Claim memory _claim
    ) private view returns (W3CLib.Credential memory) {
        W3CLib.State memory _state = W3CLib.State({
            rootOfRoots: PrimitiveTypeUtils.uint256ToHex(PrimitiveTypeUtils.reverseUint256(super.getLatestPublishedRootsRoot())),
            claimsTreeRoot: PrimitiveTypeUtils.uint256ToHex(PrimitiveTypeUtils.reverseUint256(super.getLatestPublishedClaimsRoot())),
            revocationTreeRoot: PrimitiveTypeUtils.uint256ToHex(PrimitiveTypeUtils.reverseUint256(super.getLatestPublishedRevocationsRoot())),
            value: PrimitiveTypeUtils.uint256ToHex(PrimitiveTypeUtils.reverseUint256(super.getLatestPublishedState()))
        });

        uint256 issuerID = GenesisUtils.calcIdFromEthAddress(
            state.getDefaultIdType(),
            address(this)
        );
        W3CLib.IssuerData memory issuerData = W3CLib.IssuerData({
            id: issuerID,
            state: _state
        });

        uint256 hi = PoseidonUnit4L.poseidon(
            [_claim.claim[0], _claim.claim[1], _claim.claim[2], _claim.claim[3]]
        );
        SmtLib.Proof memory mtp = super.getClaimProof(hi);
        W3CLib.Proof memory mtpProof = W3CLib.Proof({
            _type: 'Iden3SparseMerkleTreeProof',
            coreClaim: _claim.claim,
            mtp: mtp,
            issuerData: issuerData
        });
        W3CLib.Proof[] memory proofs = new W3CLib.Proof[](1);
        proofs[0] = mtpProof;

        W3CLib.CredentialSubjectField[]
            memory credentialSubject = new W3CLib.CredentialSubjectField[](4);
        credentialSubject[0] = W3CLib.CredentialSubjectField({
            key: 'id',
            value: _claim.claim[1],
            rawValue: ''
        });
        credentialSubject[1] = W3CLib.CredentialSubjectField({
            key: 'balance',
            value: _claim.balanceCredentialSubject.balance,
            rawValue: ''
        });
        credentialSubject[2] = W3CLib.CredentialSubjectField({
            key: 'address',
            value: _claim.balanceCredentialSubject.ownerAddress,
            rawValue: ''
        });
        credentialSubject[3] = W3CLib.CredentialSubjectField({
            key: 'type',
            value: 0,
            rawValue: bytes('Balance')
        });

        return
            W3CLib.Credential({
                id: _claim.credentialMetadata.sequenceNumber,
                context: [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://schema.iden3.io/core/jsonld/iden3proofs.jsonld',
                    'https://gist.githubusercontent.com/ilya-korotya/ac20f870943abd4805fe882ae8f3dccd/raw/1d9969a6d0454280c8d5e79b959faf9b3978b497/balance.jsonld'
                ],
                _type: ['VerifiableCredential', 'Balance'],
                expirationDate: _claim.credentialMetadata.expirationDate,
                issuanceDate: _claim.credentialMetadata.issuanceDate,
                issuer: issuerID,
                credentialSubject: credentialSubject,
                credentialStatus: buildCredentialStatusVerifiableCredential(
                    _claim.credentialMetadata.sequenceNumber
                ),
                credentialSchema: W3CLib.CredentialSchema({
                    id: 'https://gist.githubusercontent.com/ilya-korotya/26ba81feb4da2f49f4b473661b80e8e3/raw/32113f4725088f32f31a6b06b4abdc94bc4b2d17/balance.json',
                    _type: 'JsonSchema2023'
                }),
                proof: proofs
            });
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

        Claim memory internalClaim = Claim({
            claim: claim,
            balanceCredentialSubject: BalanceCredentialSubject({
                ownerAddress: ownerAddress,
                balance: ownerBalance
            }),
            credentialMetadata: CredentialMetadata({
                sequenceNumber: countOfIssuedClaims,
                issuanceDate: convertTime(block.timestamp),
                expirationDate: expirationDate
            })
        });
        addClaimAndTransit(claim);
        saveClaim(_userId, internalClaim);
    }

    // saveClaim save a claim to storage
    function saveClaim(uint256 _userId, Claim memory _claim) private {
        claimStorage[_userId].push(_claim);
        countOfIssuedClaims++;
    }

    // addClaimAndTransit add a claim to the identity and transit state
    function addClaimAndTransit(uint256[8] memory _claim) private {
        identity.addClaim(_claim);
        identity.transitState();
    }

    function weiToGwei(uint weiAmount) private pure returns (uint256) {
        return weiAmount / 1e9;
    }

    function convertTime(uint256 timestamp) private pure returns (uint64) {
        require(timestamp <= type(uint64).max, 'Timestamp exceeds uint64 range');
        return uint64(timestamp);
    }

    function buildCredentialStatusVerifiableCredential(
        uint64 _revocationNonce
    ) private pure returns (W3CLib.CredentialStatus memory) {
        return
            W3CLib.CredentialStatus({
                id: '/credentialStatus',
                _type: 'Iden3OnchainSparseMerkleTreeProof2023',
                revocationNonce: _revocationNonce
            });
    }
}
