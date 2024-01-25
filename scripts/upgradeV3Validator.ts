import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
const pathOutputJson = path.join(__dirname, './deploy_validator_output.json');

async function main() {
  const validatorContractAddress = '0xCBde9B14fcF5d56B709234528C44798B4ea64761'; // mumbai
  const validatorContractName = 'CredentialAtomicQueryV3Validator';

  const stateDeployHelper = await StateDeployHelper.initialize();

  const v = await stateDeployHelper.upgradeValidator(
    validatorContractAddress,
    validatorContractName
  );
  console.log(validatorContractName, 'validator upgraded on ', v.validator.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
