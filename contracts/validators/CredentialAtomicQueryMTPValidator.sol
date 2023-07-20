// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {IVerifier} from "@iden3/contracts/interfaces/IVerifier.sol";
import {IState} from "@iden3/contracts/interfaces/IState.sol";

contract CredentialAtomicQueryMTPValidator is OwnableUpgradeable, ICircuitValidator {
    string constant CIRCUIT_ID = "credentialAtomicQueryMTPV2OnChain";
    uint256 constant CHALLENGE_INDEX = 4;

    IVerifier public verifier;
    IState public state;

    uint256 public revocationStateExpirationTime;
    uint256 public proofGenerationExpirationTime;

    function initialize(
        address _verifierContractAddr,
        address _stateContractAddr
    ) public initializer {
        revocationStateExpirationTime = 1 hours;
        proofGenerationExpirationTime = 1 hours;
        verifier = IVerifier(_verifierContractAddr);
        state = IState(_stateContractAddr);
        __Ownable_init();
    }

    function setRevocationStateExpirationTime(uint256 expirationTime) public onlyOwner {
        revocationStateExpirationTime = expirationTime;
    }

    function setProofGenerationExpirationTime(uint256 expirationTime) public virtual onlyOwner {
        proofGenerationExpirationTime = expirationTime;
    }

    function getCircuitId() external pure returns (string memory id) {
        return CIRCUIT_ID;
    }

    function getChallengeInputIndex() external pure returns (uint256 index) {
        return CHALLENGE_INDEX;
    }

    function verify(
        uint256[] calldata inputs,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256 queryHash
    ) external view returns (bool r) {
        // verify that zkp is valid
        require(verifier.verifyProof(a, b, c, inputs), "MTP proof is not valid");

        require(inputs[2] == queryHash, "query hash does not match the requested one");

        // verify user states
        uint256 gistRoot = inputs[5];
        uint256 issuerId = inputs[6];
        uint256 issuerClaimIdenState = inputs[7];
        uint256 issuerClaimNonRevState = inputs[9];
        uint256 proofGenerationTimestamp = inputs[10];

        IState.GistRootInfo memory rootInfo = state.getGISTRootInfo(gistRoot);

        require(rootInfo.root == gistRoot, "Gist root state isn't in state contract");

        // 2. Issuer state must be registered in state contracts or be genesis
        bool isIssuerStateGenesis = GenesisUtils.isGenesisState(issuerId, issuerClaimIdenState);

        if (!isIssuerStateGenesis) {
            IState.StateInfo memory issuerStateInfo = state.getStateInfoByIdAndState(
               issuerId, issuerClaimIdenState
            );
            require(issuerId == issuerStateInfo.id, "Issuer state doesn't exist in state contract");
        }

        IState.StateInfo memory issuerClaimNonRevStateInfo = state.getStateInfoById(issuerId);

        if (issuerClaimNonRevStateInfo.state == 0) {
            require(
                GenesisUtils.isGenesisState(issuerId, issuerClaimNonRevState),
                "Non-Revocation state isn't in state contract and not genesis"
            );
        } else {
            // The non-empty state is returned, and it's not equal to the state that the user has provided.
            if (issuerClaimNonRevStateInfo.state != issuerClaimNonRevState) {
                // Get  the time of the latest state and compare it to the transition time of state provided by the user.
                IState.StateInfo memory issuerClaimNonRevLatestStateInfo = state
                    .getStateInfoByIdAndState(issuerId,issuerClaimNonRevState);

                if (
                    issuerClaimNonRevLatestStateInfo.id == 0 ||
                    issuerClaimNonRevLatestStateInfo.id != issuerId
                ) {
                    revert("state in transition info contains invalid id");
                }

                if (issuerClaimNonRevLatestStateInfo.replacedAtTimestamp == 0) {
                    revert("Non-Latest state doesn't contain replacement information");
                }

                if (
                    block.timestamp - issuerClaimNonRevLatestStateInfo.replacedAtTimestamp >
                    revocationStateExpirationTime
                ) {
                    revert("Non-Revocation state of Issuer expired");
                }

                if (block.timestamp - proofGenerationTimestamp > proofGenerationExpirationTime) {
                    revert("Generated proof is outdated");
                }
            }
        }

        return (true);
    }
}