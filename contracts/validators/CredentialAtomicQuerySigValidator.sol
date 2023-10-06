// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {IVerifier} from "@iden3/contracts/interfaces/IVerifier.sol";
import {StateV2} from "@iden3/contracts/state/StateV2.sol";

contract CredentialAtomicQuerySigValidator is
    OwnableUpgradeable,
    ICircuitValidator
{
    string constant CIRCUIT_ID = "credentialAtomicQuerySigV2OnChain";
    uint256 constant CHALLENGE_INDEX = 5;

    IVerifier public verifier;
    StateV2 public state;

    uint256 public revocationStateExpirationTime;
    uint256 public proofGenerationExpirationTime;

    function initialize(
        address _verifierContractAddr,
        address _stateContractAddr
    ) public initializer {
        revocationStateExpirationTime = 1 hours;
        proofGenerationExpirationTime = 1 hours;
        verifier = IVerifier(_verifierContractAddr);
        state = StateV2(_stateContractAddr);
        __Ownable_init();
    }

    function setRevocationStateExpirationTime(uint256 expirationTime)
        public
        onlyOwner
    {
        revocationStateExpirationTime = expirationTime;
    }

    function setProofGenerationExpirationTime(uint256 expirationTime)
        public
        virtual
        onlyOwner
    {
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
        require(
            verifier.verifyProof(a, b, c, inputs),
            "atomic query signature proof is not valid"
        );
        require(
            inputs[2] == queryHash,
            "query hash does not match the requested one"
        );

        uint256 issuerClaimAuthState = inputs[3];
        uint256 gistRoot = inputs[6];
        uint256 issuerId = inputs[7];
        uint256 issuerClaimNonRevState = inputs[9];
        uint256 proofGenerationTimestamp = inputs[10];

        StateV2.GistRootInfo memory rootInfo = state.getGISTRootInfo(gistRoot);

        require(
            rootInfo.root == gistRoot,
            "Gist root state isn't in state contract"
        );

        // Issuer auth claim issuance must be registered in state contracts or be genesis
        bool isIssuerStateGenesis = GenesisUtils.isGenesisState(
            issuerId,
            issuerClaimAuthState
        );

        if (!isIssuerStateGenesis) {
            StateV2.StateInfo memory issuerStateInfo = state
                .getStateInfoByIdAndState(issuerId, issuerClaimAuthState);
            require(
                issuerId == issuerStateInfo.id,
                "Issuer state doesn't exist in state contract"
            );
        }
        // check if identity transited any state in contract
        bool idExists = state.idExists(issuerId);

        // if identity didn't transit any state it must be genesis
        if (!idExists) {
            bool isIssuerRevocationStateGenesis = GenesisUtils.isGenesisState(
                issuerId,
                issuerClaimNonRevState
            );
            require(
                isIssuerRevocationStateGenesis,
                "Issuer revocation state doesn't exist in state contract and is not genesis "
            );
        } else {
            StateV2.StateInfo memory issuerLatestStateInfo = state
                .getStateInfoById(issuerId);
            if (issuerLatestStateInfo.state != issuerClaimNonRevState) {
                // Get  the time of the latest state and compare it to the transition time of state provided by the user.
                StateV2.StateInfo memory issuerClaimNonRevStateInfo = state
                    .getStateInfoByIdAndState(issuerId, issuerClaimNonRevState);

                if (
                    issuerClaimNonRevStateInfo.id == 0 ||
                    issuerClaimNonRevStateInfo.id != issuerId
                ) {
                    revert("state in transition info contains invalid id");
                }

                if (issuerClaimNonRevStateInfo.replacedAtTimestamp == 0) {
                    revert(
                        "Non-Latest state doesn't contain replacement information"
                    );
                }

                if (
                    block.timestamp -
                        issuerClaimNonRevStateInfo.replacedAtTimestamp >
                    revocationStateExpirationTime
                ) {
                    revert("Non-Revocation state of Issuer expired");
                }
            }
        }

        if (
            block.timestamp - proofGenerationTimestamp >
            proofGenerationExpirationTime
        ) {
            revert("Generated proof is outdated");
        }
        return (true);
    }
}
