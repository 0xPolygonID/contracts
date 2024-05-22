import { ethers } from 'hardhat';

async function main() {
  const universalVerifierAddress = '<you universal verifier address here>';
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
