// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {ZKPVerifier} from '@iden3/contracts/verifiers/ZKPVerifier.sol';

contract ERC20Verifier is ERC20Upgradeable, ZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID_SIG_VALIDATOR = 1;
    uint64 public constant TRANSFER_REQUEST_ID_MTP_VALIDATOR = 2;

    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;

    uint256 public TOKEN_AMOUNT_FOR_AIRDROP_PER_ID;

    function initialize(
        string memory name,
        string memory symbol
    ) public initializer {
        super.__ERC20_init(name, symbol);
        super.__ZKPVerifier_init(_msgSender());
        TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10 ** uint256(decimals());
    }

    function _beforeProofSubmit(
        uint64 /* requestId */,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal view override {
        // check that challenge input is address of sender
        address addr = PrimitiveTypeUtils.uint256LEToAddress(
            inputs[validator.inputIndexOf('challenge')]
        );
        // this is linking between msg.sender and
        require(_msgSender() == addr, 'address in proof is not a sender address');
    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        if (
            requestId == TRANSFER_REQUEST_ID_SIG_VALIDATOR ||
            requestId == TRANSFER_REQUEST_ID_MTP_VALIDATOR
        ) {
            // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender
            uint256 id = inputs[1];
            if (idToAddress[id] == address(0) && addressToId[_msgSender()] == 0) {
                super._mint(_msgSender(), TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
                addressToId[_msgSender()] = id;
                idToAddress[id] = _msgSender();
            }
        }
    }

    function _update(
        address from /* from */,
        address to,
        uint256 amount /* amount */
    ) internal override beforeTransfer(to) {
        super._update(from, to, amount);
    }

    modifier beforeTransfer(address to) {
        MainStorage storage s = _getMainStorage();
        require(
            s.proofs[to][TRANSFER_REQUEST_ID_SIG_VALIDATOR] ||
                s.proofs[to][TRANSFER_REQUEST_ID_MTP_VALIDATOR],
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }
}
