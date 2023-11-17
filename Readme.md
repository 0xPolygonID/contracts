## ERC20 example

Repository contains implementation of the example smart contract and deployed sig/mtp validator onchain zero-knowledge proof verification.

We aim to provide deployment of:

- Atomic query MTP validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQueryMTPValidator.sol
- Atomic query Signature validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQuerySigValidator.sol
- Example contract that inherits ZKP Verifier contract https://github.com/iden3/contracts/blob/master/contracts/verifiers/ZKPVerifier.sol

Also, it contains the example of ERC20 based smart contract with enabled zkp verifications for token transfers.

Current addresses on Polygon Mumbai testnet. (V1.0.0)

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
|   **Verifier**    |         0x8024014f73BcCAEe048784d835A36c49e96F2806          |          0xF71d97Fc0262bB2e5B20912a6861da0B617a07Aa          |
|  **Validators**   |         0x1E4a22540E293C0e5E8c33DAfd6f523889cFd878          |          0x0682fbaA2E4C478aD5d24d992069dba409766121          |
| **ERC20 example** | 0xD75638D319B1aE2a9491DC61f87a800AD362D168 (request id = 1) | 0xD75638D319B1aE2a9491DC61f87a800AD362D168  (request id = 2) |



Current addresses on Polygon Main  (V1.0.0)

|                   |                                Sig                                |                                MTP                                |
|:-----------------:|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|
|   **Verifier**    |            0xaf48CC9C2Ef728b7c4A903c9f5472498f8AED5E1             |            0x1008De1794be8fAba4fc33db6dff59B1d1Ac3a64             |
|  **Validators**   |            0x35178273C828E08298EcB0C6F1b97B3aFf14C4cb             |            0x8c99F13dc5083b1E4c16f269735EaD4cFbc4970d             |
| **ERC20 example** | 0xa5f08979370AF7095cDeDb2B83425367316FAD0B (request id = 1 (sig)) | 0xa5f08979370AF7095cDeDb2B83425367316FAD0B  (request id = 2 (mtp) |



Legacy addresses on Polygon Mumbai testnet.

|                    |                    Sig                   |                    MTP                    |
|:------------------:|:------------------------------------------:|:-----------------------------------------:|
|   **Validators**   |0xF2D4Eeb4d455fb673104902282Ce68B9ce4Ac450  |0x3DcAe4c8d94359D31e4C89D7F2b944859408C618 |
| **ERC20 examples** |0x9017a99afb69CB7B21C7DD29827b4762DECD53FD  |0x3Bf7f4774DC3f92431fA690fa000f636562dCC18 |

Legacy addresses on Polygon Main. (ERC20 example with airdrop use case, restricted to 1 request)
|                    |                    Sig                   |                    MTP                    |
|:------------------:|:------------------------------------------:|:-----------------------------------------:|
|   **Verifier**     |0x6f6E19781600d6B06D64A6b86431FB7dB3E919e0  |0x9DB901F3AFdAAA73F5B2123B186F566fA3Ed1551 |
|  **Validators**    |0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b  |0x5f24dD9FbEa358B9dD96daA281e82160fdefD3CD |
| **ERC20 examples** |0x8732e29eE329fD19Ff868a3Df3D5F6A3116027A2  |0x5c31BB88AA57C69FF537C5d86102246D61712C90 |

Legacy ERC20 examples with airdrop use case, not restricted

|                    |                    Sig                   |                    MTP                    |
|:------------------:|:------------------------------------------:|:-----------------------------------------:|
|   **Validators**   |0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b  |0x5f24dD9FbEa358B9dD96daA281e82160fdefD3CD |
| **ERC20 examples** |0x7C14Aa764130852A8B64BA7058bf71E4292d677F  |0xa3Bc012FCf034bee8d16161730CE4eAb34C35100 |
