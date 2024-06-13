import { ethers, run, upgrades } from 'hardhat';

async function main() {
  const contractName = 'VeraxZKPVerifier';
  const ERC20ContractFactory = await ethers.getContractFactory(contractName);
  const erc20instance = await upgrades.deployProxy(ERC20ContractFactory, []);

  await erc20instance.waitForDeployment();
  console.log(contractName, ' deployed to:', await erc20instance.getAddress());

  await run("verify:verify", {
    address: await erc20instance.getAddress(),
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
