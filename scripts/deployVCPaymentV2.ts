import { ethers, run, upgrades } from 'hardhat';
import { VCPaymentV2, VCPaymentV2__factory } from '../typechain-types';

async function main() {
  const [owner] = await ethers.getSigners();
  const proxy = (await upgrades.deployProxy(
    new VCPaymentV2__factory(owner)
  )) as unknown as VCPaymentV2;
  await proxy.waitForDeployment();

  await run('verify:verify', {
    address: await proxy.getAddress(),
    constructorArguments: []
  });

  console.log(VCPaymentV2__factory.name, ' deployed to:', await proxy.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
