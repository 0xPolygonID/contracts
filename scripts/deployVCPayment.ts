import { ethers } from 'hardhat';

async function main() {
  const contractName = 'VCPayment';
  const VCPayment = await ethers.getContractFactory(contractName);
  const contract = await VCPayment.deploy();
  console.log(contractName, ' deployed to:', await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
