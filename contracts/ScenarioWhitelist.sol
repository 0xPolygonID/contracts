// SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import {GenesisUtils} from "@iden3/contracts/lib/GenesisUtils.sol";
import {ICircuitValidator} from "@iden3/contracts/interfaces/ICircuitValidator.sol";
import "./NexeraZKPVerifier.sol";
import "./INexeraVerifier.sol";

contract ScenarioWhitelist is INexeraVerifier, NexeraZKPVerifier {
    // Manage Rules
    uint64[] public registeredRuleIDs;
    mapping(uint64 => bool) public isRuleIdRegistered;
    mapping(uint64 => mapping(address => bool)) public ruleIdsToWhitelist;

    // Scenario Whitelist
    mapping(address => bool) public scenarioWhitelist;

    // ID to Address connection
    mapping(uint256 => address) public idToAddress;
    mapping(address => uint256) public addressToId;

    constructor() {}

    // TODO: add a blacklist function to reset the whitelist if a rule is replaced by another one
    function _afterSetRequest(uint64 requestId) internal override {
        // If requestId is not registered, register it to the list of registeredRuleIDs
        if (!isRuleIdRegistered[requestId]) {
            registeredRuleIDs.push(requestId);
            isRuleIdRegistered[requestId] = true;
        }
    }

    function _beforeProofSubmit(
        uint64 /* requestId */,
        uint256[] memory inputs,
        ICircuitValidator validator
    ) internal view override {
        // check that  challenge input is address of sender
        address addr = GenesisUtils.int256ToAddress(
            inputs[validator.getChallengeInputIndex()]
        );
        // this is linking between msg.sender and
        require(
            _msgSender() == addr,
            "address in proof is not a sender address"
        );
    }

    function _afterProofSubmit(
        uint64 requestId,
        uint256[] memory inputs,
        ICircuitValidator _validator
    ) internal override {
        // get user id and register it
        uint256 id = inputs[1];
        addressToId[_msgSender()] = id;
        idToAddress[id] = _msgSender();

        // Whitelist user for this rule
        ruleIdsToWhitelist[requestId][_msgSender()] = true;
    }

    // Once the user is whitelisted for all rules, call this function to finalize
    // (this is more gas efficient than iterating over rules on every submission)
    function finalizeWhitelistScenario(address user) public returns (bool) {
        bool isUserWhitelisted = true;
        for (uint i = 0; i < registeredRuleIDs.length; i++) {
            isUserWhitelisted =
                isUserWhitelisted &&
                ruleIdsToWhitelist[registeredRuleIDs[i]][user];
        }
        scenarioWhitelist[user] = isUserWhitelisted;
        return isUserWhitelisted;
    }

    // This function sends all the ZKPs and whitelists a user all in one call
    function whitelistScenario(ZKP[] calldata zkps) public returns (bool) {
        for (uint i = 0; i < zkps.length; i++) {
            submitZKPResponse(
                zkps[i].requestId,
                zkps[i].inputs,
                zkps[i].a,
                zkps[i].b,
                zkps[i].c
            );
        }
        return finalizeWhitelistScenario(msg.sender);
    }

    function isWhitelisted(address user) public view returns (bool) {
        return scenarioWhitelist[user];
    }
}
