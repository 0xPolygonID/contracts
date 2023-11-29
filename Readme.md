## ERC20 example

Repository contains implementation of the example smart contract and deployed sig/mtp validator onchain zero-knowledge proof verification.

We aim to provide deployment of:

- Atomic query MTP validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQueryMTPValidator.sol
- Atomic query Signature validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQuerySigValidator.sol
- Example contract that inherits ZKP Verifier contract https://github.com/iden3/contracts/blob/master/contracts/verifiers/ZKPVerifier.sol

Also, it contains the example of ERC20 based smart contract with enabled zkp verifications for token transfers.

Current addresses on Polygon Mumbai testnet. (V1.0.1)

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
|   **Verifier**    |         0x8024014f73BcCAEe048784d835A36c49e96F2806          |          0xF71d97Fc0262bB2e5B20912a6861da0B617a07Aa          |
|  **Validators**   |         0x1E4a22540E293C0e5E8c33DAfd6f523889cFd878          |          0x0682fbaA2E4C478aD5d24d992069dba409766121          |
| **ERC20 example** | 0xD75638D319B1aE2a9491DC61f87a800AD362D168 (request id = 1) | 0xD75638D319B1aE2a9491DC61f87a800AD362D168  (request id = 2) |



Current addresses on Polygon Main  (V1.0.1)

|                   |                                Sig                                |                                MTP                                |
|:-----------------:|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|
|   **Verifier**    |            0xaf48CC9C2Ef728b7c4A903c9f5472498f8AED5E1             |            0x1008De1794be8fAba4fc33db6dff59B1d1Ac3a64             |
|  **Validators**   |            0x35178273C828E08298EcB0C6F1b97B3aFf14C4cb             |            0x8c99F13dc5083b1E4c16f269735EaD4cFbc4970d             |
| **ERC20 example** | 0xa5f08979370AF7095cDeDb2B83425367316FAD0B (request id = 1 (sig)) | 0xa5f08979370AF7095cDeDb2B83425367316FAD0B  (request id = 2 (mtp) |


Current addresses of example BalanceCredentialIssuer on Polygon Mumbai testnet.

|                             |                    Sig                     |
|:---------------------------:|:------------------------------------------:|
|    **Poseidon2Elements**    | 0x2490924fF554200CFfa3Fb7fEac0A8aF0eaa50fd |
|    **Poseidon3Elements**    | 0xB980c71Ae4Dfd899CF9d09Efe135cE4CcFa021B5 |
|    **Poseidon4Elements**    | 0x60EFFD4319D29297a97ede20e6bEF3d36ef2E25C |
|         **SmtLib**          | 0x48E875a15Bd0AA626756Ad89ec76b63D8810660E |
|      **ClaimBuilder**       | 0x4d29B42a7128fC030167e9E84F9dd356d5Ab7879 |
|       **IdentityLib**       | 0x3476776B9e7ad7Bf187A98acF4dB62e4dBd99345 |
| **BalanceCredentialIssuer** | 0x81787BE964A59A95B5508f31d153B806169E15f4 |

Current addresses of example BalanceCredentialIssuer on Polygon Main.

|                             |                    Sig                     |
|:---------------------------:|:------------------------------------------:|
|    **Poseidon2Elements**    | 0x7A26D06B1dA4b4c526eF5Ea88d0880536032871b |
|    **Poseidon3Elements**    | 0xF1DD455cB686B3a7309c83b48eB679d609c24f7B |
|    **Poseidon4Elements**    | 0x151462e7E6ED90f8B45F3764A7fde4004d411d90 |
|         **SmtLib**          | 0xB9F9AE33395dDB7b994eEBFB9B870a32E79887D6 |
|      **ClaimBuilder**       | 0x3E84F4493E53015f89908e62873860Bb80eb8378 |
|       **IdentityLib**       | 0x3Fc8eaAcE2f46044B6A4745Ff71F7452612e4E9A |
| **BalanceCredentialIssuer** | 0x029301b6cC1399D9260a08943aC0CB9f18C12acC |





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
