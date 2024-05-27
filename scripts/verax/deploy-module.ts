import { ethers } from 'hardhat';
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

// 0xefDEC213B52ed164723DfD9723AC80F73d66fB80 - test array module
// 0x4F9AAA2E849fcAC816cf78827E61dAfe9051283E - ZKPVerifyModule
async function main() {
  // const ERC20SelectiveDisclosureVerifier = '0xa5f08979370AF7095cDeDb2B83425367316FAD0B';

  const ZKPVerifyModuleFactory = await ethers.getContractFactory("VerifierModule");
  const ZKPVerifyModule = await ZKPVerifyModuleFactory.deploy();
  await ZKPVerifyModule.waitForDeployment();
  console.log("VerifierModule deployed to:", await ZKPVerifyModule.getAddress());

  // register module
  const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
  const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);

  const tx = await veraxSdk.module.register(
    "VerifierModule",
    "This Module is used as an example of VerifierModule",
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
