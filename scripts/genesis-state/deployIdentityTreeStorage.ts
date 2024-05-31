import { StateDeployHelper } from '../../test/helpers/StateDeployHelper';

async function main() {
  const deployHelper = await StateDeployHelper.initialize(null, true);

  const { identityTreeStore} =
    await deployHelper.deployIdentityTreeStore('0x9c905B15D6EAd043cfce50Bb93eeF36279153d03');

  }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
