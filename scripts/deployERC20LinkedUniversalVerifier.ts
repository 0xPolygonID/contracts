import { ethers } from 'hardhat';

const universalVerifierAddress = '<you universal verifier address here>';

async function main() {
  if (!ethers.isAddress(universalVerifierAddress)) {
    throw new Error('Please set universal verifier address');
  }
  const verifierName = 'ERC20LinkedUniversalVerifier';
  const verifierSymbol = 'zkERC20';

  const verifier = await ethers.deployContract(
    verifierName,
    [ universalVerifierAddress, verifierName, verifierSymbol ]
  );
  await verifier.waitForDeployment();
  console.log(verifierName, ' contract address:', await verifier.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
