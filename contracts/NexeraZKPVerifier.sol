// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {ZKPVerifier} from "@iden3/contracts/verifiers/ZKPVerifier.sol";

contract NexeraZKPVerifier is ZKPVerifier {
    constructor() ZKPVerifier() {}

    /**
     * @dev Hook that is called after a request is set
     */
    function _afterSetRequest(uint64 requestId) internal virtual {}
}
