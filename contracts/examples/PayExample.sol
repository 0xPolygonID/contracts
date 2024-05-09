pragma solidity 0.8.20;

contract PayExample {
    struct Payment {
        string issuerIdHash;
    }

    mapping (string => Payment) public Payments;

    function pay(string calldata sessionIdHash, string calldata issuerIdHash) public payable {
        require(msg.value == 1000000000000000);
        Payment memory p = Payment(issuerIdHash);
        Payments[sessionIdHash] = p;
    }
}