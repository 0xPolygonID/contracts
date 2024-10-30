// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {EmbeddedZKPVerifier} from '@iden3/contracts/verifiers/EmbeddedZKPVerifier.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';

contract ERC20SelectiveDisclosureVerifier is ERC20Upgradeable, EmbeddedZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID_V3_VALIDATOR = 3;

    /// @custom:storage-location erc7201:polygonid.storage.ERC20SelectiveDisclosureVerifier
    struct ERC20SelectiveDisclosureVerifierStorage {
        mapping(uint256 => address) idToAddress;
        mapping(address => uint256) addressToId;
        mapping(uint256 => uint256) _idToOperatorOutput;
        uint256 TOKEN_AMOUNT_FOR_AIRDROP_PER_ID;
    }

    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.ERC20SelectiveDisclosureVerifier")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ERC20SelectiveDisclosureVerifierStorageLocation =
        0xb76e10afcb000a9a2532ea819d260b0a3c0ddb1d54ee499ab0643718cbae8700;

    function _getERC20SelectiveDisclosureVerifierStorage()
        private
        pure
        returns (ERC20SelectiveDisclosureVerifierStorage storage $)
    {
        assembly {
            $.slot := ERC20SelectiveDisclosureVerifierStorageLocation
        }
    }

    modifier beforeTransfer(address to) {
        require(
            isProofVerified(to, TRANSFER_REQUEST_ID_V3_VALIDATOR),
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    function initialize(
        string memory name,
        string memory symbol,
        IState state
    ) public initializer {
        ERC20SelectiveDisclosureVerifierStorage
            storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        super.__ERC20_init(name, symbol);
        super.__EmbeddedZKPVerifier_init(_msgSender(), state);
        $.TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10 ** uint256(decimals());
    }

    function _beforeProofSubmit(
        uint64 /* requestId */,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal view override {
        // check that challenge input is address of sender
        /*address addr = PrimitiveTypeUtils.uint256LEToAddress(
            inputs[validator.inputIndexOf('challenge')]
        );
        // this is linking between msg.sender and
        require(_msgSender() == addr, 'address in proof is not a sender address');*/
    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        ERC20SelectiveDisclosureVerifierStorage
            storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        if (requestId == TRANSFER_REQUEST_ID_V3_VALIDATOR) {
            // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender
            uint256 id = inputs[1];
            if ($.idToAddress[id] == address(0) && $.addressToId[_msgSender()] == 0) {
                super._mint(_msgSender(), $.TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
                $.addressToId[_msgSender()] = id;
                $.idToAddress[id] = _msgSender();
                $._idToOperatorOutput[id] = inputs[validator.inputIndexOf('operatorOutput')];
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

    function getOperatorOutput() public view returns (uint256) {
        ERC20SelectiveDisclosureVerifierStorage
            storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        uint256 id = $.addressToId[_msgSender()];
        require(id != 0, 'sender id is not found');
        return $._idToOperatorOutput[id];
    }

    function getIdByAddress(address addr) public view returns (uint256) {
        return _getERC20SelectiveDisclosureVerifierStorage().addressToId[addr];
    }

    function getAddressById(uint256 id) public view returns (address) {
        return _getERC20SelectiveDisclosureVerifierStorage().idToAddress[id];
    }

    function getTokenAmountForAirdropPerId() public view returns (uint256) {
        return _getERC20SelectiveDisclosureVerifierStorage().TOKEN_AMOUNT_FOR_AIRDROP_PER_ID;
    }
}
