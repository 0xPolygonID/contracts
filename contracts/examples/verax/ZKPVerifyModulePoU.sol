// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AttestationPayload } from "./types/Structs.sol";
import { AbstractModule } from "./abstracts/AbstractModule.sol";
import { IZKPVerifier } from '@iden3/contracts/interfaces/IZKPVerifier.sol';
import { ICircuitValidator } from '@iden3/contracts/interfaces/ICircuitValidator.sol';

contract ZKPVerifyModulePoU is AbstractModule {
  IZKPVerifier public zkpVerifier;
  struct PoUData {
    address sender;
    uint256 reputationLevel;
  }

  mapping (uint256 nullifierSessionID => PoUData data) nullifierAttestedData;

  constructor(address _zkpVerifier) {
    zkpVerifier = IZKPVerifier(_zkpVerifier);
  }

  function _verifyAttestationPayload(AttestationPayload memory attestationPayload, uint256[] memory inputs, ICircuitValidator validator) internal view {
     (uint64 attestationRequestId, uint256 attestationNullifierSessionID, uint256 reputationLevel) =
      abi.decode(attestationPayload.attestationData, (uint64, uint256, uint256));

    require(attestationRequestId == inputs[validator.inputIndexOf('requestID')], "request Id doesn't match");
    require(attestationNullifierSessionID == inputs[validator.inputIndexOf('nullifier')], "nullifier doesn't match");
  }

  function run(
    AttestationPayload memory attestationPayload,
    bytes memory validationPayload,
    address txSender,
    uint256 /*value*/
  ) public override {
    (uint64 requestId, uint256[] memory inputs, uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) = 
        abi.decode(validationPayload, (uint64, uint256[], uint256[2], uint256[2][2], uint256[2]));

    IZKPVerifier.ZKPRequest memory request = zkpVerifier.getZKPRequest(requestId);
    
    PoUData memory prevAttestationData = nullifierAttestedData[inputs[request.validator.inputIndexOf('nullifier')]];
    if (prevAttestationData.sender != address(0)) {
      if (prevAttestationData.sender != txSender) {
        revert("sender of the previous attestation for this nullifier doesn't match");
      }
      if (prevAttestationData.reputationLevel >= inputs[request.validator.inputIndexOf('operatorOutput')]) {
        revert("reputation level not increased");
      }
    }
    
    request.validator.verify(
      inputs,
      a,
      b,
      c,
      request.data,
      txSender);

    _verifyAttestationPayload(attestationPayload, inputs, request.validator);

    nullifierAttestedData[inputs[request.validator.inputIndexOf('nullifier')]] = PoUData(txSender, inputs[request.validator.inputIndexOf('operatorOutput')]);
  }

}
