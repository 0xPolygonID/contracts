1. npx hardhat run scripts/genesis-state/deployReadonlyState.ts --network sepolia 
https://sepolia.lineascan.build/address/0x0C0576A734c34E15aBb7bCfC5669ABD2052a44DB#code - implementation
{
 "state": "0xD8869a439a07Edcc990F8f21E638702ee9273293",
 "verifier": "0xf418D0aecF3153cbAabD6d7EE25F72003283104e",
 "stateLib": "0x2966196793c38AB1ED07a07671006A36E254F3AC",
 "smtLib": "0x05FB9f1410D380Ab98203F807267617BA3f3372d",
 "poseidon1": "0x78B3fd7173D7a4Bf98210c447bD4b8F0928F5943",
 "poseidon2": "0xB2CF3724D501F1584E429f3B3E1f3b11bfc2A150",
 "poseidon3": "0x2dbDe11085987AD9279E08574dbbE5a00657655b",
 "network": "sepolia"
}

{
 "state": "0x742673Fc2108d526fc3494d3780141552B660cAB",
 "verifier": "0x1f10e4751180a0C31F840bbe80bE5117A03fb61B",
 "stateLib": "0xaB3D12056e39D8347Df16a51F3A5dc978E9FbcA6",
 "smtLib": "0x26d717A110C63bF8368Fa811888e9ac35a19530E",
 "poseidon1": "0x59870f921945E031605EC3544EC3963201510ba7",
 "poseidon2": "0xd726B7CFf1fE694D68B04808D59E0Fcf466917B9",
 "poseidon3": "0x085d878a1Cf7A5905Aa0d82747136a57DE8409f5",
 "poseidon4": "0xEccbd18FFC41671A19FBc40e7ea04C6003630705",
 "network": "linea"
}

2. npx hardhat run scripts/genesis-state/deployIdentityTreeStorage.ts --network sepolia 
IdentityTreeStore deployed to: 0x0727E37edE02f37bf789C7b71a4A90806267726f sepolia
IdentityTreeStore deployed to: 0x6f6E19781600d6B06D64A6b86431FB7dB3E919e0 linea

3. npx hardhat run scripts/deployV3Validator.ts --network sepolia

sepolia 

VerifierV3Wrapper  deployed to: 0xeb34EDF18b3208aFF08E1426Da822f0cAF73d5f3
CredentialAtomicQueryV3Validator  deployed to: 0x266fe15bE3a1969496967aE44F0bAc3EFb7ca6f5
(look into "no-transition" state contract - 0xD8869a439a07Edcc990F8f21E638702ee9273293)

linea

VerifierV3Wrapper  deployed to: 0x4BE489Fd4Bd13C6b48Dd70f1523D8275b4Aa69be
CredentialAtomicQueryV3Validator  deployed to: 0x9ee6a2682Caa2E0AC99dA46afb88Ad7e6A58Cd1b

3. Verax flow:

VeraxZKPVerifier  deployed to: 0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b sepolia
VeraxZKPVerifier  deployed to: 0x07D5A8d32A3B42536c3019fD10F62A893aCc9021 linea

POL:
npx hardhat run scripts/verax/setRequests-v3validator-verax-AnimaProofOfLife.ts --network sepolia 

main:
15440111504995303282131413553872819257758117393758193881365814364675787009n
did:iden3:linea:main:28vX3frJDbAvKTmZBH1u45uomixVxDf3SPC24QgoQs
100001
0x8ac9d6f7ecf3f7fdbacbbec9775e9c67ad9b7970b1d8af2c48eb016a4adc853b


sepolia:
*
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v
11000001

did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7 - issuer
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v - verifier
100001




w/o uniquness
ZKPVerifyModulePoL  deployed to: 0x559Dd0eB3148f77349deae0aEAaEC4f3eD9e36E9
portal: 0x57e8e6491093A9032e7d0e8Af52d49D40F89d5ca

did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7 - issuer
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v - verifier
8575753243

ZKPVerifyModulePoL  deployed to: 0x39e8a6af9D5d1D36c4E5BC2f1F43902a6F9A7C54 sepolia
ZKPVerifyModulePoL portal 0xE72bcb4f7065DB683BC16BEf9A01C059309DFe4a sepolia

ZKPVerifyModulePoL  deployed to: 0x880Fe89dD5C59696c196B33F00FeE31f7b672209 main
portal pol 0x5C426a0387fAa8Bac13C371dF44494FBd19B141c main

npx hardhat run scripts/verax/setPortalInfo-AnimaProofOfLife.ts --network sepolia

POU:
npx hardhat run scripts/verax/setRequests-v3validator-verax-AnimaProofOfUniqueness.ts --network sepolia

main:
15440111504995303282131413553872819257758117393758193881365814364675787009n
did:iden3:linea:main:28vX3frJDbAvKTmZBH1u45uomixVxDf3SPC24QgoQs
100002
0x156fe3862c62adac4f074d393a9971d8e62abae87ef878e69f845a50e2081005

*
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v
2200002


did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7 - issuer
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v - verifier
100002


ZKPVerifyModulePoU  deployed to: 0x2AFe076aFf86551eCAd5e48c2fb0E7F7324E04f3 sepolia
ZKPVerifyModulePoU portal : 0x5FfDa857bF7c63A70ac1ABAE67a3368f0eE7dC27 sepolia


ZKPVerifyModulePoU  deployed to: 0xD1d3e0524E676afe079D0b2acE58ec7aB4ddE11f main
portal 0x3486d714C6e6F7257Fa7f0bB8396161150B9f100 main
npx hardhat run scripts/verax/setPortalInfo-AnimaProofOfUniqueness.ts --network sepolia



scheam PoU

{
  id: '0x021fa993b2ac55b95340608478282821b89398de6fa14073b4d44a3564a8c79d',
  name: 'AnimaProofOfUniqueness',
  description: 'Verification schema with reputation level, nullifier and zkp request id',
  context: 'https://www.privado.id',
  schema: '(uint64 requestId, uint256 nullifier, uint256 reputationLevel)'
}


PoL

{
  id: '0xe3a3e680fe5fbfbddff981752989e660514e1fc49fdee922f26d345cc10b1be4',
  name: 'AnimaProofOfLife',
  description: 'Verification schema with nullifier and zkp request id',
  context: 'https://www.privado.id',
  schema: '(uint64 requestId, uint256 nullifier)'
}