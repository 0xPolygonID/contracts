pragma solidity 0.8.20;

contract PayExample {
    struct Payment {
        string issuerIdHash;
        uint256 value;
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

    function pay(string calldata sessionIdHash, string memory issuerIdHash) public payable {
        Payment memory existedPayment = Payments[sessionIdHash];
        if (existedPayment.value > 0) {
            require(
                keccak256(abi.encodePacked(existedPayment.issuerIdHash)) == keccak256(abi.encodePacked(issuerIdHash)),
                'issuer id hash should be the same for same sessions'
            );
            existedPayment.value = existedPayment.value + msg.value;
            Payments[sessionIdHash] = existedPayment;
            return;
        }
       
        Payments[sessionIdHash] = Payment(issuerIdHash, msg.value);
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