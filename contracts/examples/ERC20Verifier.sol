// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {IVerifier} from '@iden3/contracts/interfaces/IVerifier.sol';
import {EmbeddedVerifier} from '@iden3/contracts/verifiers/EmbeddedVerifier.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';

contract ERC20Verifier is ERC20Upgradeable, EmbeddedVerifier {
    /// @custom:storage-location erc7201:polygonid.storage.ERC20Verifier
    struct ERC20VerifierStorage {
        mapping(uint256 => address) idToAddress;
        mapping(address => uint256) addressToId;
        uint256 tokenAmountForAirdropPerId;
        uint256 transferRequestIdSigValidator;
        uint256 transferRequestIdMtpValidator;
    }

    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.ERC20Verifier")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ERC20VerifierStorageLocation =
        0x3b1c3bd751d9cd42a3739426a271cdc235017946663d56eeaf827d70f8b77000;

    function _getERC20VerifierStorage() private pure returns (ERC20VerifierStorage storage $) {
        assembly {
            $.slot := ERC20VerifierStorageLocation
        }
    }

    modifier beforeTransfer(address to) {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();
        require(
            isRequestProofVerified(to, $.transferRequestIdSigValidator) ||
                isRequestProofVerified(to, $.transferRequestIdMtpValidator),
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    function initialize(
        string memory name,
        string memory symbol,
        IState state
    ) public initializer {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();
        super.__ERC20_init(name, symbol);
        super.__EmbeddedVerifier_init(_msgSender(), state);
        $.tokenAmountForAirdropPerId = 5 * 10 ** uint256(decimals());
    }

    function _beforeProofSubmit(
        AuthResponse memory authResponse,
        Response[] memory responses
    ) internal view override {
        for (uint256 i = 0; i < responses.length; i++) {
            IVerifier.Response memory response = responses[i];
            IVerifier.RequestInfo memory request = getRequest(response.requestId);
            (
                uint256[] memory inputs,
                uint256[2] memory a,
                uint256[2][2] memory b,
                uint256[2] memory c
            ) = abi.decode(response.proof, (uint256[], uint256[2], uint256[2][2], uint256[2]));

            // check that challenge input is address of sender
            address addr = PrimitiveTypeUtils.uint256LEToAddress(
                inputs[request.validator.inputIndexOf('challenge')]
            );
            // this is linking between msg.sender and challenge input
            require(_msgSender() == addr, 'address in proof is not a sender address');
        }
    }

    function _afterProofSubmit(
        AuthResponse memory authResponse,
        Response[] memory responses
    ) internal override {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();

        for (uint256 i = 0; i < responses.length; i++) {
            Response memory response = responses[i];

            if (
                ($.transferRequestIdSigValidator != 0 && response.requestId == $.transferRequestIdSigValidator) ||
                ($.transferRequestIdMtpValidator !=0 && response.requestId == $.transferRequestIdMtpValidator)
            ) {
                // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender
                uint256 id = getResponseFieldValue(response.requestId, _msgSender(), 'userID');
                if ($.idToAddress[id] == address(0) && $.addressToId[_msgSender()] == 0) {
                    super._mint(_msgSender(), $.tokenAmountForAirdropPerId);
                    $.addressToId[_msgSender()] = id;
                    $.idToAddress[id] = _msgSender();
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

    function getIdByAddress(address addr) public view returns (uint256) {
        return _getERC20VerifierStorage().addressToId[addr];
    }

    function getAddressById(uint256 id) public view returns (address) {
        return _getERC20VerifierStorage().idToAddress[id];
    }

    function getTokenAmountForAirdropPerId() public view returns (uint256) {
        return _getERC20VerifierStorage().tokenAmountForAirdropPerId;
    }

    function getTransferRequestIdSigValidator() public view returns (uint256) {
        return _getERC20VerifierStorage().transferRequestIdSigValidator;
    }

    function getTransferRequestIdMtpValidator() public view returns (uint256) {
        return _getERC20VerifierStorage().transferRequestIdMtpValidator;
    }

    function setTransferRequestIdSigValidator(uint256 requestId) public onlyOwner {
        _getERC20VerifierStorage().transferRequestIdSigValidator = requestId;
    }

    function setTransferRequestIdMtpValidator(uint256 requestId) public onlyOwner {
        _getERC20VerifierStorage().transferRequestIdMtpValidator = requestId;
    }
}
