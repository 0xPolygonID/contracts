import fs from 'fs';
import path from 'path';
import { BalanceCredentialIssuerDeployHelper } from '../test/helpers/BalanceCredentialIssuerDeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { ethers } from 'hardhat';
const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  // const stateAddress = '0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D'; // current iden3 state smart contract on main
  const stateAddress = '0x134b1be34911e39a8397ec6289782989729807a4'; // current iden3 state smart contract on mumbai

  const owner = (await ethers.getSigners())[0];
  const [poseidon2Elements, poseidon3Elements, poseidon4Elements] = await deployPoseidons(
    owner,
    [2, 3, 4]
  );
  const stDeployHelper = await StateDeployHelper.initialize([owner], true);
  const smtLib = await stDeployHelper.deploySmtLib(
    poseidon2Elements.address,
    poseidon3Elements.address
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
    smtLib: smtLib.address,
    balanceCredentialIssuer: balanceCredentialIssuer.address,
    poseidon2: poseidon2Elements.address,
    poseidon3: poseidon3Elements.address,
    poseidon4: poseidon4Elements.address,
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
