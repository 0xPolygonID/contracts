// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {IVerifier} from '@iden3/contracts/interfaces/IVerifier.sol';
import {EmbeddedVerifier} from '@iden3/contracts/verifiers/EmbeddedVerifier.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';

contract ERC20Verifier is ERC20Upgradeable, EmbeddedVerifier {
    // keccak256(abi.encodePacked("authV2"))
    bytes32 private constant AUTHV2_METHOD_NAME_HASH =
        0x380ee2d21c7a4607d113dad9e76a0bc90f5325a136d5f0e14b6ccf849d948e25;
    // keccak256(abi.encodePacked("ethIdentity"))
    bytes32 private constant ETHIDENTITY_METHOD_NAME_HASH =
        0xf6b3780c307b9ee49bbc6e8f20c4c14216f55dcd34962439d9a1500caae24a3e;

    /// @custom:storage-location erc7201:polygonid.storage.ERC20Verifier
    struct ERC20VerifierStorage {
        mapping(uint256 => address) idToAddress;
        mapping(address => uint256) addressToId;
        uint256 tokenAmountForAirdropPerId;
        uint256 transferRequestId;
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
            isRequestProofVerified(to, $.transferRequestId),
            'only identities who provided proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    function initialize(string memory name, string memory symbol, IState state) public initializer {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();
        super.__ERC20_init(name, symbol);
        super.__EmbeddedVerifier_init(_msgSender(), state);
        $.tokenAmountForAirdropPerId = 5 * 10 ** uint256(decimals());
    }

    function _beforeProofSubmit(
        AuthResponse memory authResponse,
        Response[] memory responses
    ) internal view override {}

    function _afterProofSubmit(
        AuthResponse memory authResponse,
        Response[] memory responses
    ) internal override {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();

        uint256 userID;
        if (keccak256(bytes(authResponse.authMethod)) == AUTHV2_METHOD_NAME_HASH) {
            (
                uint256[] memory inputs,
                uint256[2] memory a,
                uint256[2][2] memory b,
                uint256[2] memory c
            ) = abi.decode(authResponse.proof, (uint256[], uint256[2], uint256[2][2], uint256[2]));
            userID = inputs[0];
        } else if (keccak256(bytes(authResponse.authMethod)) == ETHIDENTITY_METHOD_NAME_HASH) {
            userID = abi.decode(authResponse.proof, (uint256));
        }

        if ($.idToAddress[userID] == address(0) && $.addressToId[_msgSender()] == 0) {
            super._mint(_msgSender(), $.tokenAmountForAirdropPerId);
            $.addressToId[_msgSender()] = userID;
            $.idToAddress[userID] = _msgSender();
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

    function getTransferRequestId() public view returns (uint256) {
        return _getERC20VerifierStorage().transferRequestId;
    }

    function setTransferRequestId(uint256 requestId) public onlyOwner {
        _getERC20VerifierStorage().transferRequestId = requestId;
    }
}
