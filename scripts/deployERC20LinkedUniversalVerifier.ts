import { ethers } from 'hardhat';
import { verifyContract } from '../test/utils/utils';

const universalVerifierAddress = '0x2B0D3f664A5EbbfBD76E6cbc2cA9A504a68d2F4F'; // your universal verifier address here

async function main() {
  if (!ethers.isAddress(universalVerifierAddress)) {
    throw new Error('Please set universal verifier address');
  }
  const verifierName = 'ERC20LinkedUniversalVerifier';
  const verifierSymbol = 'zkERC20';

  const verifier = await ethers.deployContract(verifierName, [
    universalVerifierAddress,
    verifierName,
    verifierSymbol
  ]);
  await verifier.waitForDeployment();
  console.log(verifierName, ' contract address:', await verifier.getAddress());

  console.log('Verifying contracts...');
  await verifyContract(hre, await verifier.getAddress(), {
    constructorArgsImplementation: [universalVerifierAddress, verifierName, verifierSymbol],
    libraries: {}
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
