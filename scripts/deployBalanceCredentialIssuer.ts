import fs from 'fs';
import path from 'path';
import { BalanceCredentialIssuerDeployHelper } from '../test/helpers/BalanceCredentialIssuerDeployHelper';
import { deployPoseidons } from '../test/utils/deploy-poseidons.util';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
import { ethers } from 'hardhat';
const pathOutputJson = path.join(__dirname, './deploy_output.json');

async function main() {
  // const stateAddress = '0x624ce98D2d27b20b8f8d521723Df8fC4db71D79D'; // current iden3 state smart contract on main
  // const stateAddress = '0x134b1be34911e39a8397ec6289782989729807a4'; // current iden3 state smart contract on mumbai
  const stateAddress = '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124'; // current iden3 state smart contract on amoy
  // const universalVerifier = '0x1Df0B05F15b5ea9648B8a081aca8ad0dE065bD1F';
  const authV2Validator = '0x1a593E1aD3843b4363Dfa42585c4bBCA885553c0';

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
    stateAddress,
    authV2Validator
  );

  const balanceCredentialIssuer = contracts.balanceCredentialIssuer;

  const outputJson = {
    state: stateAddress,
    smtLib: await smtLib.getAddress(),
    balanceCredentialIssuer: await balanceCredentialIssuer.getAddress(),
    poseidon2: await poseidon2Elements.getAddress(),
    poseidon3: await poseidon3Elements.getAddress(),
    poseidon4: await poseidon4Elements.getAddress(),
    authV2Validator,
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
