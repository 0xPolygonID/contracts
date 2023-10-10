// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {IZKPVerifier} from "@iden3/contracts/interfaces/IZKPVerifier.sol";

interface INexeraVerifier is IZKPVerifier {
    struct ZKP {
        uint64 requestId;
        uint256[] inputs;
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    function isWhitelisted(address user) external returns (bool);

    function whitelistScenario(ZKP[] calldata zkps) external returns (bool);

    function finalizeWhitelistScenario(address user) external returns (bool);
}
