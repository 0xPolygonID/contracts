import { ethers } from 'hardhat';
import { Generosity } from '../typechain-types';

async function main() {
  const [deployer, claimer] = await ethers.getSigners();

  // Step 1: Deploy the Generosity contract
  // const generosity = (await ethers.deployContract('Generosity')) as unknown as Generosity;
  const generosity = await ethers.getContractAt(
    'Generosity',
    '0x9D0c02B11417d04856488F00CdF960978d3d7015'
  );

  console.log('Generosity contract deployed to:', await generosity.getAddress());

  // Step 2: Fund the contract with some Ether
  const fundTx = await deployer.sendTransaction({
    to: await generosity.getAddress(),
    value: ethers.parseEther('0.00002') // Funding with 0.00002 ETH
  });
  await fundTx.wait();

  console.log('Contract funded with 0.00002 ETH');

  const opCostSponsor = await deployer.sendTransaction({
    to: await claimer.getAddress(),
    value: ethers.parseEther('0.00001') // Funding with 0.00001 ETH
  });
  await opCostSponsor.wait();

  console.log('Contract funded with 0.00001 ETH');

  // Step 3: Call the claimGift function from another account
  const claimTx = await generosity.connect(claimer).claimGift();
  await claimTx.wait();

  console.log(`Gift claimed by: ${await claimer.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
