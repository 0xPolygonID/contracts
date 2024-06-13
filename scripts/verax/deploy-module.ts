import { ethers, run } from 'hardhat';
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

async function main() {
  const VeraxZKPVerifier = '0x91a3a28B401adDeBcb5Cd0b1364474fF6255F00b';

  const moduleName = 'ZKPVerifyModulePoL';
  const ZKPVerifyModuleFactory = await ethers.getContractFactory(moduleName);
  const ZKPVerifyModule = await ZKPVerifyModuleFactory.deploy(VeraxZKPVerifier);
  await ZKPVerifyModule.waitForDeployment();
  console.log(moduleName, " deployed to:", await ZKPVerifyModule.getAddress());

  await run("verify:verify", {
    address: await ZKPVerifyModule.getAddress(),
    constructorArguments: [VeraxZKPVerifier],
  });

  // register module
  const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
  const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);

  const tx = await veraxSdk.module.register(
    moduleName,
    "This Module is used as an example of " + moduleName,
    (await ZKPVerifyModule.getAddress()) as `0x${string}`,
    true
  );

  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
