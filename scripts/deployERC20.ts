import fs from 'fs';
import path from 'path';
import { DeployHelper } from '../test/helpers/DeployHelper';
import { ethers } from 'hardhat';
const pathOutputJson = path.join(__dirname, './deploy_ERC20Verifier_output.json');

async function main() {
  const stateAddress = '0x1a4cC30f2aA0377b0c3bc9848766D90cb4404124'; // current iden3 state smart contract on amoy

  const owner = (await ethers.getSigners())[0];
  const deployer = await DeployHelper.initialize([owner], true);
  const { erc20Verifier } = await deployer.deployERC20Verifier(stateAddress);

  const outputJson = {
    state: stateAddress,
    erc20Verifier: await erc20Verifier.getAddress(),
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
