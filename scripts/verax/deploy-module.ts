import { ethers, run } from 'hardhat';
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

async function main() {
  const VeraxZKPVerifier = '0x07D5A8d32A3B42536c3019fD10F62A893aCc9021';

  const moduleName = 'ZKPVerifyModulePoU';
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
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_MAINNET, publicAddress, privateKey);

  const tx = await veraxSdk.module.register(
    moduleName,
    "This Module is used to verify zkp by ZKPVerifyModulePoU verifier",
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
