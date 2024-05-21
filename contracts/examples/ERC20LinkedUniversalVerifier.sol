// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {EmbeddedZKPVerifier} from '@iden3/contracts/verifiers/EmbeddedZKPVerifier.sol';
import {UniversalVerifier} from '@iden3/contracts/verifiers/UniversalVerifier.sol';

contract ERC20LinkedUniversalVerifier is ERC20 {
    uint64 public constant TRANSFER_REQUEST_ID_SIG_VALIDATOR = 0;
    uint64 public constant TRANSFER_REQUEST_ID_MTP_VALIDATOR = 1;

    UniversalVerifier public verifier;

    uint256 public TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10 ** uint256(decimals());

    modifier beforeTokenTransfer(address to) {
        require(
            verifier.getProofStatus(to, TRANSFER_REQUEST_ID_SIG_VALIDATOR).isVerified ||
                verifier.getProofStatus(to, TRANSFER_REQUEST_ID_MTP_VALIDATOR).isVerified,
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    constructor(
        UniversalVerifier verifier_,
        string memory name_,
        string memory symbol_
    ) ERC20(name_, symbol_) {
        verifier = verifier_;
    }

    function mint(address to) public {
        _mint(to, TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override beforeTokenTransfer(to) {
        super._update(from, to, value);
    }
}
