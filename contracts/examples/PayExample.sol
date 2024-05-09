pragma solidity 0.8.20;

contract PayExample {
    struct Payment {
        string issuerIdHash;
    }

    address payable public owner;
    mapping (string => Payment) public Payments;

    modifier onlyOwner() {
        require (msg.sender != owner);
        _;
    }
    
    constructor() {
        owner = payable(msg.sender);
    }

    function pay(string calldata sessionIdHash, string calldata issuerIdHash) public payable {
        require(msg.value == 1000000000000000);
        Payment memory p = Payment(issuerIdHash);
        Payments[sessionIdHash] = p;
    }

    function withdraw(uint amount) public onlyOwner returns(bool) {
        require(amount < address(this).balance);
        owner.transfer(amount);
        return true;
    }

    function getBalanceContract() public view returns(uint){
        return address(this).balance;
    }
}