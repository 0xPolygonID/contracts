import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity 0.8.20;

contract PayExample is Ownable {
    /**
     * @dev mapping of keccak256(abi.encode(issuerId, schemaHash)) => value
     */
    mapping (bytes32 => uint256) private ValueToPay;

     /**
     * @dev mapping of keccak256(abi.encode(issuerId, paymentId)) => bool
     */
    mapping (bytes32 => bool) private Payments;

    event Payment(uint256 indexed issuerId, string paymentId, uint256 schemaHash);

    constructor() Ownable(_msgSender()) { }

    function setPaymentValue(uint256 issuerId, uint256 schemaHash, uint256 value) public onlyOwner {
        ValueToPay[keccak256(abi.encode(issuerId, schemaHash))] = value;
    }

    function pay(string calldata paymentId, uint256 issuerId, uint256 schemaHash) public payable {
        uint256 requiredValue = ValueToPay[keccak256(abi.encode(issuerId, schemaHash))];
        bytes32 payment = keccak256(abi.encode(issuerId, paymentId));
        require(!Payments[payment], "Payment already done");
        require(requiredValue != 0, "Payment value not found for this issuer and schema");
        require(requiredValue == msg.value, "Invalid value");
        Payments[payment] = true;
        emit Payment(issuerId, paymentId, schemaHash);
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