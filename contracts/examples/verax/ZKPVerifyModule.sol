// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AttestationPayload } from "./types/Structs.sol";
import { AbstractModule } from "./abstracts/AbstractModule.sol";
import { IZKPVerifier } from '@iden3/contracts/interfaces/IZKPVerifier.sol';

contract ZKPVerifyModule is AbstractModule {
  IZKPVerifier public zkpVerifier;

  constructor(address _zkpVerifier) {
    zkpVerifier = IZKPVerifier(_zkpVerifier);
  }

  function run(
    AttestationPayload memory attestationPayload,
    bytes memory validationPayload,
    address txSender,
    uint256 /*value*/
  ) public override {
    require(msg.sender == 0x3C443B9f0c8ed3A3270De7A4815487BA3223C2Fa, "invalid sender");
    (uint64 requestId, uint256[] memory inputs, uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) = 
        abi.decode(validationPayload, (uint64, uint256[], uint256[2], uint256[2][2], uint256[2]));

    (uint64 attestationRequestId, uint256 attestationNullifierSessionID) = 
      abi.decode(attestationPayload.attestationData, (uint64, uint256));

    (uint256 attestationSubject) = 
      abi.decode(attestationPayload.subject, (uint256));
    require(attestationSubject == inputs[0], "attestation subject doesn't match to user id input");

    require(attestationRequestId == inputs[7], "request Id doesn't match");
    require(attestationNullifierSessionID == inputs[4], "nullifier doesn't match");
    zkpVerifier.submitZKPResponse(requestId, inputs, a, b, c);
  }

}
