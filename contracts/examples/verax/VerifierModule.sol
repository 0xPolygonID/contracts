// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AttestationPayload } from "./types/Structs.sol";
import { AbstractModule } from "./abstracts/AbstractModule.sol";

contract VerifierModule is AbstractModule {

  function run(
    AttestationPayload memory attestationPayload,
    bytes memory validationPayload,
    address txSender,
    uint256 /*value*/
  ) public override {
    // require(msg.sender == 0x55Fc7a60A6E6c865Cd20b8a4dae569751eA650af, "verifier not in allowed list");
  }

}
