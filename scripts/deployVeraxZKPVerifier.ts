import { ethers, upgrades } from 'hardhat';

async function main() {
  const contractName = 'VeraxZKPVerifier';
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await upgrades.deployProxy(ERC20ContractFactory, []);

  await erc20instance.waitForDeployment();
  console.log(contractName, ' deployed to:', await erc20instance.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
