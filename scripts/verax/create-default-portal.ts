import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const moduleAddress = '0x4CB60066E9db643F244a04216BDEBC103D76A595';
  const tx = await veraxSdk.portal.deployDefaultPortal(
    [moduleAddress], "ZKPVerifyModulePoU portal", "This Portal is used as an example for ZKPVerifyModulePoU contract", false, "Iden3", true);

  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
