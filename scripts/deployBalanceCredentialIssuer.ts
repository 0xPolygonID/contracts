import fs from 'fs';
import path from 'path';
import { BalanceCredentialIssuerDeployHelper } from '../test/helpers/BalanceCredentialIssuerDeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { ethers } from 'hardhat';
const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  const stateAddress = '0x3C9acB2205Aa72A05F6D77d708b5Cf85FCa3a896'; // replace with current iden3 state smart contract on the network you are deploying

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

  const balanceCredentialIssuerDeployer = await BalanceCredentialIssuerDeployHelper.initialize(
    [owner],
    true
  );
  const contracts = await balanceCredentialIssuerDeployer.deployBalanceCredentialIssuer(
    smtLib,
    poseidon3Elements,
    poseidon4Elements,
    stateAddress
  );

  const balanceCredentialIssuer = contracts.balanceCredentialIssuer;

  const outputJson = {
    state: stateAddress,
    smtLib: await smtLib.getAddress(),
    balanceCredentialIssuer: await balanceCredentialIssuer.getAddress(),
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
