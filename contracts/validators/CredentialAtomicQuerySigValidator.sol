// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.16;

import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import {IVerifier} from "@iden3/contracts/interfaces/IVerifier.sol";
import {IState} from "@iden3/contracts/interfaces/IState.sol";

contract CredentialAtomicQuerySigValidator is
    OwnableUpgradeable,
    ICircuitValidator
{
     struct CredentialAtomicQuery {
        uint256 schema;
        uint256 claimPathKey;
        uint256 operator;
        uint256 slotIndex;
        uint256[] value;
        uint256 queryHash;
        uint256[] allowedIssuers;
        string[] circuitIds;
        bool skipClaimRevocationCheck;
    }

    struct CommonPubSignals {
        uint256 merklized;
        uint256 userID;
        uint256 issuerState;
        uint256 circuitQueryHash;
        uint256 requestID;
        uint256 challenge;
        uint256 gistRoot;
        uint256 issuerID;
        uint256 isRevocationChecked;
        uint256 issuerClaimNonRevState;
        uint256 timestamp;
    }

    /**
     * @dev Version of contract
     */
    string public constant VERSION = "1.0.0";

    string constant CIRCUIT_ID = "credentialAtomicQuerySigV2OnChain";

    // This empty reserved space is put in place to allow future versions
    // of the CredentialAtomicQuerySigValidator contract to inherit from other contracts without a risk of
    // breaking the storage layout. This is necessary because the parent contracts in the
    // future may introduce some storage variables, which are placed before the CredentialAtomicQuerySigValidator
    // contract's storage variables.
    // (see https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps)
    // slither-disable-next-line shadowing-state
    // slither-disable-next-line unused-state
    uint256[500] private __gap_before_base;

    mapping(string => IVerifier) internal _circuitIdToVerifier;
    IState public state;

    uint256 public revocationStateExpirationTimeout;
    uint256 public proofExpirationTimeout;
    uint256 public gistRootExpirationTimeout;

    string[] internal _supportedCircuitIds;
    mapping(string => uint256) internal _inputNameToIndex;

    // This empty reserved space is put in place to allow future versions
    // of this contract to add new variables without shifting down
    // storage of child contracts that use this contract as a base
    // (see https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#storage-gaps)
    uint256[43] __gap_after_base;

    function initialize(
        address _verifierContractAddr,
        address _stateContractAddr
    ) public virtual onlyInitializing {
        _setInputToIndex("merklized", 0);
        _setInputToIndex("userID", 1);
        _setInputToIndex("circuitQueryHash", 2);
        _setInputToIndex("issuerAuthState", 3);
        _setInputToIndex("requestID", 4);
        _setInputToIndex("challenge", 5);
        _setInputToIndex("gistRoot", 6);
        _setInputToIndex("issuerID", 7);
        _setInputToIndex("isRevocationChecked", 8);
        _setInputToIndex("issuerClaimNonRevState", 9);
        _setInputToIndex("timestamp", 10);
        _supportedCircuitIds = [CIRCUIT_ID];
        _circuitIdToVerifier[CIRCUIT_ID] = IVerifier(_verifierContractAddr);
        revocationStateExpirationTimeout = 1 hours;
        proofExpirationTimeout = 1 hours;
        gistRootExpirationTimeout = 1 hours;
        state = IState(_stateContractAddr);
        __Ownable_init();
    }

    function setRevocationStateExpirationTime(uint256 expirationTime)
        public
        onlyOwner
    {
        revocationStateExpirationTimeout = expirationTime;
    }

    function setProofExpirationTimeout(uint256 expirationTime)
        public
        onlyOwner
    {
        proofExpirationTimeout = expirationTime;
    }

    function setGISTRootExpirationTimeout(uint256 expirationTimeout) 
        public 
        onlyOwner {
        gistRootExpirationTimeout = expirationTimeout;
    }

    function getCircuitId() external pure returns (string memory id) {
        return CIRCUIT_ID;
    }

    function getSupportedCircuitIds() external view virtual returns (string[] memory ids) {
        return _supportedCircuitIds;
    }

    function inputIndexOf(string memory name) external view virtual returns (uint256) {
        uint256 index = _inputNameToIndex[name];
        require(index != 0, "Input name not found");
        return --index; // we save 1-based index, but return 0-based
    }

    function parseSigPubSignals(
        uint256[] calldata inputs
    ) public pure returns (CommonPubSignals memory) {
        CommonPubSignals memory params = CommonPubSignals({
            merklized: inputs[0],
            userID: inputs[1],
            circuitQueryHash: inputs[2],
            issuerState: inputs[3],
            requestID: inputs[4],
            challenge: inputs[5],
            gistRoot: inputs[6],
            issuerID: inputs[7],
            isRevocationChecked: inputs[8],
            issuerClaimNonRevState: inputs[9],
            timestamp: inputs[10]
        });

        return params;
    }

    function verify(
        uint256[] calldata inputs,
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        bytes calldata data
    ) external view {
        CredentialAtomicQuery memory credAtomicQuery = abi.decode(data, (CredentialAtomicQuery));
        IVerifier verifier = _circuitIdToVerifier[credAtomicQuery.circuitIds[0]];

        require(
            credAtomicQuery.circuitIds.length == 1 && verifier != IVerifier(address(0)),
            "Invalid circuit ID"
        );

        // verify that zkp is valid
        require(verifier.verify(a, b, c, inputs), "Sig Proof is not valid");

        CommonPubSignals memory signals = parseSigPubSignals(inputs);

        // check circuitQueryHash
        require(
            signals.circuitQueryHash == credAtomicQuery.queryHash,
            "Query hash does not match the requested one"
        );

        _checkMerklized(signals.merklized, credAtomicQuery.claimPathKey);
        _checkGistRoot(signals.gistRoot);
        _checkAllowedIssuers(signals.issuerID, credAtomicQuery.allowedIssuers);
        _checkClaimIssuanceState(signals.issuerID, signals.issuerState);
        _checkClaimNonRevState(signals.issuerID, signals.issuerClaimNonRevState);
        _checkProofExpiration(signals.timestamp);
        _checkIsRevocationChecked(
            signals.isRevocationChecked,
            credAtomicQuery.skipClaimRevocationCheck
        );
    }

    function _checkGistRoot(uint256 gistRoot) internal view {
        IState.GistRootInfo memory rootInfo = state.getGISTRootInfo(gistRoot);
        require(rootInfo.root == gistRoot, "Gist root state isn't in state contract");
        if (
            rootInfo.replacedAtTimestamp != 0 &&
            block.timestamp - rootInfo.replacedAtTimestamp > gistRootExpirationTimeout
        ) {
            revert("Gist root is expired");
        }
    }

    function _checkClaimIssuanceState(uint256 _id, uint256 _state) internal view {
        bool isStateGenesis = GenesisUtils.isGenesisState(_id, _state);

        if (!isStateGenesis) {
            IState.StateInfo memory stateInfo = state.getStateInfoByIdAndState(_id, _state);
            require(_id == stateInfo.id, "State doesn't exist in state contract");
        }
    }

    function _checkClaimNonRevState(uint256 _id, uint256 _claimNonRevState) internal view {
        // check if identity transited any state in contract
        bool idExists = state.idExists(_id);

        // if identity didn't transit any state it must be genesis
        if (!idExists) {
            require(
                GenesisUtils.isGenesisState(_id, _claimNonRevState),
                "Issuer revocation state doesn't exist in state contract and is not genesis"
            );
        } else {
            IState.StateInfo memory claimNonRevStateInfo = state.getStateInfoById(_id);
            // The non-empty state is returned, and it's not equal to the state that the user has provided.
            if (claimNonRevStateInfo.state != _claimNonRevState) {
                // Get the time of the latest state and compare it to the transition time of state provided by the user.
                IState.StateInfo memory claimNonRevLatestStateInfo = state.getStateInfoByIdAndState(
                    _id,
                    _claimNonRevState
                );

                if (claimNonRevLatestStateInfo.id == 0 || claimNonRevLatestStateInfo.id != _id) {
                    revert("State in transition info contains invalid id");
                }

                if (claimNonRevLatestStateInfo.replacedAtTimestamp == 0) {
                    revert("Non-Latest state doesn't contain replacement information");
                }

                if (
                    block.timestamp - claimNonRevLatestStateInfo.replacedAtTimestamp >
                    revocationStateExpirationTimeout
                ) {
                    revert("Non-Revocation state of Issuer expired");
                }
            }
        }
    }

    function _checkProofExpiration(uint256 _proofGenerationTimestamp) internal view {
        if (_proofGenerationTimestamp > block.timestamp) {
            revert("Proof generated in the future is not valid");
        }
        if (block.timestamp - _proofGenerationTimestamp > proofExpirationTimeout) {
            revert("Generated proof is outdated");
        }
    }

    function _checkAllowedIssuers(uint256 issuerId, uint256[] memory allowedIssuers) internal pure {
        // empty array is 'allow all' equivalent - ['*']
        if (allowedIssuers.length == 0) {
            return;
        }

        for (uint i = 0; i < allowedIssuers.length; i++) {
            if (issuerId == allowedIssuers[i]) {
                return;
            }
        }

        revert("Issuer is not on the Allowed Issuers list");
    }

    function _checkMerklized(uint256 merklized, uint256 queryClaimPathKey) internal pure {
        uint256 shouldBeMerklized = queryClaimPathKey != 0 ? 1 : 0;
        require(merklized == shouldBeMerklized, "Merklized value is not correct");
    }

    function _checkIsRevocationChecked(
        uint256 isRevocationChecked,
        bool skipClaimRevocationCheck
    ) internal pure {
        uint256 expectedIsRevocationChecked = 1;
        if (skipClaimRevocationCheck) {
            expectedIsRevocationChecked = 0;
        }
        require(
            isRevocationChecked == expectedIsRevocationChecked,
            "Revocation check should match the query"
        );
    }

    function _setInputToIndex(string memory inputName, uint256 index) internal {
        _inputNameToIndex[inputName] = ++index; // increment index to avoid 0
    }

}
