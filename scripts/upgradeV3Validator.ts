import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  const validatorContractAddress = '0xeEf86C07547FBfb1F80a2B6F4446a022f8Dd5d39'; // your v3 validator deployed address
  const validatorContractName = 'CredentialAtomicQueryV3Validator';

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
