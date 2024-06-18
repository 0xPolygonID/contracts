import { StateDeployHelper } from '../../test/helpers/StateDeployHelper';

async function main() {
  const contractAddress = '';
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
