import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const moduleAddress = '0x39e8a6af9D5d1D36c4E5BC2f1F43902a6F9A7C54';
  const tx = await veraxSdk.portal.deployDefaultPortal(
    [moduleAddress], "ZKPVerifyModulePoL portal", "This Portal is used as an example for ZKPVerifyModulePoL contract", false, "Iden3", true);

  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
