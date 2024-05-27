// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20Upgradeable} from '@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol';
import {PrimitiveTypeUtils} from '@iden3/contracts/lib/PrimitiveTypeUtils.sol';
import {ICircuitValidator} from '@iden3/contracts/interfaces/ICircuitValidator.sol';
import {ZKPVerifier} from '@iden3/contracts/verifiers/ZKPVerifier.sol';
import {Attestation, AttestationPayload} from './verax/types/Structs.sol';

interface IPortal {
    function attest(AttestationPayload memory attestationPayload, bytes[] memory validationPayloads) external payable;
    function getAttester() external view virtual returns (address);
    function attestationRegistry() external view returns (address);
}

interface AttestationRegistry {
    function getAttestationIdCounter() external view returns (uint32);
    event AttestationRegistered(bytes32 indexed attestationId);
    function getAttestation(bytes32 attestationId) external view returns (Attestation memory);
}

contract ERC20SelectiveDisclosureVerifierWithAttestations is ERC20Upgradeable, ZKPVerifier {
    uint64 public constant TRANSFER_REQUEST_ID_V3_VALIDATOR = 3;
    event AttestError(string message);
    event AttestOk(string message);
    /// @custom:storage-location erc7201:polygonid.storage.ERC20SelectiveDisclosureVerifier
    struct ERC20SelectiveDisclosureVerifierStorage {
        mapping(uint256 => address) idToAddress;
        mapping(address => uint256) addressToId;
        mapping(uint256 => uint256) _idToOperatorOutput;
        uint256 TOKEN_AMOUNT_FOR_AIRDROP_PER_ID;
        IPortal attestationPortalContract;
        bytes32 schemaId;
    }

    // keccak256(abi.encode(uint256(keccak256("polygonid.storage.ERC20SelectiveDisclosureVerifier")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ERC20SelectiveDisclosureVerifierStorageLocation =
        0xb76e10afcb000a9a2532ea819d260b0a3c0ddb1d54ee499ab0643718cbae8700;

    function _getERC20SelectiveDisclosureVerifierStorage() private pure returns (ERC20SelectiveDisclosureVerifierStorage storage $) {
        assembly {
            $.slot := ERC20SelectiveDisclosureVerifierStorageLocation
        }
    }

    modifier beforeTransfer(address to) {
        ZKPVerifier.ZKPVerifierStorage storage $ = _getZKPVerifierStorage();
        require(
            $.proofs[to][TRANSFER_REQUEST_ID_V3_VALIDATOR],
            'only identities who provided sig or mtp proof for transfer requests are allowed to receive tokens'
        );
        _;
    }

    function initialize(string memory name, string memory symbol) public initializer {
        ERC20SelectiveDisclosureVerifierStorage storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        super.__ERC20_init(name, symbol);
        super.__ZKPVerifier_init(_msgSender());
        $.TOKEN_AMOUNT_FOR_AIRDROP_PER_ID = 5 * 10 ** uint256(decimals());
       
    }

    function setPortalInfo(address portalAddress, bytes32 schemaId) public onlyOwner {
        ERC20SelectiveDisclosureVerifierStorage storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        $.attestationPortalContract = IPortal(portalAddress);
        $.schemaId = schemaId;
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

    function _attest(uint256 userId, uint64 requestId, uint256 nullifier) internal {
        ERC20SelectiveDisclosureVerifierStorage storage $ = _getERC20SelectiveDisclosureVerifierStorage();
        if ($.attestationPortalContract == IPortal(address(0))) {
            return;
        }
        AttestationPayload memory payload = AttestationPayload(
            bytes32($.schemaId),
            uint64(block.timestamp + 7 days),
            abi.encode(userId),
            abi.encode(requestId, nullifier)
        );
        bytes memory validationData = abi.encode(uint256(0));
        bytes[] memory validationPayload = new bytes[](1);
        validationPayload[0] = validationData;
        try $.attestationPortalContract.attest(payload, validationPayload) {
            emit AttestOk("attestation done");
        } catch  {
            emit AttestError("attestation error");
            require(false, "attestation err");
        }
    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal override {
        _attest(inputs[0], requestId, inputs[4]);
        if (requestId == TRANSFER_REQUEST_ID_V3_VALIDATOR) {
            ERC20SelectiveDisclosureVerifierStorage storage $ = _getERC20SelectiveDisclosureVerifierStorage();
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
        ERC20SelectiveDisclosureVerifierStorage storage $ = _getERC20SelectiveDisclosureVerifierStorage();
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
