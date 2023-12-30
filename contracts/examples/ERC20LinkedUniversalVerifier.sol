// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {PrimitiveTypeUtils} from 'contracts_temp/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from 'contracts_temp/contracts/interfaces/ICircuitValidator.sol';
import {ZKPVerifier} from 'contracts_temp/contracts/verifiers/ZKPVerifier.sol';
import {UniversalVerifier} from 'contracts_temp/contracts/verifiers/UniversalVerifier.sol';

contract ERC20LinkedUniversalVerifier is ERC20 {
    uint64 public constant TRANSFER_REQUEST_ID_SIG_VALIDATOR = 0;
    uint64 public constant TRANSFER_REQUEST_ID_MTP_VALIDATOR = 1;

    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;
    UniversalVerifier public verifier;

    uint256 public TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10**uint256(decimals());

    constructor(UniversalVerifier verifier_, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        verifier = verifier_;
    }

    function mint(address to) public {
        _mint(to, TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
    }

    function _beforeTokenTransfer(
        address, /* from */
        address to,
        uint256 /* amount */
    ) internal view override {
        require(
            verifier.getProofStatus(to, TRANSFER_REQUEST_ID_SIG_VALIDATOR) ||  verifier.getProofStatus(to, TRANSFER_REQUEST_ID_MTP_VALIDATOR),
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
    }

}
