import { StateDeployHelper } from '../../test/helpers/StateDeployHelper';

async function main() {
  const deployHelper = await StateDeployHelper.initialize(null, true);

  const { identityTreeStore} =
    await deployHelper.deployIdentityTreeStore('0xD8869a439a07Edcc990F8f21E638702ee9273293');

  }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
