// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {EmbeddedVerifier} from '@iden3/contracts/verifiers/EmbeddedVerifier.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';

contract ERC20SelectiveDisclosureVerifier is ERC20Upgradeable, EmbeddedVerifier {
    /// @custom:storage-location erc7201:polygonid.storage.ERC20SelectiveDisclosureVerifier
    struct ERC20SelectiveDisclosureVerifierStorage {
        mapping(uint256 => address) idToAddress;
        mapping(address => uint256) addressToId;
        mapping(uint256 => uint256) _idToOperatorOutput;
        uint256 tokenAmountForAirdropPerId;
        uint256 transferRequestId;
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
            isRequestProofVerified(to, _getERC20SelectiveDisclosureVerifierStorage().transferRequestId),
            'only identities who provided proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    function initialize(string memory name, string memory symbol, IState state) public initializer {
        ERC20SelectiveDisclosureVerifierStorage
            storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        super.__ERC20_init(name, symbol);
        super.__EmbeddedVerifier_init(_msgSender(), state);
        $.tokenAmountForAirdropPerId = 5 * 10 ** uint256(decimals());
    }

    function _afterProofSubmit(
        AuthResponse memory authResponse,
        Response[] memory responses
    ) internal override {
        ERC20SelectiveDisclosureVerifierStorage
            storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        for (uint256 i = 0; i < responses.length; i++) {
            Response memory response = responses[i];

            if (response.requestId == $.transferRequestId) {
                // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender

                uint256 id = getResponseFieldValue(response.requestId, _msgSender(), 'userID');
                if ($.idToAddress[id] == address(0) && $.addressToId[_msgSender()] == 0) {
                    super._mint(_msgSender(), $.tokenAmountForAirdropPerId);
                    $.addressToId[_msgSender()] = id;
                    $.idToAddress[id] = _msgSender();
                    $._idToOperatorOutput[id] = getResponseFieldValue(response.requestId, _msgSender(), 'operatorOutput');
                }
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
        return _getERC20SelectiveDisclosureVerifierStorage().tokenAmountForAirdropPerId;
    }

    function getTransferRequestId() public view returns (uint256) {
        return _getERC20SelectiveDisclosureVerifierStorage().transferRequestId;
    }

    function setTransferRequestId(uint256 requestId) public onlyOwner {
        _getERC20SelectiveDisclosureVerifierStorage().transferRequestId = requestId;
    }
}
