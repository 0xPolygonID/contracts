# Demo contracts deployments

## Pre-requisites

1.Install Node.js and npm
2. Clone the repository and install the dependencies

```bash
git clone https://github.com/0xPolygonID/contracts.git
git checkout validator-integration-embeeded 
cd contracts
npm install
```

3. provide RPC url and wallet key in hardhat.config.ts

```bash
...
 'polygon-amoy': {
      chainId: 80002,
      url: `<RPC_URL>`,
       accounts: process.env.PRIVATE_KEY ? [`0x${process.env.PRIVATE_KEY}`] : DEFAULT_ACCOUNTS, // [or your private key with 0x prefix]
    },
```

## Deploying AddressOwnershipCredentialRegistry

`npx hardhat run scripts/deployAddressOwnershipCredentialIssuer.ts --network polygon-amoy`

## Deploying ERC20Verifier

`npx hardhat run scripts/deployERC20.ts --network polygon-amoy`

## Deployed Contracts

1. ERC20Verifier: `0x43DAB1FcD8C60dc5bFd8A1ecA47937a2A2ac929c`
2. AddressOwnershipCredentialRegistry: `0x73C29bD6F2C6358c32Dd69Dc704460D44c36c850`
