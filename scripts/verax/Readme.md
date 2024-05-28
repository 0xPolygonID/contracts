```mermaid
sequenceDiagram
    participant Client
    participant ZKPVerifier
    participant VeraxPortal
    participant ZKPVerifyModule
    Client->>ZKPVerifier: submitZKPResponse(requestId, proof)
    ZKPVerifier->>VeraxPortal: attest(attestation, validationPayload: requestId, proof)
    VeraxPortal->>ZKPVerifyModule: run()
    ZKPVerifyModule ->> ZKPVerifier: getZKPRequest(requestId)
    ZKPVerifier ->> ZKPVerifyModule: returns request
    Note right of ZKPVerifyModule: validate proof, check attestation
```

Full path:
```mermaid
sequenceDiagram
    participant Client
    participant ZKPVerifier
    participant VeraxPortal
    participant ModuleRegistry
    participant ZKPVerifyModule
    participant AttestationRegistry
    Client->>ZKPVerifier: submitZKPResponse(requestId, proof)
    ZKPVerifier->>VeraxPortal: attest(attestation, validationPayload: requestId, proof)
    VeraxPortal->>ModuleRegistry: runModules()
    ModuleRegistry->>ZKPVerifyModule: run()
    ZKPVerifyModule->>ZKPVerifier: getZKPRequest(requestId)
    ZKPVerifier->>ZKPVerifyModule: returns request
    Note right of ZKPVerifyModule: validate proof, check attestation
    ZKPVerifyModule->>ModuleRegistry: valid
    ModuleRegistry->>VeraxPortal: valid
    VeraxPortal->>AttestationRegistry: attest(attestation, attester)
```



1. npx hardhat run scripts/verax/deployVeraxZKPVerifier.ts --network sepolia
2. npx hardhat run scripts/verax/setRequests-v3validator-verax.ts --network sepolia (replace `veraxZKPVerifierAddress`)
3. npx hardhat run scripts/verax/deploy-module.ts --network sepolia (replace `VeraxZKPVerifier`)
4. npx ts-node scripts/verax/create-default-portal.ts  (replace `moduleAddress`)
5. npx hardhat run scripts/verax/setPortalInfo.ts --network sepolia (replace `veraxVerifierAddress` and `portalAddress`)

Check attestation on https://sepolia.lineascan.build/address/0xDaf3C3632327343f7df0Baad2dc9144fa4e1001F#events

npx ts-node scripts/verax/get-attestation.ts (replace `attestationId`)