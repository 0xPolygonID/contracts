import { VeraxSdk, Conf } from "@verax-attestation-registry/verax-sdk";
import { lineaSepolia } from "viem/chains";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

// 0x7E8fdD0803BcC1A41cE432AdD07CA6C4E5F92eE2 - empty portal address
async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const attestationId = '0x000000000000000000000000000000000000000000000000000000000000005f';
  const attestation = await veraxSdk.attestation.getAttestation(attestationId) as {attestationData:  `0x${string}`}; 

  console.log(attestation);

  const decoded = 
    veraxSdk.utils.decode(
      '(uint64 requestId, uint256 nullifierSessionID)',
      attestation.attestationData as `0x${string}`
    );
  console.log(decoded);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
