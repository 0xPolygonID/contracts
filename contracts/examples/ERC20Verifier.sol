// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {IZKPVerifier} from '@iden3/contracts/interfaces/IZKPVerifier.sol';
import {EmbeddedZKPVerifier} from '@iden3/contracts/verifiers/EmbeddedZKPVerifier.sol';
import {IState} from '@iden3/contracts/interfaces/IState.sol';

contract ERC20Verifier is ERC20Upgradeable, EmbeddedZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID_SIG_VALIDATOR = 1;
    uint64 public constant TRANSFER_REQUEST_ID_MTP_VALIDATOR = 2;

    /// @custom:storage-location erc7201:polygonid.storage.ERC20Verifier
    struct ERC20VerifierStorage {
        mapping(uint256 => address) idToAddress;
        mapping(address => uint256) addressToId;
        uint256 TOKEN_AMOUNT_FOR_AIRDROP_PER_ID;
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
        require(
            isProofVerified(to, TRANSFER_REQUEST_ID_SIG_VALIDATOR) ||
                isProofVerified(to, TRANSFER_REQUEST_ID_MTP_VALIDATOR),
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
        super.__EmbeddedZKPVerifier_init(_msgSender(), state);
        $.TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10 ** uint256(decimals());
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
        // this is linking between msg.sender and challenge input
        require(_msgSender() == addr, 'address in proof is not a sender address');
    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();
        if (
            requestId == TRANSFER_REQUEST_ID_SIG_VALIDATOR ||
            requestId == TRANSFER_REQUEST_ID_MTP_VALIDATOR
        ) {
            // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender
            uint256 id = inputs[1];
            if ($.idToAddress[id] == address(0) && $.addressToId[_msgSender()] == 0) {
                super._mint(_msgSender(), $.TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
                $.addressToId[_msgSender()] = id;
                $.idToAddress[id] = _msgSender();
            }
        }
    }

    function _beforeProofSubmitV2(
        IZKPVerifier.ZKPResponse[] memory responses
    ) internal view override {
        for (uint256 i = 0; i < responses.length; i++) {
            IZKPVerifier.ZKPResponse memory response = responses[i];
            IZKPVerifier.ZKPRequest memory request = getZKPRequest(response.requestId);
            (
                uint256[] memory inputs,
                uint256[2] memory a,
                uint256[2][2] memory b,
                uint256[2] memory c
            ) = abi.decode(response.zkProof, (uint256[], uint256[2], uint256[2][2], uint256[2]));

                    // check that challenge input is address of sender
            address addr = PrimitiveTypeUtils.uint256LEToAddress(
                inputs[request.validator.inputIndexOf('challenge')]
            );
            // this is linking between msg.sender and challenge input
            require(_msgSender() == addr, 'address in proof is not a sender address');
        }
    }

    function _afterProofSubmitV2(
        IZKPVerifier.ZKPResponse[] memory responses
    ) internal override {
        ERC20VerifierStorage storage $ = _getERC20VerifierStorage();

        for (uint256 i = 0; i < responses.length; i++) {
            IZKPVerifier.ZKPResponse memory response = responses[i];
            (
                uint256[] memory inputs,
                uint256[2] memory a,
                uint256[2][2] memory b,
                uint256[2] memory c
            ) = abi.decode(response.zkProof, (uint256[], uint256[2], uint256[2][2], uint256[2]));

            if (
                response.requestId == TRANSFER_REQUEST_ID_SIG_VALIDATOR ||
                response.requestId == TRANSFER_REQUEST_ID_MTP_VALIDATOR
            ) {
                // if proof is given for transfer request id ( mtp or sig ) and it's a first time we mint tokens to sender
                uint256 id = inputs[1];
                if ($.idToAddress[id] == address(0) && $.addressToId[_msgSender()] == 0) {
                    super._mint(_msgSender(), $.TOKEN_AMOUNT_FOR_AIRDROP_PER_ID);
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
        return _getERC20VerifierStorage().TOKEN_AMOUNT_FOR_AIRDROP_PER_ID;
    }
}
