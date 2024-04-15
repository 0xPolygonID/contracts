import { ethers, upgrades } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { StateDeployHelper } from '../test/helpers/StateDeployHelper';
const pathOutputJson = path.join(__dirname, './deploy_validator_output.json');

async function main() {
  const validatorContractAddress = '0x03Ee09635E9946165dd9538e9414f0ACE57e42e1'; // mumbai
  const validatorContractName = 'CredentialAtomicQueryMTPV2Validator';

  const stateDeployHelper = await StateDeployHelper.initialize();

  const v = await stateDeployHelper.upgradeValidator(
    validatorContractAddress,
    validatorContractName
  );
  console.log(validatorContractName, 'validator upgraded on ', await v.validator.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
