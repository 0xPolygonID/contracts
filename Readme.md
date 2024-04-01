# Contracts

This repository contains examples of smart contracts and deployment scripts.

## ERC20 example

The example of ERC20 smart contract. This example shows how to use sig/mtp validator to verification zero-knowledge proof on-chain.

We aim to provide deployment of:

- Atomic query MTP validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQueryMTPValidator.sol
- Atomic query Signature validator https://github.com/iden3/contracts/blob/master/contracts/validators/CredentialAtomicQuerySigValidator.sol
- Example contract that inherits ZKP Verifier contract https://github.com/iden3/contracts/blob/master/contracts/verifiers/ZKPVerifier.sol

Also, it contains the example of ERC20 based smart contract with enabled zkp verifications for token transfers.

Current addresses on Polygon Mumbai testnet. (V2.0.1 V2 validators)

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
|   **Verifier**    |         0x81ef49013627F363570a1C60B0D2215E23651B01          |          0xe5DB0489979C5671D9785cF1cBA9D9028041c9Bf          |
|  **Validators**   |         0x59f2a6D94D0d02F3a2F527a8B6175dc511935624          |          0xb9b51F7E8C83C90FE48e0aBd815ef0418685CcF6          |
| **ERC20 example** | 0x3a4d4E47bFfF6bD0EF3cd46580D9e36F3367da03 (request id = 1) | 0x3a4d4E47bFfF6bD0EF3cd46580D9e36F3367da03  (request id = 2) |


Current addresses on Polygon Amoy testnet. (V2.0.1 V2 validators)

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
|   **Verifier**    |         0x35178273C828E08298EcB0C6F1b97B3aFf14C4cb          |          0x789D95794973034BFeDed6D4693e7cc3Eb253B3a          |
|  **Validators**   |         0x8c99F13dc5083b1E4c16f269735EaD4cFbc4970d          |          0xEEd5068AD8Fecf0b9a91aF730195Fef9faB00356          |
| **ERC20 example** | 0x2b23e5cF70D133fFaA7D8ba61E1bAC4637253880 (request id = 1) | 0x2b23e5cF70D133fFaA7D8ba61E1bAC4637253880  (request id = 2) |




Legacy addresses on Polygon Mumbai testnet. (V1.0.1 V2 validators)

|                   |                             Sig                             |                             MTP                              |
|:-----------------:|:-----------------------------------------------------------:|:------------------------------------------------------------:|
|   **Verifier**    |         0x8024014f73BcCAEe048784d835A36c49e96F2806          |          0xF71d97Fc0262bB2e5B20912a6861da0B617a07Aa          |
|  **Validators**   |         0x1E4a22540E293C0e5E8c33DAfd6f523889cFd878          |          0x0682fbaA2E4C478aD5d24d992069dba409766121          |
| **ERC20 example** | 0xD75638D319B1aE2a9491DC61f87a800AD362D168 (request id = 1) | 0xD75638D319B1aE2a9491DC61f87a800AD362D168  (request id = 2) |

Current addresses for V3 beta circuit on Polygon Mumbai testnet. (2.0.1-beta.1 V3 validator)

|                      |                                          V3 validator 2.0.1-beta.1                                          |   
|:--------------------:|:-----------------------------------------------------------------------------------------------------------:|
|     **Verifier**     |                                 0xDE27fc243Bf4eDAaB72E1008c9828C480582f672                                  | 
|    **Validators**    |                                 0x3412AB64acFf5d94Da4914F176A43aCbDdC7Fc4a                                  |     
| **ERC20 SD example** |                         0x36eB0E70a456c310D8d8d15ae01F6D5A7C15309A (request id = 3)                         |
|     **ERC20  **      | 0x36eB0E70a456c310D8d8d15ae01F6D5A7C15309A (request id = 100 - 1100 merklized  / 10000 - 65000 nonmerklized |

Current addresses for V3 beta circuit on Polygon Amoy testnet. (2.0.1-beta.1 V3 validator)

|                      |                                          V3 validator 2.0.1-beta.1                                          |   
|:--------------------:|:-----------------------------------------------------------------------------------------------------------:|
|     **Verifier**     |                                 0x07Bbd95505c44B65D7FA3B08dF6F5859373Fa1DC                                  | 
|    **Validators**    |                                 0xa5f08979370AF7095cDeDb2B83425367316FAD0B                                  |     
| **ERC20 SD example** |                         0xc5Cd536cb9Cc3BD24829502A39BE593354986dc4 (request id = 3)                         |
|     **ERC20  **      | 0xc5Cd536cb9Cc3BD24829502A39BE593354986dc4 (request id = 100 - 1100 merklized  / 10000 - 65000 nonmerklized |





Current addresses on Polygon Main  

(V2.0.1 V2 validators)

|                   |                                Sig                                |                                MTP                                |
|:-----------------:|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|
|   **Verifier**    |            0xa0495df44ABBDbfCD1da30638869A3307BF21532             |            0x068b3dDE10b55643b55aA4820c7a977dEEEc3c07             |
|  **Validators**   |            0xEF8540a5e0F4f53B436e7C3A273dCAe1C05d764D             |            0x03Ee09635E9946165dd9538e9414f0ACE57e42e1             |
| **ERC20 example** | 0xB9Ac8e785f854f9B76bBF6d495213d58226DE813 (request id = 1 (sig)) | 0xB9Ac8e785f854f9B76bBF6d495213d58226DE813  (request id = 2 (mtp) |


(V1.0.1 V2 validators) 

|                   |                                Sig                                |                                MTP                                |
|:-----------------:|:-----------------------------------------------------------------:|:-----------------------------------------------------------------:|
|   **Verifier**    |            0xaf48CC9C2Ef728b7c4A903c9f5472498f8AED5E1             |            0x1008De1794be8fAba4fc33db6dff59B1d1Ac3a64             |
|  **Validators**   |            0x35178273C828E08298EcB0C6F1b97B3aFf14C4cb             |            0x8c99F13dc5083b1E4c16f269735EaD4cFbc4970d             |
| **ERC20 example** | 0xa5f08979370AF7095cDeDb2B83425367316FAD0B (request id = 1 (sig)) | 0xa5f08979370AF7095cDeDb2B83425367316FAD0B  (request id = 2 (mtp) |


## BalanceCredentialIssuer (v1.0.0)

Here is an example of a **non-merklized** on-chain issuer. This example demonstrates how to use the IdentityBase library to create your own on-chain issuer implementation.

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


## IdentityExample

Here is an example of a **merklized** on-chain issuer. This example demonstrates how to use the IdentityBase library to create your own on-chain issuer implementation. There is no deployed contracts since each user is required to deploy the contract independently. Only the contract owner has the authority to issue a claim.

## Legacy

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

## Deploy scripts

1. **deploy:mumbai:erc20** - deploy erc20 smart contract to polygon mumbai
1. **deploy:mumbai:sig** - deploy signature validator to polygon mumbai
1. **deploy:mumbai:mtp** - deploy MTP validator to polygon mumbai
1. **deploy:main:erc20** - deploy erc20 smart contract to polygon mainnet
1. **deploy:main:sig** - deploy signature validator to polygon mainnet
1. **deploy:main:mtp** - deploy MTP validator to polygon mainnet

1. **deploy:mumbai:identityexample** - deploy onchain merklized issuer example to polygon mumbai
1. **deploy:main:identityexample** - deploy onchain merklized issuer example to polygon mainnet

1. **deploy:mumbai:balancecredentialissuer** - deploy onchain non-merklized issuer example to polygon mumbai
1. **deploy:main:balancecredentialissuer** - deploy onchain non-merklized issuer example to polygon mainnet
