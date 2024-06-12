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

2. npx hardhat run scripts/genesis-state/deployIdentityTreeStorage.ts --network sepolia 
IdentityTreeStore deployed to: 0x0727E37edE02f37bf789C7b71a4A90806267726f

3. npx hardhat run scripts/deployV3Validator.ts --network sepolia

VerifierV3Wrapper  deployed to: 0xeb34EDF18b3208aFF08E1426Da822f0cAF73d5f3
CredentialAtomicQueryV3Validator  deployed to: 0x266fe15bE3a1969496967aE44F0bAc3EFb7ca6f5
(look into "no-transition" state contract - 0xD8869a439a07Edcc990F8f21E638702ee9273293)

3. Verax flow:

VeraxZKPVerifier  deployed to: 0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b


POL:
npx hardhat run scripts/verax/setRequests-v3validator-verax-AnimaProofOfLife.ts --network sepolia 

*
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v
11000001

did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7 - issuer
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v - verifier
100001

ZKPVerifyModulePoL  deployed to: 0x39e8a6af9D5d1D36c4E5BC2f1F43902a6F9A7C54
ZKPVerifyModulePoL portal 0xE72bcb4f7065DB683BC16BEf9A01C059309DFe4a

npx hardhat run scripts/verax/setPortalInfo-AnimaProofOfLife.ts --network sepolia

POU:
npx hardhat run scripts/verax/setRequests-v3validator-verax-AnimaProofOfUniqueness.ts --network sepolia

*
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v
2200002


did:iden3:privado:main:2ScrbEuw9jLXMapW3DELXBbDco5EURzJZRN1tYj7L7 - issuer
did:iden3:linea:sepolia:28itzVLBHnMJV8sdjyffcAtWCx8HZ7btdKXxs7fJ6v - verifier
100002


ZKPVerifyModulePoU  deployed to: 0x2AFe076aFf86551eCAd5e48c2fb0E7F7324E04f3
ZKPVerifyModulePoU portal : 0x5FfDa857bF7c63A70ac1ABAE67a3368f0eE7dC27

npx hardhat run scripts/verax/setPortalInfo-AnimaProofOfUniqueness.ts --network sepolia