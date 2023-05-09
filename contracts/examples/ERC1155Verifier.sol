// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../lib/GenesisUtils.sol";
import "../interfaces/ICircuitValidator.sol";
import "../verifiers/ZKPVerifier.sol";

contract ERC20Verifier is ERC1155, ZKPVerifier {

    uint256 tokenIdERC20 = 1; // fungible tokens
    uint256 tokenIdERC721 = 2; // non-fungible tokens

    constructor(string memory uri_)
    ERC1155(uri_)
    {}

    /** @dev each token id has unique request
            tokenERC20 require request for KYCAgeCredential
            tokenERC721 require request for KYCCountryOfResidenceCredential
    */
    mapping(uint256 => uint64) public tokenRequests;


    //* setting the request : policy for sender can be different (owner of token / owner of contract)  */
    function setTransferRequestId(uint256 _id, uint64 _requestId) public onlyOwner {
        require(tokenRequests[_id] == 0, "Token under id already has a request id");
        tokenRequests[_id] = _requestId;
    }

    function _beforeProofSubmit(
        uint64, /* requestId */
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
        ICircuitValidator validator
    ) internal override {
       // we don't need to do anything, we have info that user provided proof to request id in proof[user][request] map;
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {

         // let's assume that we allow only single kind of token transfer
        require(ids.length == 1);
        require(amounts.length == 1);


        // get id of needed request to transfer token
        uint64 requestId = tokenRequests[ids[0]];
        require(
            proofs[from][requestId] == true,
            "only identities who provided proof are allowed to transfer tokens"
        );

    }


    /*
        Bellow code is example if we requests are need to be set by token owner
    */

        /** @dev  e.g. each minted token id can be written assigned to user */
        mapping(address => uint256[]) public userTokens;

        /** @dev just to not work with array because of potential gas problem */
        mapping(address => mapping(uint256 => uint256)) public tokenIndexInUser;

        function _mint(
            address to,
            uint256 id,
            uint256 amount,
            bytes memory data
        ) internal virtual override {
            userTokens[to].push(id); // add token to user token registry
            uint256 futureTokenIndexForUser = userTokens[to].length; // just a way to get tokens in the future by not itterating the array. index in array is value - 1
            tokenIndexInUser[to][id] = futureTokenIndexForUser;
            super._mint(to, id,amount,data);
        }

    //* setting the request by token owner */
    function setTransferRequestIdByMinter(uint256 _id, uint64 _requestId) public {
        require(tokenRequests[_id] == 0, "Token under id already has a request id");
        require(tokenIndexInUser[_msgSender()][_id] != 0,"Token hasn't been minted" );

        tokenRequests[_id] = _requestId;
    }

}
