import { Id } from "@iden3/js-iden3-core";
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const attestationId = '0x0000000000000000000000000000000000000000000000000000000000000137';
  const attestation = await veraxSdk.attestation.getAttestation(attestationId) as {attestationData:  `0x${string}`, subject: `0x${string}`}; 

  console.log(attestation);

  const decoded = 
    veraxSdk.utils.decode(
      '(uint64 requestId, uint256 nullifierSessionID, uint256 reputationLevel)',
      attestation.attestationData as `0x${string}`
    );
  console.log(decoded);
  console.log('sender', attestation.subject);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
