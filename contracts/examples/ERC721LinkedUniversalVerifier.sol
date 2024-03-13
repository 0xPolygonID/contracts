// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC721} from '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {ZKPVerifier} from '@iden3/contracts/verifiers/ZKPVerifier.sol';
import {UniversalVerifier} from '@iden3/contracts/verifiers/UniversalVerifier.sol';

contract ERC721LinkedUniversalVerifier is ERC721 {
    uint64 public constant TRANSFER_REQUEST_ID_SIG_VALIDATOR = 0;
    uint64 public constant TRANSFER_REQUEST_ID_MTP_VALIDATOR = 1;

    UniversalVerifier public verifier;

    modifier beforeTokenTransfer(address to) {
        require(
            verifier.getProofStatus(to, TRANSFER_REQUEST_ID_SIG_VALIDATOR).isProved ||
                verifier.getProofStatus(to, TRANSFER_REQUEST_ID_MTP_VALIDATOR).isProved,
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    constructor(
        UniversalVerifier verifier_,
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {
        verifier = verifier_;
    }

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override beforeTokenTransfer(to) returns (address) {
        return super._update(to, tokenId, auth);
    }
}
