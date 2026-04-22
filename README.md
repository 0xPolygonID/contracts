# Contracts

This repository contains examples of smart contracts and deployment scripts.

## Smart contracts with unified addresses

There are contracts deployed on the same addresses across all supported networks. You can reuse them in your example contracts.
| Smart contract | Address |
|:-----------------------:|:------------------------------------------:|
| **State** | 0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896 |
| **Validator V3 Stable** | 0x0d78ADDD050a75a94e21eD14d54591933B9B7546 |
| **Universal Verifier V2** | 0x2B0D3f664A5EbbfBD76E6cbc2cA9A504a68d2F4F |

\*The only exception are the State contracts for **Polygon Mainnet** and **Polygon Amoy testnet**, which where deployed before the unified address methodology was implemented.

- Polygon Amoy testnet State Contract: **0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124**
- Polygon PoS mainnet State Contract : **0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D**

## Libraries on unified addresses

There are a few libraries, which does not tend to evolve much but can be re-used in many other contracts, e.g. custom onchain-identity. They reside on the same addresses across all networks deployed and serve both project needs and as a public good. Obviously, they are not upgradable.

|      Library       |                  Address                   |
| :----------------: | :----------------------------------------: |
|     **SmtLib**     | 0x682364078e26C1626abD2B95109D2019E241F0F6 |
| **PoseidonUnit1L** | 0xC72D76D7271924a2AD54a19D216640FeA3d138d9 |
| **PoseidonUnit2L** | 0x72F721D9D5f91353B505207C63B56cF3d9447edB |
| **PoseidonUnit3L** | 0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240 |
| **PoseidonUnit4L** | 0x0695cF2c6dfc438a4E40508741888198A6ccacC2 |

## ERC20 example contracts

If you are deploying your own ZKPVerifier, you can use already deployed circuit validators with unified addresses with the corresponding groth16 verifiers.

The examples of ERC20 smart contract shows how to use v3 stable validator for verification of zero-knowledge proof on-chain for token transfers.

We provide deployment scripts for example zkp verifier contracts that inherits EmbeddedVerifier contract https://github.com/iden3/contracts/blob/master/contracts/verifiers/EmbeddedVerifier.sol

<details>
<summary>Addresses</summary>

Current addresses on **Polygon Amoy** testnet using v3 stable validator:

|                      |                                                          Example contracts                                                          |
| :------------------: | :---------------------------------------------------------------------------------------------------------------------------------: |
| **ERC20 Selective Disclosure example** | 0x891273E4889f1615A2901c1c08e181a1BF7A3151 (request id = 1766847064778385425787788993734435560779361951665242919796828552687552473) |
|  **ERC20 example**   | 0xf26cA3A25bc72F8f646b3F7702e63a7D5271Fc18 (request id = 1766847064778388236564802596319105997190932281386067682776689168350624555) |
|  **ERC20 Linked Universal Verifier**   | 0x6deC4581D180EdCCcf7660A4c0Ada6DB30908eef (request id = 1766847064778387067339863512871419139452185609990746777156840189569703766) |

</details>

## BalanceCredentialIssuer (v1.0.0)

Here is an example of a **non-merklized** on-chain issuer. This example demonstrates how to use the IdentityBase library to create your own on-chain issuer implementation.

<details>
<summary>Addresses</summary>

**Polygon Amoy testnet**:
| Contract | Address |
|:---------------------------:|:------------------------------------------:|
| **Poseidon2Elements** | 0x72F721D9D5f91353B505207C63B56cF3d9447edB |
| **Poseidon3Elements** | 0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240 |
| **Poseidon4Elements** | 0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240 |
| **SmtLib** | 0x682364078e26C1626abD2B95109D2019E241F0F6 |
| **ClaimBuilder** | 0x0AC0fa28ef1a324c7E3eF18AcCe03a6c67BA7E38 |
| **IdentityLib** | 0x7b8f8C1505fE214786abEc67a2f768EfbFa58B98 |
| **BalanceCredentialIssuer** | 0x3f28DDeD81Ab39Ee8da91765aE436280dF19C5B2 |

</details>

## IdentityExample

Here is an example of a **merklized** on-chain issuer. This example demonstrates how to use the IdentityBase library to create your own on-chain issuer implementation. There is no deployed contracts since each user is required to deploy the contract independently. Only the contract owner has the authority to issue a claim.

<details>
<summary>Addresses</summary>

Amoy:

|                       |                  Address                   |
| :-------------------: | :----------------------------------------: |
| **Poseidon2Elements** | 0x72F721D9D5f91353B505207C63B56cF3d9447edB |
| **Poseidon3Elements** | 0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240 |
| **Poseidon4Elements** | 0x5Bc89782d5eBF62663Df7Ce5fb4bc7408926A240 |
|      **SmtLib**       | 0x682364078e26C1626abD2B95109D2019E241F0F6 |
| **Identity Contract** | 0x7834144d9c1d6B0a365c59f1a39a67e3BA9deb9A |

</details>

## Deploy scripts

1. **deploy:erc20** - deploy erc20 smart contract to selected network
   ```shell
   npm run deploy:erc20 -- --network <network>
   ```
2. **deploy:erc20linkeduniversalverifier** - deploy erc20 linked to Universal Verifier smart contract to selected network
   ```shell
   npm run deploy:erc20linkeduniversalverifier -- --network <network>
   ```
3. **deploy:erc20selectivedisclosure** - deploy erc20 selective disclosure smart contract to selected network
   ```shell
   npm run deploy:erc20selectivedisclosure -- --network <network>
   ```
4. **setrequests:v3** - set different requests v3 for the erc20 selective disclosure smart contract to selected network
   ```shell
   npm run setrequests:v3 -- --network <network>
   ```
5. **deploy:identityexample** - deploy onchain merklized issuer example to selected network
   ```shell
   npm run deploy:identityexample -- --network <network>
   ```
6. **deploy:main:balancecredentialissuer** - deploy onchain non-merklized issuer example to selected network
   ```shell
   npm run deploy:balancecredentialissuer -- --network <network>
   ```
