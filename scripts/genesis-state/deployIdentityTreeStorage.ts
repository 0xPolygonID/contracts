import { StateDeployHelper } from '../../test/helpers/StateDeployHelper';

async function main() {
  const deployHelper = await StateDeployHelper.initialize(null, true);

  const { identityTreeStore} =
    await deployHelper.deployIdentityTreeStore('0x742673Fc2108d526fc3494d3780141552B660cAB');

  }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
