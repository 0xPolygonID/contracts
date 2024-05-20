// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.20;
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract PayExample is Ownable {
    /**
     * @dev mapping of keccak256(abi.encode(issuerId, schemaHash)) => value
     */
    mapping (bytes32 => uint256) private valueToPay;

     /**
     * @dev mapping of keccak256(abi.encode(issuerId, paymentId)) => bool
     */
    mapping (bytes32 => bool) public payments;

    event Payment(uint256 indexed issuerId, string indexed paymentId, uint256 schemaHash);

    error PaymentError(string message);

    constructor() Ownable(_msgSender()) { }

    function setPaymentValue(uint256 issuerId, uint256 schemaHash, uint256 value) public onlyOwner {
        valueToPay[keccak256(abi.encode(issuerId, schemaHash))] = value;
    }

    function pay(string calldata paymentId, uint256 issuerId, uint256 schemaHash) public payable {
        uint256 requiredValue = valueToPay[keccak256(abi.encode(issuerId, schemaHash))];
        bytes32 payment = keccak256(abi.encode(issuerId, paymentId));
        if (payments[payment]) {
            revert PaymentError("Payment already done");
        }
        if (requiredValue == 0) {
            revert PaymentError("Payment value not found for this issuer and schema");
        }
        if (requiredValue != msg.value) {
            revert PaymentError("Invalid value");
        }
        payments[payment] = true;
        emit Payment(issuerId, paymentId, schemaHash);
    }

    function isPaymentDone(string calldata paymentId, uint256 issuerId) public view returns (bool) {
        return payments[keccak256(abi.encode(issuerId, paymentId))];
    }

    function withdraw(uint amount) public onlyOwner {
        require(amount <= address(this).balance);
        (bool sent,) = owner().call{ value:  amount }("");
        require(sent, "Failed to withdraw");
    }

    function getContractBalance() public view returns(uint){
        return address(this).balance;
    }
}