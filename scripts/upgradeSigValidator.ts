import { StateDeployHelper } from '../test/helpers/StateDeployHelper';

async function main() {
  const validatorContractAddress = '0xa4035dd68609584f47a83E84fBd9CbBA2C344C89'; // your v2 sig validator deployed address
  const validatorContractName = 'CredentialAtomicQuerySigV2Validator';

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
