import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const moduleAddress = '0xF2a68Cb1ab2AE548943805695af580901A6C7B48';
  const tx = await veraxSdk.portal.deployDefaultPortal(
    [moduleAddress], "ZKPVerifyModule portal", "This Portal is used as an example for ZKPVerifyModule contract", false, "Iden3", true);

  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
