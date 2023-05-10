// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "../lib/GenesisUtils.sol";
import "../interfaces/ICircuitValidator.sol";
import "../verifiers/ZKPVerifier.sol";

contract ERC1155Verifier is ERC1155, ZKPVerifier {
    // We set the amount of tokens that can be transferred per proof submission to 1.
    uint256 internal constant TOKEN_AMOUNTS_PER_PROOF_SUBMISSION = 1;
    uint256 internal constant tokenIdERC20 = 1; // fungible tokens
    uint256 internal constant tokenIdERC721 = 2; // non-fungible tokens

    constructor(string memory uri_) ERC1155(uri_) {}

    /** @dev each token id has unique request
            tokenERC20 require request for KYCAgeCredential
            tokenERC721 require request for KYCCountryOfResidenceCredential
    */
    mapping(uint256 => uint64) public tokenRequests;

    //* setting the request : policy for sender can be different (owner of token / owner of contract)  */
    function setTransferRequestId(
        uint256 _id,
        uint64 _requestId
    ) public onlyOwner {
        require(
            tokenRequests[_id] == 0,
            "Token under id already has a request id"
        );
        tokenRequests[_id] = _requestId;
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
        // this is linking between msg.sender and address in proof.
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
        address /* operator */,
        address from,
        address /* to */,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory /* data */
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
        Bellow code is example if requests are needed to be set by token minter/owner
    */

    ///@dev Mapping from tokenId to minter address.
    mapping(uint256 => address) _tokenIdToTokenMinter;

    modifier onlyMinter(uint256 _id) {
        require(
            _tokenIdToTokenMinter[_id] == _msgSender(),
            "Only token minter can call this function"
        );
        _;
    }

    /**
     * @dev Overrides ERC1155 `_mint` function to set the minter of the token under `id` to `_msgSender()` in the `_tokenIdToTokenMinter` mapping.
     */
    function _mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual override {
        super._mint(to, id, amount, data);
        _tokenIdToTokenMinter[id] = _msgSender();
    }

    //* setting the request by token owner */
    function setTransferRequestIdByMinter(
        uint256 _id,
        uint64 _requestId
    ) public onlyMinter(_id) {
        require(
            tokenRequests[_id] == 0,
            "Token under id already has a requestId"
        );
        tokenRequests[_id] = _requestId;
    }

    /**
     * @dev Asserts that `_msgSender()` has provided proof for the token under `id` and transfers the token to `_msgSender()`.
     *
     * Requirements:
     * - `_msgSender()` must have provided proof for the request for token under `id`.
     * - The token under `id` must have been set for ZKP with a non-zero `requestId`.
     * - `requestId` must be the same as the one set for the token under `id`.
     */
    function assertProofSubmitted(uint256 id, uint64 requestId) external {
        // If `requestId` is 0, it means that the token can not be obtained via ZKP.
        require(requestId != 0, "RequestId can not be 0");
        // Require that the token under `id` has been set for ZKP with the same `requestId`.
        require(
            tokenRequests[id] == requestId,
            "Token under id is not set for this request id"
        );
        // Require that `_msgSender()` has provided proof for the token under `id`.
        require(
            proofs[_msgSender()][requestId] == true,
            "Proof was not submitted"
        );
        /**
         * @dev If all the above requirements are satisfied, we transfer the token to `_msgSender()`.
         * @notice here we are using _safeTransferFrom from ERC1155, but it can be replaced with any other function or action
         * 		   to be executed after proof is submitted. Similar to the `_afterProofSubmit` function in `ERC20Verifier`.
         */
        super._safeTransferFrom(
            _tokenIdToTokenMinter[id],
            _msgSender(),
            id,
            TOKEN_AMOUNTS_PER_PROOF_SUBMISSION,
            ""
        );
    }
}
