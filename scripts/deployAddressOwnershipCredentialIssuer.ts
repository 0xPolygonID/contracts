import fs from 'fs';
import path from 'path';
import { DeployHelper } from '../test/helpers/DeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { ethers } from 'hardhat';
const pathOutputJson = path.join(
  __dirname,
  './deploy_addressOwnershipCredentialIssuer_output.json'
);

async function main() {
  const stateAddress = '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124'; // current iden3 state smart contract on amoy

  const owner = (await ethers.getSigners())[0];
  const [poseidon2Elements, poseidon3Elements, poseidon4Elements] = await deployPoseidons(
    owner,
    [2, 3, 4]
  );
  const stDeployHelper = await StateDeployHelper.initialize([owner], true);
  const smtLib = await stDeployHelper.deploySmtLib(
    await poseidon2Elements.getAddress(),
    await poseidon3Elements.getAddress()
  );

  const deployer = await DeployHelper.initialize([owner], true);
  const { addressOwnershipCredentialIssuer } =
    await deployer.deployAddressOwnershipCredentialIssuer(
      smtLib,
      poseidon3Elements,
      poseidon4Elements,
      stateAddress
    );

  const outputJson = {
    state: stateAddress,
    smtLib: await smtLib.getAddress(),
    poseidon2: await poseidon2Elements.getAddress(),
    poseidon3: await poseidon3Elements.getAddress(),
    poseidon4: await poseidon4Elements.getAddress(),
    addressOwnershipCredentialIssuer: await addressOwnershipCredentialIssuer.getAddress(),
    network: process.env.HARDHAT_NETWORK
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));

  const requestId = 940499666; // calculateRequestIdForCircuit(CircuitId.AuthV2);

  const requestIdExists = await addressOwnershipCredentialIssuer.requestIdExists(requestId);
  if (requestIdExists) {
    throw new Error(`Request ID: ${requestId} already exists`);
  }

  const tx = await addressOwnershipCredentialIssuer.setZKPRequest(
    requestId,
    {
      metadata: '0x',
      validator: '0x1a593E1aD3843b4363Dfa42585c4bBCA885553c0',
      data: '0x'
    }
    // {
    //   gasPrice: 50000000000,
    //   initialBaseFeePerGas: 25000000000,
    //   gasLimit: 10000000,
    // },
  );

  console.log(`Request ID: ${requestId} is set in tx: ${tx.hash}`);

  const displayMethodId = await addressOwnershipCredentialIssuer.getDisplayMethodId();

  console.log('displayMethodId', displayMethodId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
