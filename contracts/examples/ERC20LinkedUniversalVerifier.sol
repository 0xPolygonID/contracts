// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {UniversalVerifier} from '@iden3/contracts/verifiers/UniversalVerifier.sol';

contract ERC20LinkedUniversalVerifier is ERC20 {
    uint256 private transferRequestId;

    UniversalVerifier public verifier;

    uint256 public tokenAmountForAirdropPerId = 5 * 10 ** uint256(decimals());

    modifier beforeTokenTransfer(address to) {
        require(
            verifier.isRequestProofVerified(to, transferRequestId),
            'only identities who provided proof for transfer requests are allowed to receive tokens'
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
        _mint(to, tokenAmountForAirdropPerId);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override beforeTokenTransfer(to) {
        super._update(from, to, value);
    }

    function getTransferRequestId() public view returns (uint256) {
        return transferRequestId;
    }

    function setTransferRequestId(uint256 requestId) public {
        transferRequestId = requestId;
    }
}
