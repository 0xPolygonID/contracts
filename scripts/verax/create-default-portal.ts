import { VeraxSdk, Conf } from "@verax-attestation-registry/verax-sdk";
import { lineaSepolia } from "viem/chains";

// const myVeraxConfiguratin = {
//   chain: lineaSepolia,
//   mode: 'BACKEND', // no exported SDKMode
//   subgraphUrl: "https://api.studio.thegraph.com/query/67521/verax-v1-linea-sepolia/v0.0.1",
//   portalRegistryAddress: "0xe5b5CBABa557BFC18fC66c74dFaBAe65702e0d89",
//   moduleRegistryAddress: "0x9f677f957D15451784E83d33a341bad6f9D1C65D",
//   schemaRegistryAddress: "0x8a439d5FA9E8014808ff0A6D92903C0DaB1fB0A2",
//   attestationRegistryAddress: "0xf76d5add093023C4cFE72d0a2f1c81541B23d832",
// };
const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;


// 0x7E8fdD0803BcC1A41cE432AdD07CA6C4E5F92eE2 - empty portal address
// 0x12b756507B0eEd99cDaa1F66A2aA0E7904C61a94 - Test arr portal
// 0x84d6Fe2e83C7E5646Ca7CD678209D7312aBcF4ca - ERC20SelectiveDisclosureVerifier portal address
async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const tx = await veraxSdk.portal.deployDefaultPortal(
    ['0xCd777CA89815a0A9990f8B9e2443694888131290'], "ERC20SelectiveDisclosureVerifier portal", "This Portal is used as an example for ERC20SelectiveDisclosureVerifier contract", false, "Iden3", true);

  console.log(tx);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
