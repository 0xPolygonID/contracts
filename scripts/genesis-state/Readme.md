1. npx hardhat run scripts/genesis-state/deployGenesiState.ts --network sepolia 
https://sepolia.lineascan.build/address/0xf941A245136A1Ada6557284F87C3d91711BB020D#code

{
 "state": "0x9c905B15D6EAd043cfce50Bb93eeF36279153d03", 
 // 0xf941A245136A1Ada6557284F87C3d91711BB020D - implementation
 "verifier": "0xECc5C3c591Fee9150F6f3FC96AEEf02fe7E27a51",
 "stateLib": "0x723bA76845aC96955657b3c8d76292cBc72B5f0A",
 "smtLib": "0xc3Af1587389691373f5dAbE27109c938576607e6",
 "poseidon1": "0x3262eeEcbcA5C29650C385D6DB0c0146Bc7c0273",
 "poseidon2": "0x03F534D2d2874B195b6D289c8aD5B73eba33BDf5",
 "poseidon3": "0x15cb0E1b7018D3c461A3715FAB9beB8C4c93B228",
 "network": "sepolia"
}

2. npx hardhat run scripts/genesis-state/deployIdentityTreeStorage.ts --network sepolia 
IdentityTreeStore deployed to: 0x483340bf249D3bFeF5333e7AE0058B0D2931A711

3.  npx hardhat run scripts/deployV3Validator.ts --network sepolia

VerifierV3Wrapper  deployed to: 0x312e0DE00B35CF1cE948F722F8A2f16c465A942b
CredentialAtomicQueryV3Validator  deployed to: 0x03e26bf5B8Aa3287a6D229B524f9F444151a44B2 
(look into "no-transition" state contract - 0x9c905B15D6EAd043cfce50Bb93eeF36279153d03)

3. Verax flow:

VeraxZKPVerifier  deployed to: 0xcE2d01c6b65290C3D3AF09324D516aB1976657d9

request: 
did:polygonid:linea:sepolia:32232vGknSaK9oC8UysgJy3QquqvYKg8YAgin7W7wo
200

