import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  const validatorContractAddress = '0x8b9588bF3EA1F7B3C4cC2187eCF726F104f0F04F'; // your v2 mtp validator deployed address
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
