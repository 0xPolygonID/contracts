// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {ZKPVerifier} from '@iden3/contracts/verifiers/ZKPVerifier.sol';
import {ContextUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol';
import {Context} from '@openzeppelin/contracts/utils/Context.sol';

contract ERC20SelectiveDisclosureVerifier is ERC20, ZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID_V3_VALIDATOR = 3;

    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;
    mapping(uint256 => uint256) private _idToOperatorOutput;

    uint256 public TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10 ** uint256(decimals());

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

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
        if (requestId == TRANSFER_REQUEST_ID_V3_VALIDATOR) {
            // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender
            uint256 id = inputs[1];
            if (idToAddress[id] == address(0) && addressToId[_msgSender()] == 0) {
                super._mint(_msgSender(), TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
                addressToId[_msgSender()] = id;
                idToAddress[id] = _msgSender();
                _idToOperatorOutput[id] = inputs[validator.inputIndexOf('operatorOutput')];
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
            _getMainStorage().proofs[to][TRANSFER_REQUEST_ID_V3_VALIDATOR],
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    function getOperatorOutput() public view returns (uint256) {
        uint256 id = addressToId[_msgSender()];
        require(
            id != 0,
            'sender id doesn'
            't found'
        );
        return _idToOperatorOutput[id];
    }

    function _msgSender() internal view override(ContextUpgradeable, Context) returns (address) {
        return msg.sender;
    }

    function _msgData()
        internal
        view
        override(ContextUpgradeable, Context)
        returns (bytes calldata)
    {
        return msg.data;
    }

    function _contextSuffixLength()
        internal
        view
        override(ContextUpgradeable, Context)
        returns (uint256)
    {
        return 0;
    }
}
