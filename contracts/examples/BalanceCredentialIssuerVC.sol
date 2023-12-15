// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {OwnableUpgradeable} from '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import {ClaimBuilder} from '@iden3/contracts/lib/ClaimBuilder.sol';
import {IdentityLib} from '@iden3/contracts/lib/IdentityLib.sol';
import {IdentityBase} from '@iden3/contracts/lib/IdentityBase.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {SmtLib} from '@iden3/contracts/lib/SmtLib.sol';
import {PoseidonUnit2L, PoseidonUnit4L} from '@iden3/contracts/lib/Poseidon.sol';

/**
 * @dev Example of decentralized balance credential issuer.
 * This issuer issue non-merklized credentials decentralized.
 */
contract BalanceCredentialIssuerVC is IdentityBase, OwnableUpgradeable {
    using IdentityLib for IdentityLib.Data;

    struct CredentialStatusPresentation {
        string id;
        string cstype;
        uint64 revocationNonce;
    }

    struct CredentialSchema {
        string id;
        string types;
    }

    struct State {
        uint256 rootOfRoots;
        uint256 claimsTreeRoot;
        uint256 revocationTreeRoot;
        uint256 value;
    }

    struct IssuerData {
        address id;
        State state;
    }

    struct ProofPresentation {
        string types;
        uint256[8] coreClaim;
        IssuerData issuerData;
        SmtLib.Proof proof;
    }

    struct W3CCredential {
        uint64 id;
        string[3] context;
        string[2] types;
        uint64 expirationDate;
        uint64 issuanceDate;
        address issuer;
        CredentialSubject credentialSubject;
        CredentialStatusPresentation credentialStatus;
        CredentialSchema credentialSchema;
        ProofPresentation[] proof;
    }

    struct CredentialMetadata {
        uint64 expirationDate;
        uint64 issuanceDate;
        uint64 sequenceNumber;
    }

    struct CredentialSubject {
        uint256 id;
        uint256 balance;
        uint256 ownerAddress;
        string types;
    }

    // Claim representation
    struct Claim {
        uint256[8] claim;
        CredentialSubject credentialSubject;
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

    // countOfIssuedClaims count of issued claims for incrementing revocation nonce for new claims
    uint64 private countOfIssuedClaims = 0;
    mapping(uint256 => Claim[]) private claimStorage;

    uint256[48] private __gap_after;

    function initialize(address _stateContractAddr) public override initializer {
        IdentityBase.initialize(_stateContractAddr);
        __Ownable_init();
    }

    /**
     * @dev Get user's verifiable credentials
     * @param _userId - user id
     */
    function getUserVerifiableCredentials(
        uint256 _userId
    ) public view returns (W3CCredential[] memory) {
        Claim[] memory claims = claimStorage[_userId];
        W3CCredential[] memory credentials = new W3CCredential[](claims.length);
        for (uint i = 0; i < claims.length; i++) {
            credentials[i] = convertToVerifiableCredential(claims[i]);
        }
        return credentials;
    }

    function convertToVerifiableCredential(
        Claim memory _claim
    ) private view returns (W3CCredential memory) {
        State memory _state = State({
            rootOfRoots: super.getLatestPublishedRootsRoot(),
            claimsTreeRoot: super.getLatestPublishedClaimsRoot(),
            revocationTreeRoot: super.getLatestPublishedRevocationsRoot(),
            value: super.getLatestPublishedState()
        });
        IssuerData memory issuerData = IssuerData({id: address(this), state: _state});

        uint256 hi = PoseidonUnit4L.poseidon(
            [_claim.claim[0], _claim.claim[1], _claim.claim[2], _claim.claim[3]]
        );
        SmtLib.Proof memory proof = super.getClaimProof(hi);
        ProofPresentation memory mtpProof = ProofPresentation({
            types: 'Iden3SparseMerkleTreeProof',
            coreClaim: _claim.claim,
            proof: proof,
            issuerData: issuerData
        });
        ProofPresentation[] memory proofs = new ProofPresentation[](1);
        proofs[0] = mtpProof;

        return
            W3CCredential({
                id: _claim.credentialMetadata.sequenceNumber,
                context: [
                    'https://www.w3.org/2018/credentials/v1',
                    'https://schema.iden3.io/core/jsonld/iden3proofs.jsonld',
                    'https://gist.githubusercontent.com/ilya-korotya/ac20f870943abd4805fe882ae8f3dccd/raw/1d9969a6d0454280c8d5e79b959faf9b3978b497/balance.jsonld'
                ],
                types: ['VerifiableCredential', 'Balance'],
                expirationDate: _claim.credentialMetadata.expirationDate,
                issuanceDate: _claim.credentialMetadata.issuanceDate,
                issuer: address(this),
                credentialSubject: CredentialSubject({
                    id: _claim.credentialSubject.id,
                    balance: _claim.credentialSubject.balance,
                    ownerAddress: _claim.credentialSubject.ownerAddress,
                    types: _claim.credentialSubject.types
                }),
                credentialStatus: buildCredentialStatusVerifiableCredential(
                    address(this),
                    _claim.credentialMetadata.sequenceNumber
                ),
                credentialSchema: CredentialSchema({
                    id: 'https://gist.githubusercontent.com/ilya-korotya/26ba81feb4da2f49f4b473661b80e8e3/raw/32113f4725088f32f31a6b06b4abdc94bc4b2d17/balance.json',
                    types: 'JsonSchema2023'
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
    // In Solidity, structs containing mappings cannot be passed or returned in external function calls.
    function issueBalanceCredential(uint256 _userId) public {
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
        // TODO (illia-korotia): don't save duplicate data.
        Claim memory internalClaim = Claim({
            claim: claim,
            credentialSubject: CredentialSubject({
                id: _userId,
                ownerAddress: ownerAddress,
                balance: ownerBalance,
                types: 'Balance'
            }),
            credentialMetadata: CredentialMetadata({
                expirationDate: expirationDate,
                issuanceDate: convertTime(block.timestamp),
                sequenceNumber: countOfIssuedClaims
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

    function weiToGwei(uint weiAmount) internal pure returns (uint256) {
        return weiAmount / 1e9;
    }

    function convertTime(uint256 timestamp) internal pure returns (uint64) {
        require(timestamp <= type(uint64).max, 'Timestamp exceeds uint64 range');
        return uint64(timestamp);
    }

    function addressToString(address _address) private pure returns (string memory) {
        bytes memory alphabet = '0123456789abcdef';
        bytes memory data = abi.encodePacked(_address);
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = '0';
        str[1] = 'x';
        for (uint i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint(uint8(data[i] >> 4))];
            str[3 + i * 2] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }

    function buildCredentialStatusVerifiableCredential(
        address _address,
        uint64 _revocationNonce
    ) private view returns (CredentialStatusPresentation memory) {
        uint256 id;
        assembly {
            id := chainid()
        }

        bytes memory credentialStatusId = abi.encodePacked(
            addressToString(_address),
            '/credentialStatus?revocationNonce=',
            uint64ToString(_revocationNonce),
            '&contractAddress=',
            uint64ToString(uint64(id)),
            ':',
            addressToString(_address)
        );
        return
            CredentialStatusPresentation({
                id: string(credentialStatusId),
                cstype: 'Iden3OnchainSparseMerkleTreeProof2023',
                revocationNonce: _revocationNonce
            });
    }

    function uint64ToString(uint64 _value) private pure returns (string memory) {
        if (_value == 0) {
            return '0';
        }

        uint64 temp = _value;
        uint64 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }

        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + (_value % 10)));
            _value /= 10;
        }

        return string(buffer);
    }
}
