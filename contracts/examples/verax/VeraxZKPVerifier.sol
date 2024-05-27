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
    /// @custom:storage-location erc7201:polygonid.storage.ERC20SelectiveDisclosureVerifier
    struct VeraxZKPVerifierStorage {
        IPortal attestationPortalContract;
        bytes32 schemaId;
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

    function setPortalInfo(address portalAddress, bytes32 schemaId) public onlyOwner {
        VeraxZKPVerifierStorage storage $ = _getVeraxZKPVerifierStorage();
        $.attestationPortalContract = IPortal(portalAddress);
        $.schemaId = schemaId;
    }

    function _attest( uint64 requestId,
        uint256[] calldata inputs,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c) internal {
        VeraxZKPVerifierStorage storage $ = _getVeraxZKPVerifierStorage();
        if ($.attestationPortalContract == IPortal(address(0))) {
            return;
        }
        AttestationPayload memory payload = AttestationPayload(
            bytes32($.schemaId),
            uint64(block.timestamp + 7 days),
            abi.encode(inputs[0]),
            abi.encode(requestId, inputs[4])
        );
        bytes memory validationData = abi.encode(requestId, inputs, a, b, c);
        bytes[] memory validationPayload = new bytes[](1);
        validationPayload[0] = validationData;
        try $.attestationPortalContract.attest(payload, validationPayload) {
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
