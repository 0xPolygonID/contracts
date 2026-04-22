import fs from 'fs';
import path from 'path';
import { BalanceCredentialIssuerDeployHelper } from '../test/helpers/BalanceCredentialIssuerDeployHelper';
import { getPoseidonsUnifiedAddresses } from '../test/utils/deploy-poseidons.util';
import hre, { ethers } from 'hardhat';
import { getStateContractAddress, getSmtLib } from '../test/utils/deploy-utils';
import { verifyContract } from '../test/utils/utils';
import { getImplementationAddress } from '@openzeppelin/upgrades-core';

const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  const stateAddress = await getStateContractAddress(); // replace with current iden3 state smart contract on the network you are deploying

  const [signer] = await ethers.getSigners();
  const [poseidon2Elements, poseidon3Elements, poseidon4Elements] =
    await getPoseidonsUnifiedAddresses(signer, [2, 3, 4]);
  const smtLib = await getSmtLib();

  const balanceCredentialIssuerDeployer = await BalanceCredentialIssuerDeployHelper.initialize(
    [signer],
    true
  );
  const contracts = await balanceCredentialIssuerDeployer.deployBalanceCredentialIssuer(
    smtLib,
    poseidon3Elements,
    poseidon4Elements,
    stateAddress
  );

  const balanceCredentialIssuer = contracts.balanceCredentialIssuer;
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
  await verifyContract(hre, await balanceCredentialIssuer.getAddress(), {
    constructorArgsImplementation: [],
    constructorArgsProxy: [],
    constructorArgsProxyAdmin: [await signer.getAddress()],
    libraries: {
      'contracts/lib/ClaimBuilder.sol:ClaimBuilder': await claimBuilder.getAddress(),
      'contracts/lib/IdentityLib.sol:IdentityLib': await identityLib.getAddress(),
      'contracts/lib/Poseidon.sol:PoseidonUnit4L': await poseidon4Elements.getAddress()
    }
  });
  await verifyContract(
    hre,
    await getImplementationAddress(signer.provider, await balanceCredentialIssuer.getAddress()),
    {
      constructorArgsImplementation: [],
      libraries: {}
    }
  );

  const outputJson = {
    state: stateAddress,
    smtLib: await smtLib.getAddress(),
    balanceCredentialIssuer: await balanceCredentialIssuer.getAddress(),
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
