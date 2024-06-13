import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_MAINNET, publicAddress, privateKey);
  const moduleAddress = '0xD1d3e0524E676afe079D0b2acE58ec7aB4ddE11f';
  const tx = await veraxSdk.portal.deployDefaultPortal(
    [moduleAddress], "ZKPVerifyModulePoU portal", "This Portal is used for attestations verified by ZKPVerifyModulePoU module", false, "PrivadoID", true);

  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
