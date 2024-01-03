// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {PrimitiveTypeUtils} from 'contracts_temp/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from 'contracts_temp/contracts/interfaces/ICircuitValidator.sol';
import {ZKPVerifier} from 'contracts_temp/contracts/verifiers/ZKPVerifier.sol';
import {UniversalVerifier} from 'contracts_temp/contracts/verifiers/UniversalVerifier.sol';

contract ERC721LinkedUniversalVerifier is ERC721 {
    uint64 public constant TRANSFER_REQUEST_ID_SIG_VALIDATOR = 0;
    uint64 public constant TRANSFER_REQUEST_ID_MTP_VALIDATOR = 1;

    UniversalVerifier public verifier;

    constructor(UniversalVerifier verifier_, string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        verifier = verifier_;
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal view override {
        require(
            verifier.getProofStatus(to, TRANSFER_REQUEST_ID_SIG_VALIDATOR) ||  verifier.getProofStatus(to, TRANSFER_REQUEST_ID_MTP_VALIDATOR),
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
    }
}
