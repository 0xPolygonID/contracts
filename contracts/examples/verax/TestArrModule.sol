// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AttestationPayload } from "./types/Structs.sol";
import { AbstractModule } from "./abstracts/AbstractModule.sol";
import {IZKPVerifier} from '@iden3/contracts/interfaces/IZKPVerifier.sol';

contract TestArrModule is AbstractModule {
  IZKPVerifier public zkpVerifier;

  constructor(IZKPVerifier _zkpVerifier) {
    zkpVerifier = _zkpVerifier;
  }

  function run(
    AttestationPayload memory /*attestationPayload*/,
    bytes memory validationPayload,
    address txSender,
    uint256 /*value*/
  ) public override {
    (uint256[] memory inputs, uint256[] memory a) = 
        abi.decode(validationPayload, (uint256[], uint256[]));

    require(inputs[0] == 1, "invalid first input");
    require(inputs[1] == 2, "invalid second input");
    
  }
}
