import fs from 'fs';
import hre, { ethers } from 'hardhat';
import path from 'path';
import { OnchainIdentityDeployHelper } from '../test/helpers/OnchainIdentityDeployHelper';
import { getSmtLib, getStateContractAddress } from '../test/utils/deploy-utils';
import { getPoseidonsUnifiedAddresses } from '../test/utils/deploy-poseidons.util';
import { verifyContract } from '../test/utils/utils';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';

const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  const stateAddress = await getStateContractAddress();

  const [signer] = await ethers.getSigners();
  const [poseidon2Elements, poseidon3Elements, poseidon4Elements] =
    await getPoseidonsUnifiedAddresses(signer, [2, 3, 4]);

  const smtLib = await getSmtLib();

  const deployHelper = await OnchainIdentityDeployHelper.initialize([signer], true);
  const contracts = await deployHelper.deployIdentity(
    stateAddress,
    smtLib,
    poseidon3Elements,
    poseidon4Elements
  );

  const identity = contracts.identity;
  const claimBuilder = contracts.claimBuilder;
  const identityLib = contracts.identityLib;

  await verifyContract(hre, await claimBuilder.getAddress(), {
    constructorArgsImplementation: [],
    libraries: {}
  });
  await verifyContract(hre, await identityLib.getAddress(), {
    constructorArgsImplementation: [],
    libraries: {}
  });

  await verifyContract(hre, await identity.getAddress(), {
    constructorArgsImplementation: [],
    constructorArgsProxy: [],
    constructorArgsProxyAdmin: [await signer.getAddress()],
    libraries: {
      'contracts/lib/ClaimBuilder.sol:ClaimBuilder': await claimBuilder.getAddress(),
      'contracts/lib/IdentityLib.sol:IdentityLib': await identityLib.getAddress()
    }
  });
  await verifyContract(
    hre,
    await getImplementationAddress(signer.provider, await identity.getAddress()),
    {
      constructorArgsImplementation: [],
      libraries: {}
    }
  );

  const outputJson = {
    state: stateAddress,
    smtLib: await smtLib.getAddress(),
    identity: await identity.getAddress(),
    claimBuilder: await claimBuilder.getAddress(),
    identityLib: await identityLib.getAddress(),
    poseidon2: await poseidon2Elements.getAddress(),
    poseidon3: await poseidon3Elements.getAddress(),
    poseidon4: await poseidon4Elements.getAddress(),
    network: process.env.HARDHAT_NETWORK
  };
  fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
