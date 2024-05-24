import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

// ** SUMMARY **
// Router = 0x7B1a19AE8ebD814E45E64B4528A32317EBB5d8AA
// AttestationRegistry = 0xf76d5add093023C4cFE72d0a2f1c81541B23d832
// ModuleRegistry = 0x9f677f957D15451784E83d33a341bad6f9D1C65D
// PortalRegistry = 0xe5b5CBABa557BFC18fC66c74dFaBAe65702e0d89
// SchemaRegistry = 0x8a439d5FA9E8014808ff0A6D92903C0DaB1fB0A2
// AttestationReader = 0x8e4A144ee0f9D6696180E146CC33624353E614C4

// export const myVeraxConfiguratin = {
//     chain: lineaSepolia,
//     mode: 'BACKEND', // no exported SDKMode
//     subgraphUrl: "https://api.studio.thegraph.com/query/67521/verax-v1-linea-sepolia/v0.0.1",
//     portalRegistryAddress: "0xe5b5CBABa557BFC18fC66c74dFaBAe65702e0d89",
//     moduleRegistryAddress: "0x9f677f957D15451784E83d33a341bad6f9D1C65D",
//     schemaRegistryAddress: "0x8a439d5FA9E8014808ff0A6D92903C0DaB1fB0A2",
//     attestationRegistryAddress: "0xf76d5add093023C4cFE72d0a2f1c81541B23d832",
// };
export const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
export const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

// schema id - 0x59a0acecb3a782c9035cb1d0e8d5661f6848ebcb4d44c212c891d0fbc06c081e - "(uint64 requestId, uint256 nullifierSessionID)"
async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const schemaString = "(uint64 requestId)";

  const schemaTx = await veraxSdk.schema.create("Verification schema", 
    "Verification schema", "", schemaString, true);

  console.log(schemaTx);

  const schemaId = await veraxSdk.schema.getIdFromSchemaString(schemaString);
  console.log(schemaId);

  const schema = await veraxSdk.schema.getSchema(schemaId as string);
  console.log(schema);

  const matchingSchema = await veraxSdk.schema.findOneById(schemaId as string);
  console.log(matchingSchema);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
