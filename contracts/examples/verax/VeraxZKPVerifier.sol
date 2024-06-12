// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Attestation, AttestationPayload} from './types/Structs.sol';
import {ZKPVerifierBase} from '@iden3/contracts/verifiers/ZKPVerifierBase.sol';
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";

interface IPortal {
    function attest(AttestationPayload memory attestationPayload, bytes[] memory validationPayloads) external payable;
    function attestationRegistry() external view returns (address);
}

interface AttestationRegistry {
    function getAttestationIdCounter() external view returns (uint32);
    event AttestationRegistered(bytes32 indexed attestationId);
    function getAttestation(bytes32 attestationId) external view returns (Attestation memory);
}

contract VeraxZKPVerifier is Ownable2StepUpgradeable, ZKPVerifierBase {
    event AttestError(string message);
    event AttestOk(string message);

    enum AttestationSchemaType { PoU, PoL }

    struct PortalInfo {
        IPortal attestationPortalContract;
        bytes32 schemaId;
        AttestationSchemaType schemaType;
    }
    /// @custom:storage-location erc7201:polygonid.storage.ERC20SelectiveDisclosureVerifier
    struct VeraxZKPVerifierStorage {
        mapping (uint64 requestId => PortalInfo portalInfo) portalInfoForReq;
    }

    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.ERC20SelectiveDisclosureVerifier")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant VeraxZKPVerifierStorageLocation =
        0xb76e10afcb000a9a2532ea819d260b0a3c0ddb1d54ee499ab0643718cbae8700;

    function _getVeraxZKPVerifierStorage() private pure returns (VeraxZKPVerifierStorage storage $) {
        assembly {
            $.slot := VeraxZKPVerifierStorageLocation
        }
    }

    function initialize() public initializer {
         __Ownable_init(_msgSender());
    }

    function setPortalInfo(uint64 requestId, address portalAddress, bytes32 schemaId, AttestationSchemaType schemaType) public onlyOwner {
        VeraxZKPVerifierStorage storage $ = _getVeraxZKPVerifierStorage();
        $.portalInfoForReq[requestId] = PortalInfo(IPortal(portalAddress), schemaId, schemaType);
    }

    function _attest( uint64 requestId,
        uint256[] calldata inputs,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c) internal {
        VeraxZKPVerifierStorage storage $ = _getVeraxZKPVerifierStorage();
        PortalInfo memory portalInfo = $.portalInfoForReq[requestId];
        if (portalInfo.attestationPortalContract == IPortal(address(0))) {
            revert("Attestation portal not found for request");
        }
        bytes memory attestationPayload;

        if (portalInfo.schemaType == AttestationSchemaType.PoL) {
            attestationPayload = abi.encode(requestId, inputs[4]);  // requestId, nullifier
        } else {
             attestationPayload = abi.encode(requestId, inputs[4], inputs[5]); // requestId, nullifier, operator output
        }
        AttestationPayload memory payload = AttestationPayload(
            bytes32(portalInfo.schemaId),
            uint64(inputs[12]), // expiration
            abi.encode(msg.sender), // message sender
            attestationPayload 
        );
        bytes memory validationData = abi.encode(requestId, inputs, a, b, c);
        bytes[] memory validationPayload = new bytes[](1);
        validationPayload[0] = validationData;
        try portalInfo.attestationPortalContract.attest(payload, validationPayload) {
            emit AttestOk("attestation done");
        } catch  {
            emit AttestError("attestation error");
            require(false, "attestation err");
        }
    }

    /// @dev Submits a ZKP response and updates proof status
    /// @param requestId The ID of the ZKP request
    /// @param inputs The input data for the proof
    /// @param a The first component of the proof
    /// @param b The second component of the proof
    /// @param c The third component of the proof
    function submitZKPResponse(
        uint64 requestId,
        uint256[] calldata inputs,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c
    ) public virtual override {
        _attest(requestId, inputs, a, b ,c);
    }

}
