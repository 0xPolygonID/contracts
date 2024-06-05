import { Id } from "@iden3/js-iden3-core";
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

const publicAddress: `0x${string}`= `0x${process.env.SEPOLIA_PUB_ADDRESS}`;
const privateKey: `0x${string}` = `0x${process.env.SEPOLIA_PRIVATE_KEY}`;

async function main() {
  const veraxSdk = new VeraxSdk(VeraxSdk.DEFAULT_LINEA_SEPOLIA, publicAddress, privateKey);
  const attestationId = '0x0000000000000000000000000000000000000000000000000000000000000106';
  const attestation = await veraxSdk.attestation.getAttestation(attestationId) as {attestationData:  `0x${string}`, subject: `0x${string}`}; 

  console.log(attestation);

  const decoded = 
    veraxSdk.utils.decode(
      '(uint64 requestId, uint256 nullifierSessionID)',
      attestation.attestationData as `0x${string}`
    );
  console.log(decoded);

  const decodedSubj = veraxSdk.utils.decode('uint256',
    attestation.subject)[0] as string;
  
  const userId = Id.fromBigInt(BigInt(decodedSubj));
  console.log(userId.bigInt());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
