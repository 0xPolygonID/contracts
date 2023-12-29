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
import {IW3CVerifiableCredential} from '@iden3/contracts/interfaces/IW3CVerifiableCredential.sol';

/**
 * @dev Example of decentralized balance credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract BalanceCredentialIssuer is IdentityBase, OwnableUpgradeable, IW3CVerifiableCredential {
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
     * @dev Get user's credentials ids
     * @param _userId - user id
     */
    function listUserCredentials(
        uint256 _userId
    ) public view returns (IW3CVerifiableCredential.Id[] memory) {
        Claim[] memory claims = claimStorage[_userId];
        IW3CVerifiableCredential.Id[] memory credentials = new IW3CVerifiableCredential.Id[](
            claims.length
        );
        for (uint i = 0; i < claims.length; i++) {
            credentials[i] = IW3CVerifiableCredential.Id(
                claims[i].credentialMetadata.sequenceNumber
            );
        }
        return credentials;
    }

    /**
     * @dev Get user's verifiable credentials
     * @param _userId - user id
     * @param _credentialId - credential id
     */
    function getCredential(
        uint256 _userId,
        uint256 _credentialId
    ) public view returns (IW3CVerifiableCredential.Credential memory) {
        Claim[] memory claims = claimStorage[_userId];
        for (uint i = 0; i < claims.length; i++) {
            if (claims[i].credentialMetadata.sequenceNumber == _credentialId) {
                return convertToVerifiableCredential(claims[i]);
            }
        }
        revert('Credential not found');
    }

    function convertToVerifiableCredential(
        Claim memory _claim
    ) private view returns (IW3CVerifiableCredential.Credential memory) {
        IW3CVerifiableCredential.State memory _state = IW3CVerifiableCredential.State({
            rootOfRoots: super.getLatestPublishedRootsRoot(),
            claimsTreeRoot: super.getLatestPublishedClaimsRoot(),
            revocationTreeRoot: super.getLatestPublishedRevocationsRoot(),
            value: super.getLatestPublishedState()
        });

        uint256 issuerID = GenesisUtils.calcIdFromEthAddress(
            state.getDefaultIdType(),
            address(this)
        );
        IW3CVerifiableCredential.IssuerData memory issuerData = IW3CVerifiableCredential
            .IssuerData({id: issuerID, state: _state});

        uint256 hi = PoseidonUnit4L.poseidon(
            [_claim.claim[0], _claim.claim[1], _claim.claim[2], _claim.claim[3]]
        );
        SmtLib.Proof memory mtp = super.getClaimProof(hi);
        IW3CVerifiableCredential.IssuanceProof memory mtpProof = IW3CVerifiableCredential
            .IssuanceProof({
                _type: 'Iden3SparseMerkleTreeProof',
                coreClaim: _claim.claim,
                mtp: mtp,
                issuerData: issuerData
            });
        IW3CVerifiableCredential.IssuanceProof[]
            memory proofs = new IW3CVerifiableCredential.IssuanceProof[](1);
        proofs[0] = mtpProof;

        IW3CVerifiableCredential.SubjectField[]
            memory credentialSubject = new IW3CVerifiableCredential.SubjectField[](4);
        credentialSubject[0] = IW3CVerifiableCredential.SubjectField({
            key: 'id',
            value: _claim.claim[1],
            rawValue: ''
        });
        credentialSubject[1] = IW3CVerifiableCredential.SubjectField({
            key: 'balance',
            value: _claim.balanceCredentialSubject.balance,
            rawValue: ''
        });
        credentialSubject[2] = IW3CVerifiableCredential.SubjectField({
            key: 'address',
            value: _claim.balanceCredentialSubject.ownerAddress,
            rawValue: ''
        });
        credentialSubject[3] = IW3CVerifiableCredential.SubjectField({
            key: 'type',
            value: 0,
            rawValue: bytes('Balance')
        });

        string[] memory credentialContext = new string[](3);
        credentialContext[0] = 'https://www.w3.org/2018/credentials/v1';
        credentialContext[1] = 'https://schema.iden3.io/core/jsonld/iden3proofs.jsonld';
        credentialContext[
            2
        ] = 'https://gist.githubusercontent.com/ilya-korotya/ac20f870943abd4805fe882ae8f3dccd/raw/1d9969a6d0454280c8d5e79b959faf9b3978b497/balance.jsonld';

        string[] memory credentialType = new string[](2);
        credentialType[0] = 'VerifiableCredential';
        credentialType[1] = 'Balance';

        return
            IW3CVerifiableCredential.Credential({
                id: _claim.credentialMetadata.sequenceNumber,
                context: credentialContext,
                _type: credentialType,
                expirationDate: _claim.credentialMetadata.expirationDate,
                issuanceDate: _claim.credentialMetadata.issuanceDate,
                issuer: issuerID,
                credentialSubject: credentialSubject,
                credentialStatus: buildCredentialStatusVerifiableCredential(
                    _claim.credentialMetadata.sequenceNumber
                ),
                credentialSchema: IW3CVerifiableCredential.Schema({
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
    ) private pure returns (IW3CVerifiableCredential.Status memory) {
        return
            IW3CVerifiableCredential.Status({
                id: '/credentialStatus',
                _type: 'Iden3OnchainSparseMerkleTreeProof2023',
                revocationNonce: _revocationNonce
            });
    }
}
