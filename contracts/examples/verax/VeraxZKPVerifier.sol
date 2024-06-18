// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Attestation, AttestationPayload} from './types/Structs.sol';
import {ZKPVerifierBase} from '@iden3/contracts/verifiers/ZKPVerifierBase.sol';
import {Ownable2StepUpgradeable} from "@openzeppelin/contracts-upgradeable/access/Ownable2StepUpgradeable.sol";
import {IZKPVerifier} from '@iden3/contracts/interfaces/IZKPVerifier.sol';

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
    event AttestOk(string message, address indexed sender);

    enum AttestationSchemaType { PoU, PoL }

    struct PortalInfo {
        IPortal attestationPortalContract;
        bytes32 schemaId;
        AttestationSchemaType schemaType;
    }
    /// @custom:storage-location erc7201:polygonid.storage.VeraxZKPVerifier
    struct VeraxZKPVerifierStorage {
        mapping (uint64 requestId => PortalInfo portalInfo) portalInfoForReq;
    }

    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.VeraxZKPVerifier")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant VeraxZKPVerifierStorageLocation =
        0xf2a0fb5adce57cdd20ffa282dfdeffa5cf790754d88eeeedb507a130ec7f2900;

    /**
    * @dev Version of contract
    */
    string public constant VERSION = "1.0.1";

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

    function _attest(uint64 requestId,
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

        IZKPVerifier.ZKPRequest memory request = getZKPRequest(requestId);

        uint64 attestationExpiration;
        if (portalInfo.schemaType == AttestationSchemaType.PoL) {
            attestationExpiration = 30 days * 6;
            attestationPayload = abi.encode(requestId, inputs[request.validator.inputIndexOf('nullifier')]);
        } else {
            uint256 reputationLevel = inputs[request.validator.inputIndexOf('operatorOutput')];
            if (reputationLevel >= 2) {
                attestationExpiration = 30 days * 6;
            } else {
                attestationExpiration = 2 weeks;
            }
            attestationPayload = abi.encode(requestId, inputs[request.validator.inputIndexOf('nullifier')], reputationLevel);
        }
        AttestationPayload memory payload = AttestationPayload(
            bytes32(portalInfo.schemaId),
            uint64(inputs[request.validator.inputIndexOf('timestamp')]) + attestationExpiration, // expiration
            abi.encode(msg.sender), // message sender
            attestationPayload 
        );
        bytes memory validationData = abi.encode(requestId, inputs, a, b, c);
        bytes[] memory validationPayload = new bytes[](1);
        validationPayload[0] = validationData;
        portalInfo.attestationPortalContract.attest(payload, validationPayload) ;
        emit AttestOk("attestation done", msg.sender);
      
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
