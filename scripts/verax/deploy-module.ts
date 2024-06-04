import { ethers } from 'hardhat';
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

async function main() {
  const VeraxZKPVerifier = '0x1571fA0f7CCb065Fc8F27c221C0a4ad4ea8c2A46';

  const ZKPVerifyModuleFactory = await ethers.getContractFactory("ZKPVerifyModule");
  const ZKPVerifyModule = await ZKPVerifyModuleFactory.deploy(VeraxZKPVerifier);
  await ZKPVerifyModule.waitForDeployment();
  console.log("ZKPVerifyModule deployed to:", await ZKPVerifyModule.getAddress());

  // register module
  const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
  const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);

  const tx = await veraxSdk.module.register(
    "ZKPVerifyModule",
    "This Module is used as an example of ZKPVerifyModule",
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
