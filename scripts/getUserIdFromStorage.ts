import { ethers } from 'hardhat';
import abi from './uniVerifier.abi';

async function main() {
  const signer = (await ethers.getSigners())[0];
  const contract = await ethers.getContractAt(abi, '0x1Df0B05F15b5ea9648B8a081aca8ad0dE065bD1F');
  contract.connect(signer);

  const userId = await contract.getProofStorageField(
    '0x2a75802212C3ba5E96afde9fD8e446aa6012a340',
    940499666,
    'userID'
  );

  console.log(userId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
