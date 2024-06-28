import { StateDeployHelper } from '../../test/helpers/StateDeployHelper';

async function main() {
  const contractAddress = '0x07D5A8d32A3B42536c3019fD10F62A893aCc9021';
  const contractName = 'VeraxZKPVerifier';

  const stateDeployHelper = await StateDeployHelper.initialize();

  const v = await stateDeployHelper.upgradeZkpVerifier(
    contractAddress,
    contractName
  );
  console.log(contractName, 'verifier upgraded on ', await v.verifier.getAddress());

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
